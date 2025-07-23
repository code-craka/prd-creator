import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CollaborativePRDEditor from '../../components/prd/CollaborativePRDEditor';

// Mock all the hooks and services
vi.mock('../../hooks/useCollaboration', () => ({
  useCollaboration: vi.fn(() => ({
    isConnected: true,
    activeUsers: [],
    documentState: null,
    comments: [],
    presenceData: new Map(),
    joinDocument: vi.fn(),
    leaveDocument: vi.fn(),
    sendOperation: vi.fn(),
    updatePresence: vi.fn(),
    addComment: vi.fn(),
    resolveComment: vi.fn(),
    requestAISuggestions: vi.fn(),
    onOperationReceived: vi.fn(),
    onPresenceUpdate: vi.fn(),
    onCommentAdded: vi.fn(),
    onCommentResolved: vi.fn(),
    onUserJoined: vi.fn(),
    onUserLeft: vi.fn(),
    onAISuggestions: vi.fn(),
    onError: vi.fn()
  }))
}));

vi.mock('../../hooks/useAI', () => ({
  useAI: vi.fn(() => ({
    generateSuggestions: vi.fn(),
    isGeneratingSuggestions: false,
    generatePRD: vi.fn(),
    isGenerating: false,
    improveSection: vi.fn(),
    isImproving: false,
    createPRDFromAI: vi.fn(),
    isCreating: false,
    templates: null,
    isLoadingTemplates: false,
    validateKeys: vi.fn(),
    keyValidation: null,
    error: null,
    clearError: vi.fn()
  }))
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('CollaborativePRDEditor', () => {
  const mockOnContentChange = vi.fn();
  const mockOnSave = vi.fn();
  const mockInitialContent = '# Overview\nTest content';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <CollaborativePRDEditor
          prdId="test-prd-1"
          initialContent={mockInitialContent}
          onContentChange={mockOnContentChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Start writing your PRD...')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    render(
      <TestWrapper>
        <CollaborativePRDEditor
          prdId="test-prd-1"
          initialContent={mockInitialContent}
          onContentChange={mockOnContentChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows AI suggestions button', () => {
    render(
      <TestWrapper>
        <CollaborativePRDEditor
          prdId="test-prd-1"
          initialContent={mockInitialContent}
          onContentChange={mockOnContentChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /ai suggestions/i })).toBeInTheDocument();
  });

  it('allows editing content', async () => {
    render(
      <TestWrapper>
        <CollaborativePRDEditor
          prdId="test-prd-1"
          initialContent={mockInitialContent}
          onContentChange={mockOnContentChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    const textarea = screen.getByRole('textbox');
    const newContent = '# Overview\nUpdated content';
    
    fireEvent.change(textarea, { target: { value: newContent } });

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(newContent);
    });
  });

  it('shows collaboration indicators', async () => {
    const { useCollaboration } = await import('../../hooks/useCollaboration');
    
    vi.mocked(useCollaboration).mockReturnValue({
      isConnected: true,
      activeUsers: [
        { id: 'user-2', name: 'John Doe', email: 'john@example.com', avatar_url: '/avatar.jpg' }
      ],
      documentState: null,
      comments: [],
      presenceData: new Map(),
      joinDocument: vi.fn(),
      leaveDocument: vi.fn(),
      sendOperation: vi.fn(),
      updatePresence: vi.fn(),
      addComment: vi.fn(),
      resolveComment: vi.fn(),
      requestAISuggestions: vi.fn(),
      onOperationReceived: vi.fn(),
      onPresenceUpdate: vi.fn(),
      onCommentAdded: vi.fn(),
      onCommentResolved: vi.fn(),
      onUserJoined: vi.fn(),
      onUserLeft: vi.fn(),
      onAISuggestions: vi.fn(),
      onError: vi.fn()
    });

    render(
      <TestWrapper>
        <CollaborativePRDEditor
          prdId="test-prd-1"
          initialContent={mockInitialContent}
          onContentChange={mockOnContentChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Active Users (1)')).toBeInTheDocument();
  });

  it('shows loading state during AI suggestions', async () => {
    const { useAI } = await import('../../hooks/useAI');
    
    vi.mocked(useAI).mockReturnValue({
      generateSuggestions: vi.fn(),
      isGeneratingSuggestions: true,
      generatePRD: vi.fn(),
      isGenerating: false,
      improveSection: vi.fn(),
      isImproving: false,
      createPRDFromAI: vi.fn(),
      isCreating: false,
      templates: undefined,
      isLoadingTemplates: false,
      validateKeys: vi.fn(),
      keyValidation: undefined,
      error: null,
      clearError: vi.fn()
    });

    render(
      <TestWrapper>
        <CollaborativePRDEditor
          prdId="test-prd-1"
          initialContent={mockInitialContent}
          onContentChange={mockOnContentChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    const aiButton = screen.getByRole('button', { name: /ai suggestions/i });
    expect(aiButton).toBeDisabled();
  });
});