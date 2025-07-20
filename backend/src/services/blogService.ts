import { db } from '../config/database';
import { generateSlug } from '../utils/slugGenerator';
import { viralTrackingService } from './viralTrackingService';

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown content
  html_content: string; // Rendered HTML
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  featured_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  read_time_minutes: number;
  view_count: number;
  share_count: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogPostWithAuthor extends BlogPost {
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

export interface BlogFilters {
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  author_id?: string;
  search?: string;
  sort_by?: 'newest' | 'oldest' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

export interface CreateBlogPostRequest {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  featured_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  status?: 'draft' | 'published';
  published_at?: Date;
}

export interface UpdateBlogPostRequest extends Partial<CreateBlogPostRequest> {
  slug?: string;
}

class BlogService {
  // Create new blog post
  async createBlogPost(
    authorId: string,
    postData: CreateBlogPostRequest
  ): Promise<BlogPost> {
    const {
      title,
      excerpt,
      content,
      category,
      tags = [],
      featured_image_url,
      seo_title,
      seo_description,
      seo_keywords = [],
      status = 'draft',
      published_at
    } = postData;

    // Generate unique slug
    const slug = await this.generateUniqueSlug(title);
    
    // Calculate read time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);

    // Convert markdown to HTML (you might want to use a markdown parser like 'marked')
    const htmlContent = this.markdownToHtml(content);

    const blogPost = await db('blog_posts')
      .insert({
        author_id: authorId,
        title,
        slug,
        excerpt,
        content,
        html_content: htmlContent,
        status,
        category,
        tags: JSON.stringify(tags),
        featured_image_url: featured_image_url || null,
        seo_title: seo_title || title,
        seo_description: seo_description || excerpt,
        seo_keywords: JSON.stringify(seo_keywords),
        read_time_minutes: readTimeMinutes,
        published_at: status === 'published' ? (published_at || new Date()) : null
      })
      .returning('*');

    return {
      ...blogPost[0],
      tags: JSON.parse(blogPost[0].tags || '[]'),
      seo_keywords: JSON.parse(blogPost[0].seo_keywords || '[]')
    };
  }

  // Get blog posts with filters
  async getBlogPosts(filters: BlogFilters = {}): Promise<{
    posts: BlogPostWithAuthor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      category,
      tags,
      status = 'published',
      author_id,
      search,
      sort_by = 'newest',
      page = 1,
      limit = 10
    } = filters;

    let query = db('blog_posts as bp')
      .leftJoin('users as u', 'bp.author_id', 'u.id')
      .select([
        'bp.*',
        'u.name as author_name',
        'u.avatar_url as author_avatar',
        'u.bio as author_bio'
      ]);

    // Apply filters
    if (status) {
      query = query.where('bp.status', status);
    }

    if (category) {
      query = query.where('bp.category', category);
    }

    if (author_id) {
      query = query.where('bp.author_id', author_id);
    }

    if (tags && tags.length > 0) {
      query = query.whereRaw("bp.tags ??& ?", [JSON.stringify(tags)]);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('bp.title', `%${search}%`)
          .orWhereILike('bp.excerpt', `%${search}%`)
          .orWhereILike('bp.content', `%${search}%`);
      });
    }

    // Apply sorting
    switch (sort_by) {
      case 'oldest':
        query = query.orderBy('bp.published_at', 'asc');
        break;
      case 'popular':
        query = query.orderBy('bp.view_count', 'desc');
        break;
      case 'trending':
        query = query.orderByRaw(`
          (bp.view_count + bp.share_count * 2) / 
          EXTRACT(EPOCH FROM (NOW() - bp.published_at)) DESC
        `);
        break;
      case 'newest':
      default:
        query = query.orderBy('bp.published_at', 'desc');
        break;
    }

    // Get total count
    const totalQuery = query.clone().clearSelect().clearOrder().count('* as total');
    const totalResult = await totalQuery.first();
    const total = parseInt(totalResult?.total as string) || 0;

    // Apply pagination
    const offset = (page - 1) * limit;
    const results = await query.limit(limit).offset(offset);

    const posts = results.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      seo_keywords: JSON.parse(row.seo_keywords || '[]'),
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar_url: row.author_avatar,
        bio: row.author_bio
      }
    }));

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single blog post by slug
  async getBlogPostBySlug(slug: string, viewerId?: string): Promise<BlogPostWithAuthor | null> {
    const post = await db('blog_posts as bp')
      .leftJoin('users as u', 'bp.author_id', 'u.id')
      .select([
        'bp.*',
        'u.name as author_name',
        'u.avatar_url as author_avatar',
        'u.bio as author_bio'
      ])
      .where('bp.slug', slug)
      .where('bp.status', 'published')
      .first();

    if (!post) {
      return null;
    }

    // Increment view count
    await this.incrementViewCount(post.id);

    // Track view if viewer is authenticated
    if (viewerId) {
      await viralTrackingService.trackAction(viewerId, 'view', 'blog_post', post.id);
    }

    return {
      ...post,
      tags: JSON.parse(post.tags || '[]'),
      seo_keywords: JSON.parse(post.seo_keywords || '[]'),
      author: {
        id: post.author_id,
        name: post.author_name,
        avatar_url: post.author_avatar,
        bio: post.author_bio
      }
    };
  }

  // Update blog post
  async updateBlogPost(
    postId: string,
    authorId: string,
    updateData: UpdateBlogPostRequest
  ): Promise<BlogPost> {
    const existingPost = await db('blog_posts')
      .where('id', postId)
      .where('author_id', authorId)
      .first();

    if (!existingPost) {
      throw new Error('Blog post not found or unauthorized');
    }

    const updateFields: any = { ...updateData };

    // Handle slug update
    if (updateData.title && updateData.title !== existingPost.title) {
      updateFields.slug = await this.generateUniqueSlug(updateData.title);
    }

    // Update read time if content changed
    if (updateData.content) {
      const wordCount = updateData.content.split(/\s+/).length;
      updateFields.read_time_minutes = Math.ceil(wordCount / 200);
      updateFields.html_content = this.markdownToHtml(updateData.content);
    }

    // Handle publishing
    if (updateData.status === 'published' && existingPost.status === 'draft') {
      updateFields.published_at = new Date();
    }

    // Serialize arrays
    if (updateData.tags) {
      updateFields.tags = JSON.stringify(updateData.tags);
    }
    if (updateData.seo_keywords) {
      updateFields.seo_keywords = JSON.stringify(updateData.seo_keywords);
    }

    const updatedPost = await db('blog_posts')
      .where('id', postId)
      .update(updateFields)
      .returning('*');

    return {
      ...updatedPost[0],
      tags: JSON.parse(updatedPost[0].tags || '[]'),
      seo_keywords: JSON.parse(updatedPost[0].seo_keywords || '[]')
    };
  }

  // Delete blog post
  async deleteBlogPost(postId: string, authorId: string): Promise<void> {
    const deleted = await db('blog_posts')
      .where('id', postId)
      .where('author_id', authorId)
      .delete();

    if (deleted === 0) {
      throw new Error('Blog post not found or unauthorized');
    }
  }

  // Share blog post
  async shareBlogPost(
    postId: string,
    userId: string,
    platform: string
  ): Promise<{ shareUrl: string; shareCount: number }> {
    const post = await db('blog_posts')
      .where('id', postId)
      .where('status', 'published')
      .first();

    if (!post) {
      throw new Error('Blog post not found');
    }

    // Increment share count
    await db('blog_posts')
      .where('id', postId)
      .increment('share_count', 1);

    // Track viral action
    await viralTrackingService.trackAction(
      userId,
      'share',
      'blog_post',
      postId,
      { platform }
    );

    const shareUrl = `${process.env.FRONTEND_URL}/blog/${post.slug}`;
    const updatedPost = await db('blog_posts').where('id', postId).first();

    return {
      shareUrl,
      shareCount: updatedPost?.share_count || 0
    };
  }

  // Get blog categories with post counts
  async getBlogCategories(): Promise<Array<{ category: string; post_count: number }>> {
    const categories = await db('blog_posts')
      .select('category')
      .count('* as post_count')
      .where('status', 'published')
      .groupBy('category')
      .orderBy('post_count', 'desc');

    return categories.map(cat => ({
      category: cat.category,
      post_count: parseInt(cat.post_count as string)
    }));
  }

  // Get popular tags
  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    const tags = await db('blog_posts')
      .select(db.raw('jsonb_array_elements_text(tags) as tag'))
      .count('* as count')
      .where('status', 'published')
      .groupBy('tag')
      .orderBy('count', 'desc')
      .limit(limit);

    return tags.map(tag => ({
      tag: tag.tag,
      count: parseInt(tag.count as string)
    }));
  }

  // Get related blog posts
  async getRelatedPosts(
    postId: string,
    limit: number = 3
  ): Promise<BlogPostWithAuthor[]> {
    const currentPost = await db('blog_posts')
      .where('id', postId)
      .first();

    if (!currentPost) {
      return [];
    }

    const currentTags = JSON.parse(currentPost.tags || '[]');

    // Find posts with similar tags or same category
    const relatedPosts = await db('blog_posts as bp')
      .leftJoin('users as u', 'bp.author_id', 'u.id')
      .select([
        'bp.*',
        'u.name as author_name',
        'u.avatar_url as author_avatar',
        'u.bio as author_bio'
      ])
      .where('bp.status', 'published')
      .where('bp.id', '!=', postId)
      .where((builder) => {
        builder
          .where('bp.category', currentPost.category)
          .orWhereRaw('bp.tags ??& ?', [JSON.stringify(currentTags)]);
      })
      .orderBy('bp.view_count', 'desc')
      .limit(limit);

    return relatedPosts.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      seo_keywords: JSON.parse(row.seo_keywords || '[]'),
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar_url: row.author_avatar,
        bio: row.author_bio
      }
    }));
  }

  // Get blog analytics
  async getBlogAnalytics(authorId?: string): Promise<{
    total_posts: number;
    published_posts: number;
    total_views: number;
    total_shares: number;
    average_read_time: number;
    top_posts: Array<{
      title: string;
      slug: string;
      view_count: number;
      share_count: number;
    }>;
    popular_categories: Array<{
      category: string;
      post_count: number;
      view_count: number;
    }>;
  }> {
    let baseQuery = db('blog_posts');
    
    if (authorId) {
      baseQuery = baseQuery.where('author_id', authorId);
    }

    const [stats, topPosts, categoryStats] = await Promise.all([
      // Overall statistics
      baseQuery.clone()
        .select([
          db.raw('COUNT(*) as total_posts'),
          db.raw(`COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts`),
          db.raw('SUM(view_count) as total_views'),
          db.raw('SUM(share_count) as total_shares'),
          db.raw('AVG(read_time_minutes) as average_read_time')
        ])
        .first(),

      // Top performing posts
      baseQuery.clone()
        .select(['title', 'slug', 'view_count', 'share_count'])
        .where('status', 'published')
        .orderBy('view_count', 'desc')
        .limit(10),

      // Category performance
      baseQuery.clone()
        .select([
          'category',
          db.raw('COUNT(*) as post_count'),
          db.raw('SUM(view_count) as view_count')
        ])
        .where('status', 'published')
        .groupBy('category')
        .orderBy('view_count', 'desc')
    ]);

    return {
      total_posts: parseInt(stats?.total_posts || '0'),
      published_posts: parseInt(stats?.published_posts || '0'),
      total_views: parseInt(stats?.total_views || '0'),
      total_shares: parseInt(stats?.total_shares || '0'),
      average_read_time: parseFloat(stats?.average_read_time || '0'),
      top_posts: topPosts.map(post => ({
        title: post.title,
        slug: post.slug,
        view_count: post.view_count,
        share_count: post.share_count
      })),
      popular_categories: categoryStats.map(cat => ({
        category: cat.category,
        post_count: parseInt(cat.post_count as string),
        view_count: parseInt(cat.view_count as string)
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
    const existing = await db('blog_posts')
      .where('slug', slug)
      .first();
    return !!existing;
  }

  private async incrementViewCount(postId: string): Promise<void> {
    await db('blog_posts')
      .where('id', postId)
      .increment('view_count', 1);
  }

  private markdownToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    // In production, use a proper markdown parser like 'marked' or 'markdown-it'
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
  }
}

export const blogService = new BlogService();