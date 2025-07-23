import { api } from './api';
import { apiCall } from './api';
import {
  PublicPRD,
  PublicGalleryFilters,
  PublicGalleryResponse,
  GalleryStats,
  SocialShareData,
  PublishPRDData,
  buildGalleryQueryParams
} from 'prd-creator-shared';

class PublicGalleryService {
  async getPublicPRDs(filters: PublicGalleryFilters = {}): Promise<PublicGalleryResponse> {
    const params = buildGalleryQueryParams(filters);

    return apiCall(() => 
      api.get<{ success: boolean; data: PublicGalleryResponse }>(`/public-gallery/prds?${params}`)
    );
  }

  async getPublicPRDBySlug(slug: string): Promise<PublicPRD> {
    return apiCall(() => 
      api.get<{ success: boolean; data: PublicPRD }>(`/public-gallery/prds/${slug}`)
    );
  }

  async publishPRD(prdId: string, data: PublishPRDData): Promise<PublicPRD> {
    return apiCall(() => 
      api.post<{ success: boolean; data: PublicPRD }>(`/public-gallery/prds/${prdId}/publish`, data)
    );
  }

  async likePRD(prdId: string): Promise<{ liked: boolean; likes_count: number }> {
    return apiCall(() => 
      api.post<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/public-gallery/prds/${prdId}/like`)
    );
  }

  async sharePRD(prdId: string, data: SocialShareData): Promise<{ share_url: string }> {
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