/**
 * Shared Public Gallery Service
 * Contains shared types, interfaces, constants, and utility functions
 * for the Public Gallery feature across frontend and backend
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const COMPLEXITY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];

export const GALLERY_CATEGORIES = ['featured', 'trending', 'community'] as const;
export type GalleryCategory = typeof GALLERY_CATEGORIES[number];

export const SORT_OPTIONS = ['newest', 'popular', 'trending', 'most_liked'] as const;
export type SortOption = typeof SORT_OPTIONS[number];

export const SOCIAL_PLATFORMS = ['twitter', 'linkedin', 'email', 'slack', 'copy_link'] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

// ============================================================================
// SHARED INTERFACES
// ============================================================================

export interface BasePublicPRD {
  id: string;
  title: string;
  description: string | null;
  industry: string;
  complexity_level: ComplexityLevel;
  tags: string[];
  created_at: string | Date;
  updated_at: string | Date;
}

export interface PublicPRDStats {
  views: number;
  likes: number;
  shares: number;
  clones: number;
}

export interface PublicPRDAuthor {
  id?: string;
  name: string;
  avatar_url: string | null;
  company?: string | null;
}

export interface PublicPRD extends BasePublicPRD {
  slug: string;
  author: PublicPRDAuthor;
  stats: PublicPRDStats;
  featured: boolean;
  trending: boolean;
}

export interface PublicPRDWithDetails extends PublicPRD {
  prd: {
    content: any;
    sections: any[];
  };
  engagement_score: number;
  social_metrics: Record<string, number>;
}

export interface PublicGalleryFilters {
  category?: GalleryCategory;
  industry?: string;
  complexity_level?: ComplexityLevel;
  tags?: string[];
  search?: string;
  sort_by?: SortOption;
  page?: number;
  limit?: number;
}

export interface PublicGalleryResponse {
  prds: PublicPRD[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    industries: string[];
    tags: string[];
    complexity_levels: ComplexityLevel[];
  };
}

export interface GalleryStats {
  total_prds: number;
  total_authors: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_clones: number;
  featured_count: number;
  trending_count: number;
  top_industries: Array<{ industry: string; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
}

export interface SocialShareData {
  platform: SocialPlatform;
  share_text?: string;
  hashtags?: string[];
}

export interface PublishPRDData {
  title: string;
  description?: string;
  industry: string;
  complexity_level: ComplexityLevel;
  tags?: string[];
  seo_description?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate engagement score for a PRD based on its stats
 * Uses weighted scoring: views(1x) + likes(2x) + shares(3x) + clones(5x)
 */
export function calculateEngagementScore(stats: {
  view_count?: number;
  like_count?: number;
  share_count?: number;
  clone_count?: number;
}): number {
  const views = stats.view_count || 0;
  const likes = stats.like_count || 0;
  const shares = stats.share_count || 0;
  const clones = stats.clone_count || 0;

  return views + (likes * 2) + (shares * 3) + (clones * 5);
}

/**
 * Calculate trending score for sorting trending PRDs
 * Factors in recency and engagement
 */
export function calculateTrendingScore(stats: {
  view_count?: number;
  like_count?: number;
  share_count?: number;
  created_at: Date | string;
}): number {
  const engagement = (stats.view_count || 0) + 
                    ((stats.like_count || 0) * 2) + 
                    ((stats.share_count || 0) * 3);
  
  const createdAt = typeof stats.created_at === 'string' 
    ? new Date(stats.created_at) 
    : stats.created_at;
    
  const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Decay factor: engagement loses value over time
  const decayFactor = Math.max(0.1, 1 / (1 + hoursAgo / 24));
  
  return engagement * decayFactor;
}

/**
 * Format estimated reading time based on content length
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get CSS color class for complexity level
 */
export function getComplexityColor(level: ComplexityLevel): string {
  switch (level) {
    case 'beginner':
      return 'text-green-400';
    case 'intermediate':
      return 'text-yellow-400';
    case 'advanced':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get emoji icon for category
 */
export function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    feature: '⚡',
    product: '📱',
    api: '🔌',
    mobile: '📱',
    web: '🌐',
    saas: '☁️',
    ecommerce: '🛒',
    fintech: '💰',
    healthcare: '🏥',
    education: '📚',
    enterprise: '🏢'
  };
  
  return categoryIcons[category] || '📋';
}

/**
 * Validate complexity level
 */
export function isValidComplexityLevel(level: string): level is ComplexityLevel {
  return COMPLEXITY_LEVELS.includes(level as ComplexityLevel);
}

/**
 * Validate gallery category
 */
export function isValidGalleryCategory(category: string): category is GalleryCategory {
  return GALLERY_CATEGORIES.includes(category as GalleryCategory);
}

/**
 * Validate sort option
 */
export function isValidSortOption(sortBy: string): sortBy is SortOption {
  return SORT_OPTIONS.includes(sortBy as SortOption);
}

/**
 * Validate social platform
 */
export function isValidSocialPlatform(platform: string): platform is SocialPlatform {
  return SOCIAL_PLATFORMS.includes(platform as SocialPlatform);
}

/**
 * Parse tags from JSON string safely
 */
export function parseTags(tagsJson: string | null | undefined): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse social metrics from JSON string safely
 */
export function parseSocialMetrics(metricsJson: string | null | undefined): Record<string, number> {
  if (!metricsJson) return {};
  try {
    const parsed = JSON.parse(metricsJson);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Generate share URL for different platforms
 */
export interface ShareUrlOptions {
  platform: SocialPlatform;
  prdUrl: string;
  title: string;
  shareText?: string;
  hashtags?: string[];
}

export function generateShareUrl(options: ShareUrlOptions): string {
  const { platform, prdUrl, title, shareText, hashtags } = options;
  const encodedUrl = encodeURIComponent(prdUrl);
  
  switch (platform) {
    case 'twitter':
      return generateTwitterShareUrl(encodedUrl, title, shareText, hashtags);
    case 'linkedin':
      return generateLinkedInShareUrl(encodedUrl);
    case 'email':
      return generateEmailShareUrl(title, shareText, prdUrl);
    case 'slack':
      return 'https://slack.com/intl/en-in/';
    case 'copy_link':
    default:
      return prdUrl;
  }
}

function generateTwitterShareUrl(
  encodedUrl: string,
  title: string,
  shareText?: string,
  hashtags?: string[]
): string {
  const hashtagString = hashtags ? hashtags.map(tag => `#${tag}`).join(' ') : '';
  const twitterText = `${shareText || title} ${hashtagString}`.trim();
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodedUrl}`;
}

function generateLinkedInShareUrl(encodedUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
}

function generateEmailShareUrl(title: string, shareText?: string, prdUrl?: string): string {
  const subject = encodeURIComponent(`Check out this PRD: ${title}`);
  const body = encodeURIComponent(
    `${shareText || 'I thought you might be interested in this PRD:'}\n\n${title}\n${prdUrl}`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Sanitize and format PRD data for public display
 */
export function sanitizePublicPRDData(data: any): Partial<PublicPRD> {
  return {
    id: data.id,
    title: sanitizeTitle(data.title),
    description: sanitizeDescription(data.description),
    industry: data.industry,
    complexity_level: validateComplexityLevel(data.complexity_level),
    tags: sanitizeTags(data.tags),
    slug: data.slug || data.seo_slug,
    featured: Boolean(data.is_featured || data.featured),
    trending: Boolean(data.is_trending || data.trending),
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

function sanitizeTitle(title: any): string {
  return typeof title === 'string' ? title.trim() : '';
}

function sanitizeDescription(description: any): string | null {
  return typeof description === 'string' ? description.trim() || null : null;
}

function validateComplexityLevel(level: any): ComplexityLevel {
  return isValidComplexityLevel(level) ? level : 'beginner';
}

function sanitizeTags(tags: any): string[] {
  return Array.isArray(tags) ? tags.filter(Boolean) : [];
}

/**
 * Transform backend PRD data to frontend format
 */
export function transformToPublicPRD(backendData: any): PublicPRD {
  return {
    id: backendData.id || backendData.prd_id,
    title: backendData.title,
    description: backendData.description,
    slug: backendData.seo_slug || backendData.slug,
    industry: backendData.industry,
    complexity_level: backendData.complexity_level,
    tags: parseTags(backendData.tags),
    author: extractAuthorData(backendData),
    stats: extractStatsData(backendData),
    featured: Boolean(backendData.is_featured),
    trending: Boolean(backendData.is_trending),
    created_at: backendData.created_at,
    updated_at: backendData.updated_at
  };
}

function extractAuthorData(data: any): PublicPRDAuthor {
  return {
    id: data.user_id,
    name: data.author_name || data.author?.name,
    avatar_url: data.author_avatar || data.author?.avatar_url,
    company: data.author_company || data.author?.company
  };
}

function extractStatsData(data: any): PublicPRDStats {
  return {
    views: data.view_count || 0,
    likes: data.like_count || 0,
    shares: data.share_count || 0,
    clones: data.clone_count || 0
  };
}

// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================

/**
 * Build URL search parameters from gallery filters
 * Used by frontend for API calls
 */
export function buildGalleryQueryParams(filters: PublicGalleryFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v.toString()));
      } else {
        params.append(key, value.toString());
      }
    }
  });

  return params;
}

/**
 * Apply gallery filters to a database query (for backend use)
 * Common filtering logic that can be shared
 */
export function applyGalleryFilters(filters: PublicGalleryFilters) {
  return {
    category: filters.category,
    industry: filters.industry,
    complexity_level: filters.complexity_level,
    tags: filters.tags,
    search: filters.search,
    sort_by: filters.sort_by || 'newest',
    page: Math.max(1, filters.page || 1),
    limit: Math.min(50, Math.max(1, filters.limit || 12))
  };
}

/**
 * Build sort order SQL for different sort options
 * Used by backend for database queries
 */
export function buildSortOrder(sortBy: SortOption): string {
  switch (sortBy) {
    case 'popular':
      return '(view_count + like_count * 2 + share_count * 3) DESC';
    case 'trending':
      return `
        CASE 
          WHEN is_trending THEN 1 
          ELSE 0 
        END DESC,
        (view_count + like_count * 2) / GREATEST(EXTRACT(EPOCH FROM (NOW() - created_at)), 1) DESC
      `;
    case 'most_liked':
      return 'like_count DESC';
    case 'newest':
    default:
      return 'created_at DESC';
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    offset: (page - 1) * limit
  };
}

/**
 * Validate publish PRD data
 */
export function validatePublishPRDData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!data.industry || typeof data.industry !== 'string') {
    errors.push('Industry is required');
  }

  if (!isValidComplexityLevel(data.complexity_level)) {
    errors.push('Valid complexity level is required');
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format stats for display
 */
export function formatStats(stats: PublicPRDStats): {
  views: string;
  likes: string;
  shares: string;
  clones: string;
} {
  return {
    views: formatCount(stats.views),
    likes: formatCount(stats.likes),
    shares: formatCount(stats.shares),
    clones: formatCount(stats.clones)
  };
}

function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}