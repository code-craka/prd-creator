import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { prdService } from './prdService';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  cursor?: {
    section: string;
    position: number;
  };
  selection?: {
    section: string;
    start: number;
    end: number;
  };
}

export interface DocumentSession {
  prdId: string;
  users: Map<string, CollaborationUser>;
  document: {
    content: string;
    lastModified: Date;
    version: number;
  };
  operations: DocumentOperation[];
}

export interface DocumentOperation {
  id: string;
  userId: string;
  type: 'insert' | 'delete' | 'replace';
  section: string;
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
  applied: boolean;
}

export interface PresenceUpdate {
  userId: string;
  type: 'cursor' | 'selection' | 'typing' | 'idle';
  data: {
    section?: string;
    position?: number;
    start?: number;
    end?: number;
    isTyping?: boolean;
  };
}

export interface Comment {
  id: string;
  prdId: string;
  userId: string;
  section: string;
  position: number;
  content: string;
  resolved: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CollaborationService {
  private io: SocketIOServer;
  private sessions: Map<string, DocumentSession> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: Socket) => {
      console.log(`User ${socket.data.user.id} connected with socket ${socket.id}`);

      // Track user socket mapping
      const userId = socket.data.user.id;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);
      this.socketUsers.set(socket.id, userId);

      // Handle joining a document session
      socket.on('join-document', async (data: { prdId: string }) => {
        try {
          await this.handleJoinDocument(socket, data.prdId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to join document';
          socket.emit('error', { message });
        }
      });

      // Handle leaving a document session
      socket.on('leave-document', (data: { prdId: string }) => {
        this.handleLeaveDocument(socket, data.prdId);
      });

      // Handle document operations
      socket.on('document-operation', async (data: {
        prdId: string;
        operation: Omit<DocumentOperation, 'id' | 'userId' | 'timestamp' | 'applied'>;
      }) => {
        try {
          await this.handleDocumentOperation(socket, data.prdId, data.operation);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to process document operation';
          socket.emit('error', { message });
        }
      });

      // Handle presence updates
      socket.on('presence-update', (data: {
        prdId: string;
        update: Omit<PresenceUpdate, 'userId'>;
      }) => {
        this.handlePresenceUpdate(socket, data.prdId, data.update);
      });

      // Handle comments
      socket.on('add-comment', async (data: {
        prdId: string;
        comment: Omit<Comment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
      }) => {
        try {
          await this.handleAddComment(socket, data.prdId, data.comment);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add comment';
          socket.emit('error', { message });
        }
      });

      socket.on('resolve-comment', async (data: {
        prdId: string;
        commentId: string;
      }) => {
        try {
          await this.handleResolveComment(socket, data.prdId, data.commentId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to resolve comment';
          socket.emit('error', { message });
        }
      });

      // Handle AI suggestions
      socket.on('request-ai-suggestions', async (data: {
        prdId: string;
        section: string;
        content: string;
        context?: string;
      }) => {
        try {
          await this.handleAISuggestions(socket, data);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to get AI suggestions';
          socket.emit('error', { message });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
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
    // Verify user has access to the PRD
    const prd = await prdService.getPRD(prdId, socket.data.user.id);
    
    // Join the document room
    socket.join(`document:${prdId}`);

    // Get or create session
    let session = this.sessions.get(prdId);
    if (!session) {
      session = {
        prdId,
        users: new Map(),
        document: {
          content: prd.content,
          lastModified: new Date(prd.updated_at),
          version: 1,
        },
        operations: [],
      };
      this.sessions.set(prdId, session);
    }

    // Add user to session
    const collaborationUser: CollaborationUser = {
      id: socket.data.user.id,
      name: socket.data.user.name,
      email: socket.data.user.email,
      avatar_url: socket.data.user.avatar_url,
    };
    session.users.set(socket.data.user.id, collaborationUser);

    // Send current document state to the joining user
    socket.emit('document-state', {
      content: session.document.content,
      version: session.document.version,
      users: Array.from(session.users.values()),
    });

    // Notify other users that someone joined
    socket.to(`document:${prdId}`).emit('user-joined', collaborationUser);

    // Send recent comments
    const comments = await this.getDocumentComments(prdId);
    socket.emit('document-comments', comments);
  }

  private handleLeaveDocument(socket: Socket, prdId: string): void {
    socket.leave(`document:${prdId}`);

    const session = this.sessions.get(prdId);
    if (session) {
      session.users.delete(socket.data.user.id);
      
      // Notify other users that someone left
      socket.to(`document:${prdId}`).emit('user-left', {
        userId: socket.data.user.id,
      });

      // Clean up empty sessions
      if (session.users.size === 0) {
        this.sessions.delete(prdId);
      }
    }
  }

  private async handleDocumentOperation(
    socket: Socket,
    prdId: string,
    operationData: Omit<DocumentOperation, 'id' | 'userId' | 'timestamp' | 'applied'>
  ): Promise<void> {
    const session = this.sessions.get(prdId);
    if (!session) {
      throw new Error('Document session not found');
    }

    // Create operation
    const operation: DocumentOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId: socket.data.user.id,
      timestamp: new Date(),
      applied: false,
      ...operationData,
    };

    // Apply operation to document
    const success = this.applyOperation(session, operation);
    if (!success) {
      socket.emit('operation-rejected', { operationId: operation.id });
      return;
    }

    // Add to operations history
    session.operations.push(operation);
    
    // Keep only recent operations (last 100)
    if (session.operations.length > 100) {
      session.operations = session.operations.slice(-100);
    }

    // Broadcast operation to other users
    socket.to(`document:${prdId}`).emit('document-operation', operation);

    // Periodically save to database
    if (session.operations.length % 10 === 0) {
      this.saveDocumentToDatabase(prdId, session.document.content);
    }
  }

  private applyOperation(session: DocumentSession, operation: DocumentOperation): boolean {
    try {
      const sections = this.parseDocumentSections(session.document.content);
      const sectionContent = sections[operation.section] || '';

      let newContent = sectionContent;
      
      switch (operation.type) {
        case 'insert':
          if (operation.content && operation.position >= 0 && operation.position <= sectionContent.length) {
            newContent = sectionContent.slice(0, operation.position) + 
                        operation.content + 
                        sectionContent.slice(operation.position);
          } else {
            return false;
          }
          break;

        case 'delete':
          if (operation.length && operation.position >= 0 && 
              operation.position + operation.length <= sectionContent.length) {
            newContent = sectionContent.slice(0, operation.position) + 
                        sectionContent.slice(operation.position + operation.length);
          } else {
            return false;
          }
          break;

        case 'replace':
          if (operation.content && operation.length && operation.position >= 0 && 
              operation.position + operation.length <= sectionContent.length) {
            newContent = sectionContent.slice(0, operation.position) + 
                        operation.content + 
                        sectionContent.slice(operation.position + operation.length);
          } else {
            return false;
          }
          break;

        default:
          return false;
      }

      // Update the document
      sections[operation.section] = newContent;
      session.document.content = this.reassembleDocument(sections);
      session.document.version++;
      session.document.lastModified = new Date();
      operation.applied = true;

      return true;
    } catch (error) {
      console.error('Error applying operation:', error);
      return false;
    }
  }

  private handlePresenceUpdate(
    socket: Socket,
    prdId: string,
    updateData: Omit<PresenceUpdate, 'userId'>
  ): void {
    const session = this.sessions.get(prdId);
    if (!session) return;

    const user = session.users.get(socket.data.user.id);
    if (!user) return;

    // Update user presence
    const update: PresenceUpdate = {
      userId: socket.data.user.id,
      ...updateData,
    };

    switch (update.type) {
      case 'cursor':
        user.cursor = {
          section: update.data.section || '',
          position: update.data.position || 0,
        };
        break;
      case 'selection':
        user.selection = {
          section: update.data.section || '',
          start: update.data.start || 0,
          end: update.data.end || 0,
        };
        break;
    }

    // Broadcast to other users
    socket.to(`document:${prdId}`).emit('presence-update', update);
  }

  private async handleAddComment(
    socket: Socket,
    prdId: string,
    commentData: Omit<Comment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId: socket.data.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...commentData,
    };

    // Save to database
    await db('prd_comments').insert({
      id: comment.id,
      prd_id: comment.prdId,
      user_id: comment.userId,
      section: comment.section,
      position: comment.position,
      content: comment.content,
      resolved: comment.resolved,
      parent_id: comment.parentId,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt,
    });

    // Broadcast to all users in the document
    this.io.to(`document:${prdId}`).emit('comment-added', {
      ...comment,
      user: {
        id: socket.data.user.id,
        name: socket.data.user.name,
        avatar_url: socket.data.user.avatar_url,
      },
    });
  }

  private async handleResolveComment(
    socket: Socket,
    prdId: string,
    commentId: string
  ): Promise<void> {
    await db('prd_comments')
      .where({ id: commentId, prd_id: prdId })
      .update({ resolved: true, updated_at: new Date() });

    // Broadcast to all users in the document
    this.io.to(`document:${prdId}`).emit('comment-resolved', {
      commentId,
      resolvedBy: socket.data.user.id,
    });
  }

  private async handleAISuggestions(
    socket: Socket,
    data: {
      prdId: string;
      section: string;
      content: string;
      context?: string;
    }
  ): Promise<void> {
    // Import AI service dynamically to avoid circular dependencies
    const { aiService } = await import('./aiService');
    
    const suggestions = await aiService.generateSuggestions(
      data.content,
      data.section,
      data.context
    );

    socket.emit('ai-suggestions', {
      section: data.section,
      suggestions,
    });
  }

  private handleDisconnect(socket: Socket): void {
    const userId = socket.data.user?.id;
    if (!userId) return;

    console.log(`User ${userId} disconnected`);

    // Remove from user socket mapping
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socket.id);

    // Remove from all document sessions
    for (const [prdId, session] of this.sessions.entries()) {
      if (session.users.has(userId)) {
        // Check if user has any other active connections
        const hasOtherConnections = this.userSockets.has(userId) && 
          this.userSockets.get(userId)!.size > 0;

        if (!hasOtherConnections) {
          session.users.delete(userId);
          socket.to(`document:${prdId}`).emit('user-left', { userId });

          // Clean up empty sessions
          if (session.users.size === 0) {
            this.sessions.delete(prdId);
          }
        }
      }
    }
  }

  private parseDocumentSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = 'introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = line.replace(/^#+\s*/, '').toLowerCase().replace(/\s+/g, '-');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  private reassembleDocument(sections: Record<string, string>): string {
    const orderedSections = [
      'executive-summary',
      'problem-statement',
      'goals-and-objectives',
      'target-users',
      'user-stories',
      'functional-requirements',
      'non-functional-requirements',
      'technical-specifications',
      'ui-ux-considerations',
      'success-metrics',
      'timeline-and-milestones',
      'risks-and-mitigation',
      'dependencies',
      'appendix',
    ];

    let content = '';
    for (const section of orderedSections) {
      if (sections[section]) {
        const title = section.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        content += `# ${title}\n\n${sections[section]}\n\n`;
      }
    }

    // Add any remaining sections not in the ordered list
    for (const [section, sectionContent] of Object.entries(sections)) {
      if (!orderedSections.includes(section)) {
        const title = section.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        content += `# ${title}\n\n${sectionContent}\n\n`;
      }
    }

    return content.trim();
  }

  private async saveDocumentToDatabase(prdId: string, content: string): Promise<void> {
    try {
      await db('prds')
        .where('id', prdId)
        .update({
          content,
          updated_at: new Date(),
        });
    } catch (error) {
      console.error('Error saving document to database:', error);
    }
  }

  private async getDocumentComments(prdId: string): Promise<any[]> {
    return db('prd_comments')
      .join('users', 'prd_comments.user_id', 'users.id')
      .where('prd_comments.prd_id', prdId)
      .select([
        'prd_comments.*',
        'users.name as user_name',
        'users.avatar_url as user_avatar',
      ])
      .orderBy('prd_comments.created_at', 'asc');
  }

  // Public methods for external use
  public getActiveUsers(prdId: string): CollaborationUser[] {
    const session = this.sessions.get(prdId);
    return session ? Array.from(session.users.values()) : [];
  }

  public getSessionInfo(prdId: string): { userCount: number; version: number } | null {
    const session = this.sessions.get(prdId);
    return session ? {
      userCount: session.users.size,
      version: session.document.version,
    } : null;
  }

  public async forceSync(prdId: string): Promise<void> {
    const session = this.sessions.get(prdId);
    if (session) {
      await this.saveDocumentToDatabase(prdId, session.document.content);
    }
  }
}

export let collaborationService: CollaborationService;