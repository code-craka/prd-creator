// Match backend types
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
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PRDTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  company_type: string;
  complexity_level: string;
  template_content: TemplateContent;
  metadata: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  rating: number;
  rating_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TutorialStep {
  id: string;
  step_id: string;
  title: string;
  description: string;
  content: TutorialContent;
  order_index: number;
  category: string;
  estimated_time_minutes: number;
  prerequisites: string[];
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  progress?: UserTutorialProgress | null;
}

export interface UserTutorialProgress {
  id: string;
  user_id: string;
  step_id: string;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  time_spent_seconds: number;
  interaction_data: Record<string, any>;
  created_at: string;
  updated_at: string;
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
}

export interface OnboardingProgress {
  onboarding: UserOnboarding;
  tutorialSteps: TutorialStep[];
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

// Component Props
export interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export interface ProfileSetupProps {
  onComplete: (profileData: ProfileData) => void;
  initialData?: Partial<ProfileData>;
}

export interface ProfileData {
  companyType: string;
  industry: string;
  teamSize: string;
  experienceLevel: string;
  preferences?: Record<string, any>;
}

export interface TemplateSelectionProps {
  recommendations: TemplateRecommendation[];
  onSelect: (template: PRDTemplate) => void;
  onSkip: () => void;
}

export interface TutorialPlayerProps {
  step: TutorialStep;
  onComplete: (timeSpent: number) => void;
  onSkip: () => void;
}

export interface ProgressIndicatorProps {
  progress: OnboardingProgress;
  className?: string;
}

// API Request/Response types
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

// State management
export interface OnboardingState {
  progress: OnboardingProgress | null;
  isLoading: boolean;
  error: string | null;
  currentStep: string | null;
  recommendations: TemplateRecommendation[];
  industries: IndustryClassification[];
  companyTypes: CompanyTypeClassification[];
}

export interface OnboardingActions {
  initializeOnboarding: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  startStep: (stepId: string) => Promise<void>;
  completeStep: (stepId: string, timeSpent?: number) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  loadRecommendations: () => Promise<void>;
  rateTemplate: (templateId: string, rating: number, review?: string) => Promise<void>;
}

// Utility types
export type OnboardingStep = 
  | 'welcome'
  | 'profile-setup'
  | 'template-selection'
  | 'first-prd'
  | 'tutorial'
  | 'team-setup'
  | 'completed';

export type CompanyType = 'startup' | 'enterprise' | 'agency' | 'freelancer';
export type TeamSize = 'solo' | 'small' | 'medium' | 'large';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
export type TutorialCategory = 'getting-started' | 'collaboration' | 'advanced';