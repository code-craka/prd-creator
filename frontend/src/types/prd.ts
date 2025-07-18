export interface PRD {
  id: string;
  user_id: string;
  team_id?: string;
  title: string;
  content: string;
  metadata?: {
    questions?: Record<string, string>;
    generatedAt?: string;
    model?: string;
  };
  visibility: 'private' | 'team' | 'public';
  share_token?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface CreatePRDRequest {
  title: string;
  content: string;
  teamId?: string;
  visibility?: 'private' | 'team' | 'public';
  metadata?: any;
}

export interface PRDFilters {
  search?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}