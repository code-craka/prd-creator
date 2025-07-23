import { db } from '../config/database';
import { generateSlug } from '../utils/slugGenerator';
import { ViralTrackingService } from './viralTrackingService';

export interface PublicPRD {
  id: string;
  prd_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'featured' | 'trending' | 'community';
  tags: string[];
  industry: string;
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  view_count: number;
  like_count: number;
  share_count: number;
  clone_count: number;
  is_featured: boolean;
  is_trending: boolean;
  featured_reason: string | null;
  featured_until: Date | null;
  social_metrics: Record<string, any>;
  seo_slug: string;
  seo_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PublicPRDWithDetails extends PublicPRD {
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
    company: string | null;
  };
  prd: {
    content: any;
    sections: any[];
  };
  engagement_score: number;
}

export interface GalleryFilters {
  category?: 'featured' | 'trending' | 'community';
  industry?: string;
  complexity_level?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  search?: string;
  sort_by?: 'newest' | 'popular' | 'trending' | 'most_liked';
  page?: number;
  limit?: number;
}

export interface SocialShareData {
  platform: 'twitter' | 'linkedin' | 'email' | 'slack' | 'copy_link';
  share_text?: string;
  hashtags?: string[];
}

class PublicGalleryService {
  // Publish PRD to public gallery
  async publishPRD(
    userId: string,
    prdId: string,
    publicData: {
      title: string;
      description?: string;
      industry: string;
      complexity_level: 'beginner' | 'intermediate' | 'advanced';
      tags?: string[];
      seo_description?: string;
    }
  ): Promise<PublicPRD> {
    // Check if PRD is already published
    const existing = await db('public_prds')
      .where('prd_id', prdId)
      .first();

    if (existing) {
      throw new Error('PRD is already published to gallery');
    }

    const slug = await this.generateUniqueSlug(publicData.title);

    const publicPRD = await db('public_prds')
      .insert({
        prd_id: prdId,
        user_id: userId,
        title: publicData.title,
        description: publicData.description || null,
        category: 'community',
        tags: JSON.stringify(publicData.tags || []),
        industry: publicData.industry,
        complexity_level: publicData.complexity_level,
        seo_slug: slug,
        seo_description: publicData.seo_description || null,
        social_metrics: JSON.stringify({})
      })
      .returning('*');

    // Track viral action
    await ViralTrackingService.trackAction(userId, 'share', 'prd', prdId);

    return publicPRD[0];
  }

  // Get public PRDs with filters
  async getPublicPRDs(filters: GalleryFilters = {}): Promise<{
    prds: PublicPRDWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      category,
      industry,
      complexity_level,
      tags,
      search,
      sort_by = 'newest',
      page = 1,
      limit = 12
    } = filters;

    let query = db('public_prds as pp')
      .leftJoin('users as u', 'pp.user_id', 'u.id')
      .leftJoin('prds as p', 'pp.prd_id', 'p.id')
      .select([
        'pp.*',
        'u.name as author_name',
        'u.avatar_url as author_avatar',
        'u.company as author_company',
        'p.content as prd_content',
        'p.sections as prd_sections'
      ]);

    // Apply filters
    if (category) {
      query = query.where('pp.category', category);
    }

    if (industry) {
      query = query.where('pp.industry', industry);
    }

    if (complexity_level) {
      query = query.where('pp.complexity_level', complexity_level);
    }

    if (tags && tags.length > 0) {
      query = query.whereRaw("pp.tags ??& ?", [JSON.stringify(tags)]);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('pp.title', `%${search}%`)
          .orWhereILike('pp.description', `%${search}%`)
          .orWhereILike('u.name', `%${search}%`);
      });
    }

    // Apply sorting
    switch (sort_by) {
      case 'popular':
        query = query.orderByRaw('(pp.view_count + pp.like_count * 2 + pp.share_count * 3) DESC');
        break;
      case 'trending':
        query = query.orderByRaw(`
          CASE 
            WHEN pp.is_trending THEN 1 
            ELSE 0 
          END DESC,
          (pp.view_count + pp.like_count * 2) / EXTRACT(EPOCH FROM (NOW() - pp.created_at)) DESC
        `);
        break;
      case 'most_liked':
        query = query.orderBy('pp.like_count', 'desc');
        break;
      case 'newest':
      default:
        query = query.orderBy('pp.created_at', 'desc');
        break;
    }

    // Get total count
    const totalQuery = query.clone().clearSelect().clearOrder().count('* as total');
    const totalResult = await totalQuery.first();
    const total = parseInt(totalResult?.total as string) || 0;

    // Apply pagination
    const offset = (page - 1) * limit;
    const results = await query.limit(limit).offset(offset);

    const prds = results.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      social_metrics: JSON.parse(row.social_metrics || '{}'),
      author: {
        id: row.user_id,
        name: row.author_name,
        avatar_url: row.author_avatar,
        company: row.author_company
      },
      prd: {
        content: row.prd_content,
        sections: JSON.parse(row.prd_sections || '[]')
      },
      engagement_score: this.calculateEngagementScore(row)
    }));

    return {
      prds,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single public PRD by slug
  async getPublicPRDBySlug(slug: string, viewerId?: string): Promise<PublicPRDWithDetails | null> {
    const prd = await db('public_prds as pp')
      .leftJoin('users as u', 'pp.user_id', 'u.id')
      .leftJoin('prds as p', 'pp.prd_id', 'p.id')
      .select([
        'pp.*',
        'u.name as author_name',
        'u.avatar_url as author_avatar',
        'u.company as author_company',
        'p.content as prd_content',
        'p.sections as prd_sections'
      ])
      .where('pp.seo_slug', slug)
      .first();

    if (!prd) {
      return null;
    }

    // Increment view count
    await this.incrementViewCount(prd.id);

    // Track view if viewer is authenticated
    if (viewerId) {
      await ViralTrackingService.trackAction(viewerId, 'view', 'prd', prd.prd_id);
    }

    return {
      ...prd,
      tags: JSON.parse(prd.tags || '[]'),
      social_metrics: JSON.parse(prd.social_metrics || '{}'),
      author: {
        id: prd.user_id,
        name: prd.author_name,
        avatar_url: prd.author_avatar,
        company: prd.author_company
      },
      prd: {
        content: prd.prd_content,
        sections: JSON.parse(prd.prd_sections || '[]')
      },
      engagement_score: this.calculateEngagementScore(prd)
    };
  }

  // Like/unlike PRD
  async toggleLike(prdId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const existingLike = await db('prd_likes')
      .where({ prd_id: prdId, user_id: userId })
      .first();

    let likeCount: number;
    let isLiked: boolean;

    if (existingLike) {
      // Unlike
      await db('prd_likes')
        .where({ prd_id: prdId, user_id: userId })
        .delete();

      await db('public_prds')
        .where('prd_id', prdId)
        .decrement('like_count', 1);

      isLiked = false;
    } else {
      // Like
      await db('prd_likes')
        .insert({ prd_id: prdId, user_id: userId });

      await db('public_prds')
        .where('prd_id', prdId)
        .increment('like_count', 1);

      // Track viral action
      await ViralTrackingService.trackAction(userId, 'like', 'prd', prdId);

      isLiked = true;
    }

    const prd = await db('public_prds')
      .where('prd_id', prdId)
      .first();

    likeCount = prd?.like_count || 0;

    return { isLiked, likeCount };
  }

  // Share PRD
  async sharePRD(
    prdId: string, 
    userId: string, 
    shareData: SocialShareData
  ): Promise<{ shareUrl: string; shareCount: number }> {
    const publicPrd = await db('public_prds')
      .where('prd_id', prdId)
      .first();

    if (!publicPrd) {
      throw new Error('PRD not found in public gallery');
    }

    // Increment share count
    await db('public_prds')
      .where('prd_id', prdId)
      .increment('share_count', 1);

    // Update social metrics
    const socialMetrics = JSON.parse(publicPrd.social_metrics || '{}');
    socialMetrics[shareData.platform] = (socialMetrics[shareData.platform] || 0) + 1;

    await db('public_prds')
      .where('prd_id', prdId)
      .update({
        social_metrics: JSON.stringify(socialMetrics)
      });

    // Track viral action
    await ViralTrackingService.trackAction(
      userId, 
      'share', 
      'prd', 
      prdId, 
      { platform: shareData.platform }
    );

    const shareUrl = `${process.env.FRONTEND_URL}/gallery/${publicPrd.seo_slug}`;
    const updatedPrd = await db('public_prds').where('prd_id', prdId).first();

    return {
      shareUrl,
      shareCount: updatedPrd?.share_count || 0
    };
  }

  // Clone PRD template
  async clonePRD(prdId: string, userId: string): Promise<{ clonedPrdId: string; cloneCount: number }> {
    const publicPrd = await db('public_prds')
      .leftJoin('prds', 'public_prds.prd_id', 'prds.id')
      .select(['prds.*', 'public_prds.id as public_id'])
      .where('public_prds.prd_id', prdId)
      .first();

    if (!publicPrd) {
      throw new Error('PRD not found in public gallery');
    }

    // Create cloned PRD
    const clonedPrd = await db('prds')
      .insert({
        title: `${publicPrd.title} (Copy)`,
        content: publicPrd.content,
        sections: publicPrd.sections,
        status: 'draft',
        visibility: 'private',
        user_id: userId,
        cloned_from_id: prdId
      })
      .returning('*');

    // Increment clone count
    await db('public_prds')
      .where('prd_id', prdId)
      .increment('clone_count', 1);

    // Track viral action
    await ViralTrackingService.trackAction(userId, 'clone', 'prd', prdId);

    const updatedPrd = await db('public_prds').where('prd_id', prdId).first();

    return {
      clonedPrdId: clonedPrd[0].id,
      cloneCount: updatedPrd?.clone_count || 0
    };
  }

  // Feature PRD (admin only)
  async featurePRD(
    prdId: string,
    reason: string,
    featuredUntil?: Date
  ): Promise<PublicPRD> {
    const updated = await db('public_prds')
      .where('prd_id', prdId)
      .update({
        is_featured: true,
        featured_reason: reason,
        featured_until: featuredUntil || null,
        category: 'featured'
      })
      .returning('*');

    return updated[0];
  }

  // Get trending PRDs (algorithm-based)
  async updateTrendingPRDs(): Promise<void> {
    // Reset all trending flags
    await db('public_prds').update({ is_trending: false });

    // Calculate trending score based on recent engagement
    const trendingPRDs = await db('public_prds')
      .select('id')
      .whereRaw(`
        created_at > NOW() - INTERVAL '7 days' AND
        (view_count + like_count * 2 + share_count * 3) > ?
      `, [10])
      .orderByRaw(`
        (view_count + like_count * 2 + share_count * 3) / 
        EXTRACT(EPOCH FROM (NOW() - created_at)) DESC
      `)
      .limit(20);

    if (trendingPRDs.length > 0) {
      await db('public_prds')
        .whereIn('id', trendingPRDs.map(p => p.id))
        .update({ 
          is_trending: true,
          category: 'trending'
        });
    }
  }

  // Get gallery statistics
  async getGalleryStats(): Promise<{
    totalPRDs: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalClones: number;
    topIndustries: Array<{ industry: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
  }> {
    const [stats, industries, tagStats] = await Promise.all([
      db('public_prds')
        .select([
          db.raw('COUNT(*) as total_prds'),
          db.raw('SUM(view_count) as total_views'),
          db.raw('SUM(like_count) as total_likes'),
          db.raw('SUM(share_count) as total_shares'),
          db.raw('SUM(clone_count) as total_clones')
        ])
        .first(),

      db('public_prds')
        .select('industry')
        .count('* as count')
        .groupBy('industry')
        .orderBy('count', 'desc')
        .limit(10),

      db('public_prds')
        .select(db.raw('jsonb_array_elements_text(tags) as tag'))
        .count('* as count')
        .groupBy('tag')
        .orderBy('count', 'desc')
        .limit(20)
    ]);

    return {
      totalPRDs: parseInt(stats?.total_prds || '0'),
      totalViews: parseInt(stats?.total_views || '0'),
      totalLikes: parseInt(stats?.total_likes || '0'),
      totalShares: parseInt(stats?.total_shares || '0'),
      totalClones: parseInt(stats?.total_clones || '0'),
      topIndustries: industries.map((item: any) => ({
        industry: item.industry,
        count: parseInt(item.count)
      })),
      topTags: tagStats.map((item: any) => ({
        tag: item.tag,
        count: parseInt(item.count)
      }))
    };
  }

  // Private helper methods
  private async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async slugExists(slug: string): Promise<boolean> {
    const existing = await db('public_prds')
      .where('seo_slug', slug)
      .first();
    return !!existing;
  }

  private async incrementViewCount(publicPrdId: string): Promise<void> {
    await db('public_prds')
      .where('id', publicPrdId)
      .increment('view_count', 1);
  }

  private calculateEngagementScore(prd: any): number {
    const views = prd.view_count || 0;
    const likes = prd.like_count || 0;
    const shares = prd.share_count || 0;
    const clones = prd.clone_count || 0;

    // Weighted engagement score
    return views + (likes * 2) + (shares * 3) + (clones * 5);
  }
}

export const publicGalleryService = new PublicGalleryService();