/**
 * Shared PRD Service
 * Contains shared types, interfaces, constants, and utility functions
 * for PRD management across frontend and backend
 */

import { PRD, CreatePRDRequest, PRDFilters } from '../types';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const PRD_VISIBILITY_OPTIONS = ['private', 'team', 'public'] as const;
export type PRDVisibility = typeof PRD_VISIBILITY_OPTIONS[number];

export const PRD_STATUS_OPTIONS = ['draft', 'review', 'approved', 'archived'] as const;
export type PRDStatus = typeof PRD_STATUS_OPTIONS[number];

export const DEFAULT_PRD_LIMIT = 20;
export const MAX_PRD_LIMIT = 100;
export const DEFAULT_PAGE = 1;

// ============================================================================
// SHARED INTERFACES
// ============================================================================

export interface PRDWithAuthor extends PRD {
  author_name: string;
  author_avatar?: string;
}

export interface PRDSummary {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  view_count: number;
  visibility: PRDVisibility;
  author_name?: string;
  template_id?: string;
}

export interface PRDShareData {
  shareToken: string;
  shareUrl: string;
  expiresAt?: Date;
}

export interface PRDValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PRDMetrics {
  totalPRDs: number;
  privatePRDs: number;
  teamPRDs: number;
  publicPRDs: number;
  totalViews: number;
  averageViewsPerPRD: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Build URL search parameters from PRD filters
 * Used by frontend for API calls
 */
export function buildPRDQueryParams(filters: PRDFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  return params;
}

/**
 * Apply PRD filters with validation and defaults
 * Common filtering logic that can be shared
 */
export function applyPRDFilters(filters: PRDFilters) {
  return {
    search: filters.search?.trim(),
    author: filters.author?.trim(),
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    templateId: filters.templateId,
    page: Math.max(1, filters.page || DEFAULT_PAGE),
    limit: Math.min(MAX_PRD_LIMIT, Math.max(1, filters.limit || DEFAULT_PRD_LIMIT))
  };
}

/**
 * Validate PRD creation/update data
 */
export function validatePRDData(data: CreatePRDRequest): PRDValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('PRD title is required');
  } else if (data.title.trim().length > 200) {
    errors.push('PRD title must be 200 characters or less');
  }

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('PRD content is required');
  } else if (data.content.trim().length < 50) {
    warnings.push('PRD content seems quite short. Consider adding more details.');
  }

  // Visibility validation
  if (data.visibility && !isValidPRDVisibility(data.visibility)) {
    errors.push('Invalid visibility option');
  }

  // Team visibility requires team ID
  if (data.visibility === 'team' && !data.teamId) {
    errors.push('Team visibility requires team membership');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate PRD visibility
 */
export function isValidPRDVisibility(visibility: string): visibility is PRDVisibility {
  return PRD_VISIBILITY_OPTIONS.includes(visibility as PRDVisibility);
}

/**
 * Sanitize PRD data for safe processing
 */
export function sanitizePRDData(data: CreatePRDRequest): CreatePRDRequest {
  return {
    title: typeof data.title === 'string' ? data.title.trim() : '',
    content: typeof data.content === 'string' ? data.content.trim() : '',
    teamId: data.teamId,
    visibility: isValidPRDVisibility(data.visibility || 'private') ? data.visibility : 'private',
    metadata: data.metadata || {},
    template_id: data.template_id
  };
}

/**
 * Transform PRD for public display (remove sensitive information)
 */
export function sanitizePRDForPublic(prd: PRD): Partial<PRD> {
  return {
    id: prd.id,
    title: prd.title,
    created_at: prd.created_at,
    updated_at: prd.updated_at,
    view_count: prd.view_count || 0,
    template_id: prd.template_id,
    visibility: prd.visibility
    // Exclude user_id, team_id, content, share_token for public listings
  };
}

/**
 * Calculate PRD content metrics
 */
export function calculatePRDMetrics(content: string): {
  wordCount: number;
  estimatedReadTime: number;
  characterCount: number;
  sectionCount: number;
} {
  const wordCount = content.trim().split(/\s+/).length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
  const characterCount = content.length;
  const sectionCount = (content.match(/^#+\s/gm) || []).length; // Count markdown headers

  return {
    wordCount,
    estimatedReadTime,
    characterCount,
    sectionCount
  };
}

/**
 * Generate PRD summary from content
 */
export function generatePRDSummary(content: string, maxLength: number = 150): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/`(.*?)`/g, '$1') // Remove code
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // If no good sentence break, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
}

/**
 * Format PRD date for display
 */
export function formatPRDDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return dateObj.toLocaleDateString();
}

/**
 * Get PRD visibility badge color
 */
export function getPRDVisibilityColor(visibility: PRDVisibility): string {
  switch (visibility) {
    case 'private':
      return 'bg-gray-500';
    case 'team':
      return 'bg-blue-500';
    case 'public':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Get PRD visibility icon
 */
export function getPRDVisibilityIcon(visibility: PRDVisibility): string {
  switch (visibility) {
    case 'private':
      return '🔒';
    case 'team':
      return '👥';
    case 'public':
      return '🌐';
    default:
      return '📄';
  }
}

/**
 * Validate search filters for PRDs
 */
export function validatePRDFilters(filters: PRDFilters): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (filters.page && (filters.page < 1 || !Number.isInteger(filters.page))) {
    errors.push('Page must be a positive integer');
  }

  if (filters.limit && (filters.limit < 1 || filters.limit > MAX_PRD_LIMIT || !Number.isInteger(filters.limit))) {
    errors.push(`Limit must be between 1 and ${MAX_PRD_LIMIT}`);
  }

  if (filters.dateFrom && filters.dateTo) {
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      errors.push('Invalid date format');
    } else if (fromDate > toDate) {
      errors.push('Date range is invalid: start date must be before end date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Build search query for PRD content
 * Used by backend for database queries
 */
export function buildPRDSearchQuery(search: string): string {
  // Clean and normalize search term
  const cleanSearch = search.trim().toLowerCase();
  
  // Handle quoted phrases
  if (cleanSearch.startsWith('"') && cleanSearch.endsWith('"')) {
    return cleanSearch.slice(1, -1);
  }
  
  // Split into words and join with AND logic for database
  return cleanSearch.split(/\s+/).filter(word => word.length > 2).join(' & ');
}

/**
 * Extract keywords from PRD content for search indexing
 */
export function extractPRDKeywords(content: string): string[] {
  // Remove markdown and extract meaningful words
  const plainText = content
    .replace(/#{1,6}\s+/g, ' ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`(.*?)`/g, '$1');

  // Extract words, filter out common stop words and short words
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'will', 'be']);
  
  const words = plainText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 20); // Limit to 20 keywords

  return [...new Set(words)]; // Remove duplicates
}
