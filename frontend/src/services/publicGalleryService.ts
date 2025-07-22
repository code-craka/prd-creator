import { api } from './api';
import { apiCall } from './api';

export interface PublicPRD {
  id: string;
  title: string;
  description: string;
  slug: string;
  industry: string;
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  author: {
    name: string;
    avatar_url?: string;
  };
  stats: {
    views: number;
    likes: number;
    clones: number;
    shares: number;
  };
  featured: boolean;
  trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicGalleryFilters {
  category?: 'featured' | 'trending' | 'community';
  industry?: string;
  complexity_level?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  search?: string;
  sort_by?: 'newest' | 'popular' | 'trending' | 'most_liked';
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
    complexity_levels: string[];
  };
}

export interface GalleryStats {
  total_prds: number;
  total_authors: number;
  total_views: number;
  total_likes: number;
  featured_count: number;
  trending_count: number;
}

class PublicGalleryService {
  async getPublicPRDs(filters: PublicGalleryFilters = {}): Promise<PublicGalleryResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return apiCall(() => 
      api.get<{ success: boolean; data: PublicGalleryResponse }>(`/public-gallery/prds?${params}`)
    );
  }

  async getPublicPRDBySlug(slug: string): Promise<PublicPRD> {
    return apiCall(() => 
      api.get<{ success: boolean; data: PublicPRD }>(`/public-gallery/prds/${slug}`)
    );
  }

  async publishPRD(prdId: string, data: {
    title: string;
    description?: string;
    industry: string;
    complexity_level: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    seo_description?: string;
  }): Promise<PublicPRD> {
    return apiCall(() => 
      api.post<{ success: boolean; data: PublicPRD }>(`/public-gallery/prds/${prdId}/publish`, data)
    );
  }

  async likePRD(prdId: string): Promise<{ liked: boolean; likes_count: number }> {
    return apiCall(() => 
      api.post<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/public-gallery/prds/${prdId}/like`)
    );
  }

  async sharePRD(prdId: string, data: {
    platform: 'twitter' | 'linkedin' | 'email' | 'slack' | 'copy_link';
    share_text?: string;
    hashtags?: string[];
  }): Promise<{ share_url: string }> {
    return apiCall(() => 
      api.post<{ success: boolean; data: { share_url: string } }>(`/public-gallery/prds/${prdId}/share`, data)
    );
  }

  async clonePRD(prdId: string): Promise<{ prd_id: string }> {
    return apiCall(() => 
      api.post<{ success: boolean; data: { prd_id: string } }>(`/public-gallery/prds/${prdId}/clone`)
    );
  }

  async getGalleryStats(): Promise<GalleryStats> {
    return apiCall(() => 
      api.get<{ success: boolean; data: GalleryStats }>('/public-gallery/stats')
    );
  }
}

export const publicGalleryService = new PublicGalleryService();