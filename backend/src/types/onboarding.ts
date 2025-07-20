export interface UserOnboarding {
  id: string;
  user_id: string;
  welcome_completed: boolean;
  profile_setup_completed: boolean;
  first_prd_created: boolean;
  team_invitation_sent: boolean;
  tutorial_completed: boolean;
  tutorial_progress: Record<string, boolean>;
  company_type?: string;
  industry?: string;
  team_size?: string;
  experience_level?: string;
  preferences: Record<string, any>;
  completion_percentage: number;
  started_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PRDTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  company_type: string;
  complexity_level: string;
  template_content: Record<string, any>;
  metadata: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  rating: number;
  rating_count: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TutorialStep {
  id: string;
  step_id: string;
  title: string;
  description: string;
  content: Record<string, any>;
  order_index: number;
  category: string;
  estimated_time_minutes: number;
  prerequisites: string[];
  is_required: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserTutorialProgress {
  id: string;
  user_id: string;
  step_id: string;
  completed: boolean;
  started_at: Date;
  completed_at?: Date;
  time_spent_seconds: number;
  interaction_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IndustryClassification {
  id: string;
  industry_key: string;
  industry_name: string;
  description?: string;
  typical_prd_types: string[];
  recommended_templates: string[];
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyTypeClassification {
  id: string;
  type_key: string;
  type_name: string;
  description?: string;
  characteristics: Record<string, any>;
  recommended_features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface OnboardingAnalytics {
  id: string;
  user_id: string;
  event_type: string;
  event_category: string;
  step_id?: string;
  event_data: Record<string, any>;
  time_spent_seconds: number;
  user_agent?: string;
  device_type?: string;
  created_at: Date;
  updated_at: Date;
}

// Response Types
export interface OnboardingProgress {
  onboarding: UserOnboarding;
  tutorialSteps: (TutorialStep & { progress: UserTutorialProgress | null })[];
  completedSteps: number;
  totalSteps: number;
  overallProgress: number;
}

export interface TemplateRecommendation {
  template: PRDTemplate;
  matchScore: number;
  recommendationReasons: string[];
  estimatedTimeToComplete: number;
}

// Request Types
export interface UpdateProfileRequest {
  companyType?: string;
  industry?: string;
  teamSize?: string;
  experienceLevel?: string;
  preferences?: Record<string, any>;
}

export interface CompleteStepRequest {
  stepId: string;
  timeSpentSeconds?: number;
  interactionData?: Record<string, any>;
}

export interface RateTemplateRequest {
  templateId: string;
  rating: number;
  review?: string;
}

// Template Content Structure
export interface TemplateContent {
  sections: TemplateSection[];
  metadata: {
    estimatedTime: number;
    difficulty: string;
    tags: string[];
    version: string;
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  content: string;
  placeholder?: string;
  required: boolean;
  order: number;
  type: 'text' | 'list' | 'table' | 'markdown';
  examples?: string[];
  tips?: string[];
}

// Tutorial Content Structure
export interface TutorialContent {
  type: 'interactive' | 'video' | 'text' | 'guided';
  steps: TutorialContentStep[];
  resources?: TutorialResource[];
}

export interface TutorialContentStep {
  id: string;
  title: string;
  description: string;
  content: string;
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    alt?: string;
  };
  action?: {
    type: 'click' | 'navigate' | 'input' | 'complete';
    target?: string;
    data?: any;
  };
  validation?: {
    type: 'required' | 'optional';
    criteria: string;
  };
}

export interface TutorialResource {
  type: 'link' | 'download' | 'template';
  title: string;
  url: string;
  description?: string;
}

// Analytics Types
export interface OnboardingMetrics {
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  avgCompletionTimeHours: number;
  stepAnalytics: StepAnalytics[];
  industryBreakdown: IndustryMetrics[];
  companyTypeBreakdown: CompanyTypeMetrics[];
  timeToComplete: {
    median: number;
    average: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
  };
}

export interface StepAnalytics {
  stepId: string;
  stepTitle: string;
  startedCount: number;
  completedCount: number;
  completionRate: number;
  avgTimeSpent: number;
  dropOffRate: number;
}

export interface IndustryMetrics {
  industry: string;
  userCount: number;
  completionRate: number;
  popularTemplates: string[];
}

export interface CompanyTypeMetrics {
  companyType: string;
  userCount: number;
  completionRate: number;
  avgTimeToComplete: number;
}