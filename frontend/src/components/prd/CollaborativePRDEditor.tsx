import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Users,
  MessageSquare,
  Lightbulb,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useAI } from '../../hooks/useAI';
import { toast } from 'react-hot-toast';

interface CollaborativePRDEditorProps {
  prdId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  isReadOnly?: boolean;
}

interface UserCursor {
  userId: string;
  section: string;
  position: number;
  color: string;
}

interface SectionComment {
  id: string;
  section: string;
  position: number;
  content: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  resolved: boolean;
  createdAt: Date;
}

const CollaborativePRDEditor: React.FC<CollaborativePRDEditorProps> = ({
  prdId,
  initialContent,
  onContentChange,
  onSave,
  isReadOnly = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showComments, setShowComments] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    isConnected,
    activeUsers,
    comments,
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
  } = useCollaboration(prdId);

  const { generateSuggestions, isGeneratingSuggestions } = useAI();

  // User colors for cursors and selections
  const userColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  const getUserColor = useCallback((userId: string) => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return userColors[Math.abs(hash) % userColors.length];
  }, []);

  // Handle incoming operations
  useEffect(() => {
    onOperationReceived((operation) => {
      if (operation.applied) {
        // Apply the operation to local content
        const sections = parseContentSections(content);
        let sectionContent = sections[operation.section] || '';
        
        switch (operation.type) {
          case 'insert':
            if (operation.content && operation.position >= 0) {
              sectionContent = sectionContent.slice(0, operation.position) + 
                            operation.content + 
                            sectionContent.slice(operation.position);
            }
            break;
          case 'delete':
            if (operation.length && operation.position >= 0) {
              sectionContent = sectionContent.slice(0, operation.position) + 
                            sectionContent.slice(operation.position + operation.length);
            }
            break;
          case 'replace':
            if (operation.content && operation.length && operation.position >= 0) {
              sectionContent = sectionContent.slice(0, operation.position) + 
                            operation.content + 
                            sectionContent.slice(operation.position + operation.length);
            }
            break;
        }
        
        sections[operation.section] = sectionContent;
        const newContent = reassembleContent(sections);
        setContent(newContent);
        onContentChange(newContent);
      }
    });

    onPresenceUpdate((update) => {
      if (update.type === 'cursor' && update.data.section && update.data.position !== undefined) {
        setUserCursors(prev => new Map(prev.set(update.userId, {
          userId: update.userId,
          section: update.data.section!,
          position: update.data.position!,
          color: getUserColor(update.userId),
        })));
      }
    });

    onUserJoined((user) => {
      toast.success(`${user.name} joined the document`);
    });

    onUserLeft((data) => {
      const user = activeUsers.find(u => u.id === data.userId);
      if (user) {
        toast(`${user.name} left the document`);
      }
      setUserCursors(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    });

    onAISuggestions((data) => {
      setSuggestions(data.suggestions);
      setLoadingSuggestions(false);
    });

    onError((error) => {
      toast.error(error.message);
    });
  }, [onOperationReceived, onPresenceUpdate, onUserJoined, onUserLeft, onAISuggestions, onError, content, onContentChange, activeUsers, getUserColor]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (isReadOnly) return;

    const sections = parseContentSections(content);
    const newSections = parseContentSections(newContent);

    // Find which section changed and send operation
    for (const [section, sectionContent] of Object.entries(newSections)) {
      const oldContent = sections[section] || '';
      if (sectionContent !== oldContent) {
        // For simplicity, we'll send a replace operation for the entire section
        sendOperation({
          type: 'replace',
          section,
          position: 0,
          content: sectionContent,
          length: oldContent.length,
        });
        break;
      }
    }

    setContent(newContent);
    onContentChange(newContent);
  }, [content, isReadOnly, sendOperation, onContentChange]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current || isReadOnly) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const section = getSectionAtPosition(content, cursorPosition);

    if (section !== activeSection) {
      setActiveSection(section);
    }

    // Debounce cursor updates
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    cursorUpdateTimeoutRef.current = setTimeout(() => {
      updatePresence({
        type: 'cursor',
        data: {
          section,
          position: cursorPosition,
        },
      });
    }, 100);
  }, [content, activeSection, isReadOnly, updatePresence]);

  // Handle AI suggestions
  const handleGetSuggestions = useCallback(async () => {
    if (!activeSection || loadingSuggestions) return;

    setLoadingSuggestions(true);
    
    try {
      const sections = parseContentSections(content);
      const sectionContent = sections[activeSection] || '';
      
      requestAISuggestions(activeSection, sectionContent);
    } catch (error) {
      setLoadingSuggestions(false);
      toast.error('Failed to get AI suggestions');
    }
  }, [activeSection, content, loadingSuggestions, requestAISuggestions]);

  // Handle adding comments
  const handleAddComment = useCallback((commentContent: string, position: number) => {
    if (!activeSection) return;

    addComment({
      prdId,
      section: activeSection,
      position,
      content: commentContent,
      resolved: false,
    });
  }, [activeSection, prdId, addComment]);

  // Utility functions
  const parseContentSections = (contentText: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    const lines = contentText.split('\n');
    let currentSection = 'introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.replace(/^#+\s*/, '').toLowerCase().replace(/\s+/g, '-');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  };

  const reassembleContent = (sections: Record<string, string>): string => {
    let result = '';
    for (const [section, sectionContent] of Object.entries(sections)) {
      const title = section.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      result += `# ${title}\n\n${sectionContent}\n\n`;
    }
    return result.trim();
  };

  const getSectionAtPosition = (contentText: string, position: number): string => {
    const lines = contentText.split('\n');
    let currentPosition = 0;
    let currentSection = 'introduction';

    for (const line of lines) {
      if (currentPosition >= position) {
        break;
      }
      
      if (line.startsWith('#')) {
        currentSection = line.replace(/^#+\s*/, '').toLowerCase().replace(/\s+/g, '-');
      }
      
      currentPosition += line.length + 1; // +1 for newline
    }

    return currentSection;
  };

  const sectionComments = comments.filter(comment => comment.section === activeSection);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-white/70">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {activeSection && (
            <div className="text-sm text-white/70">
              Editing: <span className="text-purple-400 font-medium">{activeSection}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGetSuggestions}
            disabled={!activeSection || loadingSuggestions || isGeneratingSuggestions}
            className="flex items-center space-x-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSuggestions || isGeneratingSuggestions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="text-sm">AI Suggestions</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`p-2 rounded-lg transition-colors ${
              showComments ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShowUsers(!showUsers)}
            className={`p-2 rounded-lg transition-colors ${
              showUsers ? 'bg-green-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleCursorChange}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              className="w-full h-full bg-transparent border border-white/10 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              placeholder="Start writing your PRD..."
              disabled={isReadOnly}
            />
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4 border-t border-white/10">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium text-purple-300">AI Suggestions</h3>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-white/80">{suggestion}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSuggestions([])}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300"
                >
                  Dismiss suggestions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-white/10 flex flex-col">
          {/* Active Users */}
          {showUsers && (
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Active Users ({activeUsers.length})</span>
              </h3>
              <div className="space-y-2">
                {activeUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                        style={{ borderColor: getUserColor(user.id), borderWidth: 2 }}
                      />
                    ) : (
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: getUserColor(user.id) }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      {user.cursor && (
                        <p className="text-xs text-white/50">
                          Editing: {user.cursor.section}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {showComments && (
            <div className="flex-1 p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Comments ({sectionComments.length})</span>
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sectionComments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {comment.user?.avatar_url ? (
                          <img
                            src={comment.user.avatar_url}
                            alt={comment.user.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">
                          {comment.user?.name || 'Unknown User'}
                        </span>
                      </div>
                      
                      {!comment.resolved && (
                        <button
                          onClick={() => resolveComment(comment.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-white/80 mb-2">{comment.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </span>
                      {comment.resolved && (
                        <span className="text-xs text-green-400 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              {activeSection && !isReadOnly && (
                <div className="mt-4">
                  <CommentForm onSubmit={(content) => handleAddComment(content, 0)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Comment Form Component
interface CommentFormProps {
  onSubmit: (content: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full h-20 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        Add Comment
      </button>
    </form>
  );
};

export default CollaborativePRDEditor;