import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { toast } from 'react-hot-toast';

export interface AIGenerationRequest {
  prompt: string;
  prdType: 'feature' | 'product' | 'api' | 'mobile' | 'web' | 'enhancement' | 'custom';
  context?: {
    company?: string;
    industry?: string;
    targetAudience?: string;
    existingProducts?: string[];
    timeline?: string;
    budget?: string;
    stakeholders?: string[];
    requirements?: string[];
  };
  style?: 'technical' | 'business' | 'executive' | 'detailed' | 'concise';
  sections?: string[];
  customInstructions?: string;
  provider?: {
    name: 'anthropic' | 'openai';
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export interface AIGenerationResponse {
  content: string;
  sections: { [key: string]: string };
  suggestions: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    confidence: number;
  };
}

export interface AITemplate {
  prdTypes: Array<{
    value: string;
    label: string;
    description: string;
    icon: string;
  }>;
  styles: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  providers: Array<{
    name: string;
    label: string;
    models: Array<{
      value: string;
      label: string;
      description: string;
      maxTokens: number;
      recommended: boolean;
    }>;
  }>;
  defaultSections: string[];
}

export interface UseAIHook {
  // Generation
  generatePRD: (request: AIGenerationRequest) => Promise<AIGenerationResponse>;
  isGenerating: boolean;
  
  // Suggestions
  generateSuggestions: (prdId: string, section: string, content: string, context?: string) => Promise<string[]>;
  isGeneratingSuggestions: boolean;
  
  // Improvement
  improveSection: (prdId: string, section: string, content: string, feedback: string) => Promise<string>;
  isImproving: boolean;
  
  // PRD Creation
  createPRDFromAI: (data: {
    title: string;
    aiResponse: AIGenerationResponse;
    teamId?: string;
    visibility?: 'private' | 'team' | 'public';
    templateId?: string;
  }) => Promise<any>;
  isCreating: boolean;
  
  // Templates and configuration
  templates: AITemplate | undefined;
  isLoadingTemplates: boolean;
  
  // API validation
  validateKeys: () => Promise<{ anthropic: boolean; openai: boolean }>;
  keyValidation: { anthropic: boolean; openai: boolean } | undefined;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useAI = (): UseAIHook => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get AI templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['ai-templates'],
    queryFn: aiService.getTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Validate API keys
  const { data: keyValidation, refetch: validateKeys } = useQuery({
    queryKey: ['ai-key-validation'],
    queryFn: aiService.validateKeys,
    enabled: false, // Only run when manually triggered
  });

  // Generate PRD mutation
  const generatePRDMutation = useMutation({
    mutationFn: aiService.generatePRD,
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to generate PRD';
      setError(message);
      toast.error(message);
    },
    onSuccess: () => {
      clearError();
    },
  });

  // Generate suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: ({ prdId, section, content, context }: {
      prdId: string;
      section: string;
      content: string;
      context?: string;
    }) => aiService.generateSuggestions(prdId, section, content, context),
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to generate suggestions';
      setError(message);
      toast.error(message);
    },
    onSuccess: () => {
      clearError();
    },
  });

  // Improve section mutation
  const improveSectionMutation = useMutation({
    mutationFn: ({ prdId, section, content, feedback }: {
      prdId: string;
      section: string;
      content: string;
      feedback: string;
    }) => aiService.improveSection(prdId, section, content, feedback),
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to improve section';
      setError(message);
      toast.error(message);
    },
    onSuccess: () => {
      clearError();
    },
  });

  // Create PRD from AI mutation
  const createPRDMutation = useMutation({
    mutationFn: aiService.createPRDFromAI,
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to create PRD';
      setError(message);
      toast.error(message);
    },
    onSuccess: (data) => {
      clearError();
      toast.success('PRD created successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['prds'] });
      queryClient.invalidateQueries({ queryKey: ['team-prds'] });
      
      return data;
    },
  });

  // Wrapper functions
  const generatePRD = useCallback(async (request: AIGenerationRequest): Promise<AIGenerationResponse> => {
    const result = await generatePRDMutation.mutateAsync(request);
    return result.data;
  }, [generatePRDMutation]);

  const generateSuggestions = useCallback(async (
    prdId: string,
    section: string,
    content: string,
    context?: string
  ): Promise<string[]> => {
    const result = await generateSuggestionsMutation.mutateAsync({
      prdId,
      section,
      content,
      context,
    });
    return result.data.suggestions;
  }, [generateSuggestionsMutation]);

  const improveSection = useCallback(async (
    prdId: string,
    section: string,
    content: string,
    feedback: string
  ): Promise<string> => {
    const result = await improveSectionMutation.mutateAsync({
      prdId,
      section,
      content,
      feedback,
    });
    return result.data.improvedContent;
  }, [improveSectionMutation]);

  const createPRDFromAI = useCallback(async (data: {
    title: string;
    aiResponse: AIGenerationResponse;
    teamId?: string;
    visibility?: 'private' | 'team' | 'public';
    templateId?: string;
  }) => {
    const result = await createPRDMutation.mutateAsync(data);
    return result.data.prd;
  }, [createPRDMutation]);

  const validateKeysWrapper = useCallback(async () => {
    const result = await validateKeys();
    return result.data?.data || { anthropic: false, openai: false };
  }, [validateKeys]);

  return {
    // Generation
    generatePRD,
    isGenerating: generatePRDMutation.isPending,
    
    // Suggestions
    generateSuggestions,
    isGeneratingSuggestions: generateSuggestionsMutation.isPending,
    
    // Improvement
    improveSection,
    isImproving: improveSectionMutation.isPending,
    
    // PRD Creation
    createPRDFromAI,
    isCreating: createPRDMutation.isPending,
    
    // Templates and configuration
    templates: templates?.data,
    isLoadingTemplates,
    
    // API validation
    validateKeys: validateKeysWrapper,
    keyValidation: keyValidation?.data,
    
    // Error handling
    error,
    clearError,
  };
};