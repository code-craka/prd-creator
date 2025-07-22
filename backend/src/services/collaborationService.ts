import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verify } from 'jsonwebtoken';
import { db } from '../config/database';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  socketId: string;
  cursor: { position: number; selection: { start: number; end: number } };
  lastActivity: Date;
}

interface DocumentSession {
  prdId: string;
  document: {
    content: string;
    version: number;
  };
  participants: Map<string, CollaborationUser>;
  operations: Array<DocumentOperation & { timestamp: Date; userId: string }>;
  lastSaved: Date;
}

interface DocumentOperation {
  type: 'insert' | 'delete' | 'replace';
  prdId: string;
  position: number;
  content: string;
  length: number;
  userId: string;
  section?: string;
}

export class CollaborationService {
  private io: SocketIOServer;
  private activeSessions: Map<string, DocumentSession> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use((socket, next) => CollaborationService.authenticateSocket(socket, next));

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.user.id;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);
      this.socketUsers.set(socket.id, userId);

      socket.on('join-document', async (data: { prdId: string }) => {
        await this.handleJoinDocument(socket, data.prdId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private static async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
      const user = await db('users').where('id', decoded.userId).first();

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  }

  private async handleJoinDocument(socket: Socket, prdId: string): Promise<void> {
    const user = socket.data.user;
    
    // Check access permissions
    const prd = await db('prds').where('id', prdId).first();
    if (!prd) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    // Create or get session
    let session = this.activeSessions.get(prdId);
    if (!session) {
      session = {
        prdId,
        document: {
          content: prd.content || '',
          version: 1,
        },
        participants: new Map(),
        operations: [],
        lastSaved: new Date(),
      };
      this.activeSessions.set(prdId, session);
    }

    // Add user to session
    session.participants.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      socketId: socket.id,
      cursor: { position: 0, selection: { start: 0, end: 0 } },
      lastActivity: new Date(),
    });

    socket.join(`document:${prdId}`);
    socket.emit('document-state', { content: session.document.content });
  }

  private handleDisconnect(socket: Socket): void {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.socketUsers.delete(socket.id);

    // Clean up sessions
    for (const [prdId, session] of this.activeSessions.entries()) {
      if (session.participants.has(userId)) {
        session.participants.delete(userId);
        if (session.participants.size === 0) {
          this.activeSessions.delete(prdId);
        }
      }
    }
  }
}

// Export singleton
let collaborationService: CollaborationService;

export const initializeCollaborationService = (server: HTTPServer): CollaborationService => {
  if (!collaborationService) {
    collaborationService = new CollaborationService(server);
  }
  return collaborationService;
};

export { collaborationService };