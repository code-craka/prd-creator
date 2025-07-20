import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

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
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface DocumentState {
  content: string;
  version: number;
  users: CollaborationUser[];
}

export interface CollaborationHook {
  isConnected: boolean;
  activeUsers: CollaborationUser[];
  documentState: DocumentState | null;
  comments: Comment[];
  presenceData: Map<string, PresenceUpdate>;
  
  // Document operations
  joinDocument: (prdId: string) => void;
  leaveDocument: (prdId: string) => void;
  sendOperation: (operation: Omit<DocumentOperation, 'id' | 'userId' | 'timestamp' | 'applied'>) => void;
  
  // Presence
  updatePresence: (update: Omit<PresenceUpdate, 'userId'>) => void;
  
  // Comments
  addComment: (comment: Omit<Comment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  resolveComment: (commentId: string) => void;
  
  // AI features
  requestAISuggestions: (section: string, content: string, context?: string) => void;
  
  // Event handlers
  onOperationReceived: (callback: (operation: DocumentOperation) => void) => void;
  onPresenceUpdate: (callback: (update: PresenceUpdate) => void) => void;
  onCommentAdded: (callback: (comment: Comment) => void) => void;
  onCommentResolved: (callback: (data: { commentId: string; resolvedBy: string }) => void) => void;
  onUserJoined: (callback: (user: CollaborationUser) => void) => void;
  onUserLeft: (callback: (data: { userId: string }) => void) => void;
  onAISuggestions: (callback: (data: { section: string; suggestions: string[] }) => void) => void;
  onError: (callback: (error: { message: string }) => void) => void;
}

export const useCollaboration = (prdId?: string): CollaborationHook => {
  const { user, token } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [documentState, setDocumentState] = useState<DocumentState | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [presenceData, setPresenceData] = useState<Map<string, PresenceUpdate>>(new Map());
  
  const eventHandlersRef = useRef<{
    onOperationReceived?: (operation: DocumentOperation) => void;
    onPresenceUpdate?: (update: PresenceUpdate) => void;
    onCommentAdded?: (comment: Comment) => void;
    onCommentResolved?: (data: { commentId: string; resolvedBy: string }) => void;
    onUserJoined?: (user: CollaborationUser) => void;
    onUserLeft?: (data: { userId: string }) => void;
    onAISuggestions?: (data: { section: string; suggestions: string[] }) => void;
    onError?: (error: { message: string }) => void;
  }>({});

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    // Connection handlers
    socketInstance.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
      setActiveUsers([]);
      setDocumentState(null);
    });

    // Document state handler
    socketInstance.on('document-state', (state: DocumentState) => {
      setDocumentState(state);
      setActiveUsers(state.users);
    });

    // Document operation handlers
    socketInstance.on('document-operation', (operation: DocumentOperation) => {
      eventHandlersRef.current.onOperationReceived?.(operation);
    });

    // User presence handlers
    socketInstance.on('user-joined', (user: CollaborationUser) => {
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      eventHandlersRef.current.onUserJoined?.(user);
    });

    socketInstance.on('user-left', (data: { userId: string }) => {
      setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
      setPresenceData(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      eventHandlersRef.current.onUserLeft?.(data);
    });

    socketInstance.on('presence-update', (update: PresenceUpdate) => {
      setPresenceData(prev => new Map(prev.set(update.userId, update)));
      
      // Update user cursor/selection in active users
      setActiveUsers(prev => prev.map(user => {
        if (user.id === update.userId) {
          const updatedUser = { ...user };
          if (update.type === 'cursor') {
            updatedUser.cursor = {
              section: update.data.section || '',
              position: update.data.position || 0,
            };
          } else if (update.type === 'selection') {
            updatedUser.selection = {
              section: update.data.section || '',
              start: update.data.start || 0,
              end: update.data.end || 0,
            };
          }
          return updatedUser;
        }
        return user;
      }));
      
      eventHandlersRef.current.onPresenceUpdate?.(update);
    });

    // Comment handlers
    socketInstance.on('document-comments', (documentComments: Comment[]) => {
      setComments(documentComments);
    });

    socketInstance.on('comment-added', (comment: Comment) => {
      setComments(prev => [...prev, comment]);
      eventHandlersRef.current.onCommentAdded?.(comment);
    });

    socketInstance.on('comment-resolved', (data: { commentId: string; resolvedBy: string }) => {
      setComments(prev => prev.map(comment => 
        comment.id === data.commentId 
          ? { ...comment, resolved: true }
          : comment
      ));
      eventHandlersRef.current.onCommentResolved?.(data);
    });

    // AI suggestions handler
    socketInstance.on('ai-suggestions', (data: { section: string; suggestions: string[] }) => {
      eventHandlersRef.current.onAISuggestions?.(data);
    });

    // Error handler
    socketInstance.on('error', (error: { message: string }) => {
      console.error('Collaboration error:', error);
      eventHandlersRef.current.onError?.(error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]);

  // Auto-join document when prdId changes
  useEffect(() => {
    if (socket && isConnected && prdId) {
      joinDocument(prdId);
    }
    
    return () => {
      if (socket && prdId) {
        leaveDocument(prdId);
      }
    };
  }, [socket, isConnected, prdId]);

  const joinDocument = useCallback((documentId: string) => {
    if (!socket) return;
    socket.emit('join-document', { prdId: documentId });
  }, [socket]);

  const leaveDocument = useCallback((documentId: string) => {
    if (!socket) return;
    socket.emit('leave-document', { prdId: documentId });
  }, [socket]);

  const sendOperation = useCallback((operation: Omit<DocumentOperation, 'id' | 'userId' | 'timestamp' | 'applied'>) => {
    if (!socket || !prdId) return;
    socket.emit('document-operation', { prdId, operation });
  }, [socket, prdId]);

  const updatePresence = useCallback((update: Omit<PresenceUpdate, 'userId'>) => {
    if (!socket || !prdId) return;
    socket.emit('presence-update', { prdId, update });
  }, [socket, prdId]);

  const addComment = useCallback((comment: Omit<Comment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!socket || !prdId) return;
    socket.emit('add-comment', { prdId, comment });
  }, [socket, prdId]);

  const resolveComment = useCallback((commentId: string) => {
    if (!socket || !prdId) return;
    socket.emit('resolve-comment', { prdId, commentId });
  }, [socket, prdId]);

  const requestAISuggestions = useCallback((section: string, content: string, context?: string) => {
    if (!socket || !prdId) return;
    socket.emit('request-ai-suggestions', { prdId, section, content, context });
  }, [socket, prdId]);

  // Event handler setters
  const onOperationReceived = useCallback((callback: (operation: DocumentOperation) => void) => {
    eventHandlersRef.current.onOperationReceived = callback;
  }, []);

  const onPresenceUpdate = useCallback((callback: (update: PresenceUpdate) => void) => {
    eventHandlersRef.current.onPresenceUpdate = callback;
  }, []);

  const onCommentAdded = useCallback((callback: (comment: Comment) => void) => {
    eventHandlersRef.current.onCommentAdded = callback;
  }, []);

  const onCommentResolved = useCallback((callback: (data: { commentId: string; resolvedBy: string }) => void) => {
    eventHandlersRef.current.onCommentResolved = callback;
  }, []);

  const onUserJoined = useCallback((callback: (user: CollaborationUser) => void) => {
    eventHandlersRef.current.onUserJoined = callback;
  }, []);

  const onUserLeft = useCallback((callback: (data: { userId: string }) => void) => {
    eventHandlersRef.current.onUserLeft = callback;
  }, []);

  const onAISuggestions = useCallback((callback: (data: { section: string; suggestions: string[] }) => void) => {
    eventHandlersRef.current.onAISuggestions = callback;
  }, []);

  const onError = useCallback((callback: (error: { message: string }) => void) => {
    eventHandlersRef.current.onError = callback;
  }, []);

  return {
    isConnected,
    activeUsers,
    documentState,
    comments,
    presenceData,
    joinDocument,
    leaveDocument,
    sendOperation,
    updatePresence,
    addComment,
    resolveComment,
    requestAISuggestions,
    onOperationReceived,
    onPresenceUpdate,
    onCommentAdded,
    onCommentResolved,
    onUserJoined,
    onUserLeft,
    onAISuggestions,
    onError,
  };
};