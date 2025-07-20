import { db } from '../config/database';
import { viralTrackingService } from './viralTrackingService';

export interface MarketplaceTemplate {
  id: string;
  template_id: string;
  creator_id: string;
  status: 'pending' | 'approved' | 'featured' | 'rejected';
  price: number;
  license_type: 'free' | 'commercial' | 'premium';
  download_count: number;
  purchase_count: number;
  rating_average: number;
  rating_count: number;
  is_featured: boolean;
  featured_until: Date | null;
  preview_images: string[];
  seo_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MarketplaceTemplateWithDetails extends MarketplaceTemplate {
  template: {
    name: string;
    description: string;
    industry: string;
    complexity_level: string;
    tags: string[];
    sections: any[];
    content: any;
  };
  creator: {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    total_templates: number;
    average_rating: number;
  };
  reviews: Array<{
    id: string;
    user: {
      name: string;
      avatar_url: string | null;
    };
    rating: number;
    review: string;
    created_at: Date;
  }>;
}

export interface MarketplaceFilters {
  category?: string;
  industry?: string;
  license_type?: 'free' | 'commercial' | 'premium';
  price_range?: {
    min: number;
    max: number;
  };
  rating_min?: number;
  tags?: string[];
  search?: string;
  sort_by?: 'newest' | 'popular' | 'rating' | 'price_low' | 'price_high';
  page?: number;
  limit?: number;
}

export interface TemplateReview {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  review: string;
  is_verified_purchase: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatorProfile {
  user_id: string;
  total_templates: number;
  total_sales: number;
  total_revenue: number;
  average_rating: number;
  total_downloads: number;
  featured_templates: number;
  top_templates: Array<{
    name: string;
    downloads: number;
    rating: number;
    revenue: number;
  }>;
}

class MarketplaceService {
  // Submit template to marketplace
  async submitTemplate(
    userId: string,
    templateId: string,
    marketplaceData: {
      price?: number;
      license_type: 'free' | 'commercial' | 'premium';
      preview_images?: string[];
      seo_description?: string;
    }
  ): Promise<MarketplaceTemplate> {
    const {
      price = 0,
      license_type,
      preview_images = [],
      seo_description
    } = marketplaceData;

    // Check if template is already in marketplace
    const existing = await db('marketplace_templates')
      .where('template_id', templateId)
      .first();

    if (existing) {
      throw new Error('Template is already submitted to marketplace');
    }

    // Verify template belongs to user
    const template = await db('prd_templates')
      .where('id', templateId)
      .where('created_by', userId)
      .first();

    if (!template) {
      throw new Error('Template not found or unauthorized');
    }

    const marketplaceTemplate = await db('marketplace_templates')
      .insert({
        template_id: templateId,
        creator_id: userId,
        status: 'pending',
        price,
        license_type,
        preview_images: JSON.stringify(preview_images),
        seo_description
      })
      .returning('*');

    return {
      ...marketplaceTemplate[0],
      preview_images: JSON.parse(marketplaceTemplate[0].preview_images || '[]')
    };
  }

  // Get marketplace templates with filters
  async getMarketplaceTemplates(filters: MarketplaceFilters = {}): Promise<{
    templates: MarketplaceTemplateWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      category,
      industry,
      license_type,
      price_range,
      rating_min,
      tags,
      search,
      sort_by = 'newest',
      page = 1,
      limit = 12
    } = filters;

    let query = db('marketplace_templates as mt')
      .leftJoin('prd_templates as pt', 'mt.template_id', 'pt.id')
      .leftJoin('users as u', 'mt.creator_id', 'u.id')
      .select([
        'mt.*',
        'pt.name as template_name',
        'pt.description as template_description',
        'pt.industry as template_industry',
        'pt.complexity_level',
        'pt.tags as template_tags',
        'pt.sections',
        'pt.content',
        'u.name as creator_name',
        'u.avatar_url as creator_avatar',
        'u.bio as creator_bio'
      ])
      .where('mt.status', 'approved');

    // Apply filters
    if (category) {
      query = query.where('pt.category', category);
    }

    if (industry) {
      query = query.where('pt.industry', industry);
    }

    if (license_type) {
      query = query.where('mt.license_type', license_type);
    }

    if (price_range) {
      query = query.whereBetween('mt.price', [price_range.min, price_range.max]);
    }

    if (rating_min) {
      query = query.where('mt.rating_average', '>=', rating_min);
    }

    if (tags && tags.length > 0) {
      query = query.whereRaw("pt.tags ??& ?", [JSON.stringify(tags)]);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('pt.name', `%${search}%`)
          .orWhereILike('pt.description', `%${search}%`)
          .orWhereILike('u.name', `%${search}%`);
      });
    }

    // Apply sorting
    switch (sort_by) {
      case 'popular':
        query = query.orderBy('mt.download_count', 'desc');
        break;
      case 'rating':
        query = query.orderBy('mt.rating_average', 'desc');
        break;
      case 'price_low':
        query = query.orderBy('mt.price', 'asc');
        break;
      case 'price_high':
        query = query.orderBy('mt.price', 'desc');
        break;
      case 'newest':
      default:
        query = query.orderBy('mt.created_at', 'desc');
        break;
    }

    // Get total count
    const totalQuery = query.clone().clearSelect().clearOrder().count('* as total');
    const totalResult = await totalQuery.first();
    const total = parseInt(totalResult?.total as string) || 0;

    // Apply pagination
    const offset = (page - 1) * limit;
    const results = await query.limit(limit).offset(offset);

    // Get creator stats and reviews for each template
    const templatesWithDetails = await Promise.all(
      results.map(async (row) => {
        const [creatorStats, reviews] = await Promise.all([
          this.getCreatorStats(row.creator_id),
          this.getTemplateReviews(row.template_id, 5)
        ]);

        return {
          ...row,
          preview_images: JSON.parse(row.preview_images || '[]'),
          template: {
            name: row.template_name,
            description: row.template_description,
            industry: row.template_industry,
            complexity_level: row.complexity_level,
            tags: JSON.parse(row.template_tags || '[]'),
            sections: JSON.parse(row.sections || '[]'),
            content: row.content
          },
          creator: {
            id: row.creator_id,
            name: row.creator_name,
            avatar_url: row.creator_avatar,
            bio: row.creator_bio,
            total_templates: creatorStats.total_templates,
            average_rating: creatorStats.average_rating
          },
          reviews
        };
      })
    );

    return {
      templates: templatesWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single marketplace template
  async getMarketplaceTemplate(templateId: string): Promise<MarketplaceTemplateWithDetails | null> {
    const template = await db('marketplace_templates as mt')
      .leftJoin('prd_templates as pt', 'mt.template_id', 'pt.id')
      .leftJoin('users as u', 'mt.creator_id', 'u.id')
      .select([
        'mt.*',
        'pt.name as template_name',
        'pt.description as template_description',
        'pt.industry as template_industry',
        'pt.complexity_level',
        'pt.tags as template_tags',
        'pt.sections',
        'pt.content',
        'u.name as creator_name',
        'u.avatar_url as creator_avatar',
        'u.bio as creator_bio'
      ])
      .where('mt.template_id', templateId)
      .where('mt.status', 'approved')
      .first();

    if (!template) {
      return null;
    }

    const [creatorStats, reviews] = await Promise.all([
      this.getCreatorStats(template.creator_id),
      this.getTemplateReviews(templateId)
    ]);

    return {
      ...template,
      preview_images: JSON.parse(template.preview_images || '[]'),
      template: {
        name: template.template_name,
        description: template.template_description,
        industry: template.template_industry,
        complexity_level: template.complexity_level,
        tags: JSON.parse(template.template_tags || '[]'),
        sections: JSON.parse(template.sections || '[]'),
        content: template.content
      },
      creator: {
        id: template.creator_id,
        name: template.creator_name,
        avatar_url: template.creator_avatar,
        bio: template.creator_bio,
        total_templates: creatorStats.total_templates,
        average_rating: creatorStats.average_rating
      },
      reviews
    };
  }

  // Download/Purchase template
  async downloadTemplate(
    templateId: string,
    userId: string,
    paymentIntentId?: string
  ): Promise<{
    template: any;
    downloadUrl: string;
    isPurchase: boolean;
  }> {
    const marketplaceTemplate = await db('marketplace_templates')
      .where('template_id', templateId)
      .where('status', 'approved')
      .first();

    if (!marketplaceTemplate) {
      throw new Error('Template not found or not available');
    }

    const template = await db('prd_templates')
      .where('id', templateId)
      .first();

    if (!template) {
      throw new Error('Template not found');
    }

    const isPurchase = marketplaceTemplate.price > 0;

    // For paid templates, verify payment
    if (isPurchase) {
      if (!paymentIntentId) {
        throw new Error('Payment required for this template');
      }
      // TODO: Verify payment with Stripe
    }

    // Check if user already owns this template
    const existingPurchase = await db('template_purchases')
      .where('template_id', templateId)
      .where('user_id', userId)
      .first();

    if (!existingPurchase) {
      // Record purchase/download
      await db('template_purchases')
        .insert({
          template_id: templateId,
          user_id: userId,
          price_paid: marketplaceTemplate.price,
          payment_intent_id: paymentIntentId || null,
          is_purchase: isPurchase
        });

      // Update download/purchase counts
      if (isPurchase) {
        await db('marketplace_templates')
          .where('template_id', templateId)
          .increment('purchase_count', 1);
      } else {
        await db('marketplace_templates')
          .where('template_id', templateId)
          .increment('download_count', 1);
      }

      // Track viral action
      await viralTrackingService.trackAction(userId, 'clone', 'template', templateId, {
        marketplace: true,
        price: marketplaceTemplate.price
      });
    }

    // Generate download URL (in production, use signed URLs)
    const downloadUrl = `${process.env.API_BASE_URL}/templates/${templateId}/download`;

    return {
      template: {
        ...template,
        tags: JSON.parse(template.tags || '[]'),
        sections: JSON.parse(template.sections || '[]')
      },
      downloadUrl,
      isPurchase
    };
  }

  // Add template review
  async addTemplateReview(
    templateId: string,
    userId: string,
    reviewData: {
      rating: number;
      review: string;
    }
  ): Promise<TemplateReview> {
    const { rating, review } = reviewData;

    // Check if user has purchased/downloaded the template
    const purchase = await db('template_purchases')
      .where('template_id', templateId)
      .where('user_id', userId)
      .first();

    if (!purchase) {
      throw new Error('You must download the template before reviewing');
    }

    // Check if user already reviewed this template
    const existingReview = await db('template_reviews')
      .where('template_id', templateId)
      .where('user_id', userId)
      .first();

    if (existingReview) {
      throw new Error('You have already reviewed this template');
    }

    const templateReview = await db('template_reviews')
      .insert({
        template_id: templateId,
        user_id: userId,
        rating,
        review,
        is_verified_purchase: purchase.is_purchase
      })
      .returning('*');

    // Update template rating
    await this.updateTemplateRating(templateId);

    return templateReview[0];
  }

  // Feature template (admin only)
  async featureTemplate(
    templateId: string,
    featuredUntil?: Date
  ): Promise<MarketplaceTemplate> {
    const updated = await db('marketplace_templates')
      .where('template_id', templateId)
      .update({
        is_featured: true,
        featured_until: featuredUntil || null,
        status: 'featured'
      })
      .returning('*');

    return {
      ...updated[0],
      preview_images: JSON.parse(updated[0].preview_images || '[]')
    };
  }

  // Approve/reject template submission
  async moderateTemplate(
    templateId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<MarketplaceTemplate> {
    const updated = await db('marketplace_templates')
      .where('template_id', templateId)
      .update({ status })
      .returning('*');

    if (!updated[0]) {
      throw new Error('Template not found');
    }

    // Notify creator
    const template = await db('prd_templates')
      .where('id', templateId)
      .first();

    if (template) {
      // TODO: Send notification to creator
    }

    return {
      ...updated[0],
      preview_images: JSON.parse(updated[0].preview_images || '[]')
    };
  }

  // Get marketplace analytics
  async getMarketplaceAnalytics(): Promise<{
    total_templates: number;
    total_downloads: number;
    total_purchases: number;
    total_revenue: number;
    top_creators: Array<{
      name: string;
      templates: number;
      downloads: number;
      revenue: number;
    }>;
    popular_categories: Array<{
      industry: string;
      template_count: number;
      download_count: number;
    }>;
    revenue_trends: Array<{
      date: string;
      revenue: number;
      purchases: number;
    }>;
  }> {
    const [stats, topCreators, categories, revenueTrends] = await Promise.all([
      // Overall statistics
      db('marketplace_templates')
        .select([
          db.raw('COUNT(*) as total_templates'),
          db.raw('SUM(download_count) as total_downloads'),
          db.raw('SUM(purchase_count) as total_purchases'),
          db.raw('SUM(purchase_count * price) as total_revenue')
        ])
        .where('status', 'approved')
        .first(),

      // Top creators
      db('marketplace_templates as mt')
        .leftJoin('users as u', 'mt.creator_id', 'u.id')
        .select([
          'u.name',
          db.raw('COUNT(mt.template_id) as templates'),
          db.raw('SUM(mt.download_count) as downloads'),
          db.raw('SUM(mt.purchase_count * mt.price) as revenue')
        ])
        .where('mt.status', 'approved')
        .groupBy(['u.id', 'u.name'])
        .orderBy('revenue', 'desc')
        .limit(10),

      // Popular categories
      db('marketplace_templates as mt')
        .leftJoin('prd_templates as pt', 'mt.template_id', 'pt.id')
        .select([
          'pt.industry',
          db.raw('COUNT(mt.template_id) as template_count'),
          db.raw('SUM(mt.download_count) as download_count')
        ])
        .where('mt.status', 'approved')
        .groupBy('pt.industry')
        .orderBy('download_count', 'desc'),

      // Revenue trends (last 30 days)
      db('template_purchases')
        .select([
          db.raw('DATE(created_at) as date'),
          db.raw('SUM(price_paid) as revenue'),
          db.raw('COUNT(*) as purchases')
        ])
        .where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"))
        .where('is_purchase', true)
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date')
    ]);

    return {
      total_templates: parseInt(stats?.total_templates || '0'),
      total_downloads: parseInt(stats?.total_downloads || '0'),
      total_purchases: parseInt(stats?.total_purchases || '0'),
      total_revenue: parseFloat(stats?.total_revenue || '0'),
      top_creators: topCreators.map(creator => ({
        name: creator.name,
        templates: parseInt(creator.templates),
        downloads: parseInt(creator.downloads),
        revenue: parseFloat(creator.revenue || '0')
      })),
      popular_categories: categories.map(cat => ({
        industry: cat.industry,
        template_count: parseInt(cat.template_count),
        download_count: parseInt(cat.download_count)
      })),
      revenue_trends: revenueTrends.map(trend => ({
        date: trend.date,
        revenue: parseFloat(trend.revenue || '0'),
        purchases: parseInt(trend.purchases)
      }))
    };
  }

  // Get creator profile and stats
  async getCreatorProfile(userId: string): Promise<CreatorProfile> {
    const [stats, topTemplates] = await Promise.all([
      // Creator statistics
      db('marketplace_templates as mt')
        .leftJoin('template_purchases as tp', 'mt.template_id', 'tp.template_id')
        .select([
          db.raw('COUNT(DISTINCT mt.template_id) as total_templates'),
          db.raw('COUNT(tp.id) as total_sales'),
          db.raw('SUM(tp.price_paid) as total_revenue'),
          db.raw('AVG(mt.rating_average) as average_rating'),
          db.raw('SUM(mt.download_count) as total_downloads'),
          db.raw('COUNT(CASE WHEN mt.is_featured THEN 1 END) as featured_templates')
        ])
        .where('mt.creator_id', userId)
        .where('mt.status', 'approved')
        .first(),

      // Top templates
      db('marketplace_templates as mt')
        .leftJoin('prd_templates as pt', 'mt.template_id', 'pt.id')
        .leftJoin('template_purchases as tp', 'mt.template_id', 'tp.template_id')
        .select([
          'pt.name',
          'mt.download_count',
          'mt.rating_average',
          db.raw('SUM(tp.price_paid) as revenue')
        ])
        .where('mt.creator_id', userId)
        .where('mt.status', 'approved')
        .groupBy(['pt.id', 'pt.name', 'mt.download_count', 'mt.rating_average'])
        .orderBy('mt.download_count', 'desc')
        .limit(5)
    ]);

    return {
      user_id: userId,
      total_templates: parseInt(stats?.total_templates || '0'),
      total_sales: parseInt(stats?.total_sales || '0'),
      total_revenue: parseFloat(stats?.total_revenue || '0'),
      average_rating: parseFloat(stats?.average_rating || '0'),
      total_downloads: parseInt(stats?.total_downloads || '0'),
      featured_templates: parseInt(stats?.featured_templates || '0'),
      top_templates: topTemplates.map(template => ({
        name: template.name,
        downloads: template.download_count,
        rating: template.rating_average,
        revenue: parseFloat(template.revenue || '0')
      }))
    };
  }

  // Private helper methods
  private async getCreatorStats(userId: string): Promise<{
    total_templates: number;
    average_rating: number;
  }> {
    const stats = await db('marketplace_templates')
      .select([
        db.raw('COUNT(*) as total_templates'),
        db.raw('AVG(rating_average) as average_rating')
      ])
      .where('creator_id', userId)
      .where('status', 'approved')
      .first();

    return {
      total_templates: parseInt(stats?.total_templates || '0'),
      average_rating: parseFloat(stats?.average_rating || '0')
    };
  }

  private async getTemplateReviews(
    templateId: string,
    limit?: number
  ): Promise<Array<{
    id: string;
    user: {
      name: string;
      avatar_url: string | null;
    };
    rating: number;
    review: string;
    created_at: Date;
  }>> {
    let query = db('template_reviews as tr')
      .leftJoin('users as u', 'tr.user_id', 'u.id')
      .select([
        'tr.id',
        'tr.rating',
        'tr.review',
        'tr.created_at',
        'u.name as user_name',
        'u.avatar_url'
      ])
      .where('tr.template_id', templateId)
      .orderBy('tr.created_at', 'desc');

    if (limit) {
      query = query.limit(limit);
    }

    const reviews = await query;

    return reviews.map(review => ({
      id: review.id,
      user: {
        name: review.user_name,
        avatar_url: review.avatar_url
      },
      rating: review.rating,
      review: review.review,
      created_at: review.created_at
    }));
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    const stats = await db('template_reviews')
      .select([
        db.raw('AVG(rating) as average_rating'),
        db.raw('COUNT(*) as rating_count')
      ])
      .where('template_id', templateId)
      .first();

    await db('marketplace_templates')
      .where('template_id', templateId)
      .update({
        rating_average: parseFloat(stats?.average_rating || '0'),
        rating_count: parseInt(stats?.rating_count || '0')
      });
  }
}

export const marketplaceService = new MarketplaceService();