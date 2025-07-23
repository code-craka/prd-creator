export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  current_team_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PRD {
  id: string;
  user_id: string;
  team_id?: string;
  title: string;
  content: string;
  metadata: {
    questions: Record<string, string>;
    generated_at: Date;
    model: string;
  };
  visibility: 'private' | 'team' | 'public';
  share_token?: string;
  template_id?: string;
  view_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Template {
  id: string;
  team_id?: string;
  name: string;
  description?: string;
  structure: {
    questions: Array<{
      id: string;
      label: string;
      type: 'text' | 'textarea' | 'select';
      placeholder?: string;
      options?: string[];
      required: boolean;
    }>;
    sections: string[];
  };
  industry?: string;
  is_public: boolean;
  usage_count: number;
  created_by: string;
  created_at: Date;
}

export interface CreatePRDRequest {
  title: string;
  content: string;
  teamId?: string;
  visibility?: 'private' | 'team' | 'public';
  metadata?: Record<string, any>;
  template_id?: string;
}

export interface PRDFilters {
  search?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  templateId?: string;
  page?: number;
  limit?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Export onboarding types
export * from './onboarding';

// Export team and member types
export * from './team';

// Export analytics types
export * from './analytics';