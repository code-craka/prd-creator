import { db } from '../config/database';
import { generateShareToken, getPaginationInfo } from '../utils/helpers';
import { teamService } from './teamService';
import { ErrorFactory } from '../utils/errorHelpers';
import { 
  PRD, 
  CreatePRDRequest, 
  PRDFilters, 
  PaginatedResponse,
  validatePRDData,
  validatePRDFilters
} from 'prd-creator-shared';

export class PRDService {
  async createPRD(userId: string, data: CreatePRDRequest): Promise<PRD> {
    // Use shared validation
    const validationResult = validatePRDData(data);
    if (!validationResult.isValid) {
      throw ErrorFactory.validation(validationResult.errors.join(', '));
    }

    // If teamId is provided, verify user is a team member
    if (data.teamId) {
      await teamService['verifyTeamMembership'](data.teamId, userId);
    }

    // If visibility is team but no teamId, use user's current team
    let teamId = data.teamId;
    if (data.visibility === 'team' && !teamId) {
      const user = await db('users').where('id', userId).first();
      teamId = user?.current_team_id;
      
      if (!teamId) {
        throw ErrorFactory.validation('Team visibility requires team membership');
      }
    }

    const [prd] = await db('prds').insert({
      user_id: userId,
      team_id: teamId,
      title: data.title.trim(),
      content: data.content,
      visibility: data.visibility || 'private',
      metadata: data.metadata || {},
      template_id: data.template_id || null,
    }).returning('*');

    // TODO: Track analytics
    // await this.trackEvent(userId, 'prd_created', { prdId: prd.id, teamId });

    return prd;
  }

  async getPRD(prdId: string, userId?: string): Promise<PRD> {
    const prd = await db('prds')
      .where('id', prdId)
      .first();

    if (!prd) {
      throw ErrorFactory.notFound('PRD not found');
    }

    // Check access permissions
    await this.verifyPRDAccess(prd, userId);

    // Increment view count if not the owner
    if (userId && userId !== prd.user_id) {
      await db('prds')
        .where('id', prdId)
        .increment('view_count', 1);
    }

    return prd;
  }

  async updatePRD(prdId: string, userId: string, updates: Partial<CreatePRDRequest>): Promise<PRD> {
    const prd = await this.getPRD(prdId, userId);

    // Verify ownership or team admin permissions
    if (prd.user_id !== userId) {
      if (prd.team_id) {
        await teamService['verifyTeamPermission'](prd.team_id, userId, ['owner', 'admin']);
      } else {
        throw ErrorFactory.forbidden('Cannot edit this PRD');
      }
    }

    // Validate individual fields if they are being updated
    if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
      throw ErrorFactory.validation('PRD title cannot be empty');
    }
    if (updates.content !== undefined && (!updates.content || updates.content.trim().length === 0)) {
      throw ErrorFactory.validation('PRD content cannot be empty');
    }

    const cleanUpdates: any = {};
    if (updates.title !== undefined) {
      cleanUpdates.title = updates.title.trim();
    }
    if (updates.content !== undefined) {
      cleanUpdates.content = updates.content;
    }
    if (updates.visibility !== undefined) {
      cleanUpdates.visibility = updates.visibility;
    }
    if (updates.metadata !== undefined) {
      cleanUpdates.metadata = updates.metadata;
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return prd;
    }

    const [updatedPRD] = await db('prds')
      .where('id', prdId)
      .update(cleanUpdates)
      .returning('*');

    return updatedPRD;
  }

  async deletePRD(prdId: string, userId: string): Promise<void> {
    const prd = await this.getPRD(prdId, userId);

    // Verify ownership or team admin permissions
    if (prd.user_id !== userId) {
      if (prd.team_id) {
        await teamService['verifyTeamPermission'](prd.team_id, userId, ['owner', 'admin']);
      } else {
        throw ErrorFactory.forbidden('Cannot delete this PRD');
      }
    }

    await db('prds').where('id', prdId).del();
  }

  async getUserPRDs(userId: string, filters: PRDFilters = {}): Promise<PaginatedResponse<PRD>> {
    // Validate filters using shared validation
    const validationResult = validatePRDFilters(filters);
    if (!validationResult.isValid) {
      throw ErrorFactory.validation(validationResult.errors.join(', '));
    }

    let query = db('prds')
      .where('user_id', userId);

    // Apply filters
    if (filters.search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${filters.search}%`)
            .orWhere('content', 'ilike', `%${filters.search}%`);
      });
    }

    if (filters.dateFrom) {
      query = query.where('created_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('created_at', '<=', filters.dateTo);
    }

    if (filters.templateId) {
      query = query.where('template_id', filters.templateId);
    }

    // Get total count
    const totalResult = await query.clone().count('* as count').first();
    const total = parseInt(totalResult?.count as string) || 0;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const prds = await query
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: prds,
      pagination: getPaginationInfo(page, limit, total),
    };
  }

  async getTeamPRDs(teamId: string, userId: string, filters: PRDFilters = {}): Promise<PaginatedResponse<PRD & { author_name: string; author_avatar: string }>> {
    // Verify team membership
    await teamService['verifyTeamMembership'](teamId, userId);

    let query = db('prds')
      .join('users', 'prds.user_id', 'users.id')
      .where('prds.team_id', teamId)
      .where('prds.visibility', 'team')
      .select([
        'prds.*',
        'users.name as author_name',
        'users.avatar_url as author_avatar'
      ]);

    // Apply filters
    if (filters.search) {
      query = query.where(function() {
        this.where('prds.title', 'ilike', `%${filters.search}%`)
            .orWhere('prds.content', 'ilike', `%${filters.search}%`);
      });
    }

    if (filters.author) {
      query = query.where('users.name', 'ilike', `%${filters.author}%`);
    }

    if (filters.dateFrom) {
      query = query.where('prds.created_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('prds.created_at', '<=', filters.dateTo);
    }

    if (filters.templateId) {
      query = query.where('prds.template_id', filters.templateId);
    }

    // Get total count - fix GROUP BY issue for team PRDs
    const totalResult = await db('prds')
      .where('prds.team_id', teamId)
      .where('prds.visibility', 'team')
      .modify((queryBuilder) => {
        // Apply the same filters for count
        if (filters.search) {
          queryBuilder.where(function() {
            this.where('prds.title', 'ilike', `%${filters.search}%`)
                .orWhere('prds.content', 'ilike', `%${filters.search}%`);
          });
        }

        if (filters.author) {
          queryBuilder.join('users', 'prds.user_id', 'users.id')
                     .where('users.name', 'ilike', `%${filters.author}%`);
        }

        if (filters.dateFrom) {
          queryBuilder.where('prds.created_at', '>=', filters.dateFrom);
        }

        if (filters.dateTo) {
          queryBuilder.where('prds.created_at', '<=', filters.dateTo);
        }

        if (filters.templateId) {
          queryBuilder.where('prds.template_id', filters.templateId);
        }
      })
      .count('prds.id as count')
      .first();
    
    const total = parseInt(totalResult?.count as string) || 0;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const prds = await query
      .orderBy('prds.updated_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: prds,
      pagination: getPaginationInfo(page, limit, total),
    };
  }

  async sharePRDWithTeam(prdId: string, userId: string): Promise<void> {
    const prd = await this.getPRD(prdId, userId);

    if (prd.user_id !== userId) {
      throw ErrorFactory.forbidden('Only PRD owner can share with team');
    }

    if (!prd.team_id) {
      throw ErrorFactory.validation('PRD must belong to a team to be shared');
    }

    await db('prds')
      .where('id', prdId)
      .update({
        visibility: 'team',
        updated_at: db.fn.now(),
      });

    // TODO: Track analytics
    // await this.trackEvent(userId, 'prd_shared_with_team', { prdId, teamId: prd.team_id });
  }

  async createPublicShareLink(prdId: string, userId: string): Promise<string> {
    const prd = await this.getPRD(prdId, userId);

    if (prd.user_id !== userId) {
      throw ErrorFactory.forbidden('Only PRD owner can create public share links');
    }

    let shareToken = prd.share_token;

    if (!shareToken) {
      shareToken = generateShareToken();
      await db('prds')
        .where('id', prdId)
        .update({
          share_token: shareToken,
          visibility: 'public',
          updated_at: db.fn.now(),
        });
    }

    return shareToken;
  }

  async getSharedPRD(shareToken: string): Promise<PRD & { author_name: string; author_avatar?: string }> {
    const prd = await db('prds')
      .join('users', 'prds.user_id', 'users.id')
      .where('prds.share_token', shareToken)
      .where('prds.visibility', 'public')
      .select([
        'prds.*',
        'users.name as author_name',
        'users.avatar_url as author_avatar'
      ])
      .first();

    if (!prd) {
      throw ErrorFactory.notFound('Shared PRD not found');
    }

    // Increment view count
    await db('prds')
      .where('share_token', shareToken)
      .increment('view_count', 1);

    return prd;
  }

  async getPublicPRDs(filters: PRDFilters = {}): Promise<PaginatedResponse<PRD & { author_name: string; author_avatar?: string }>> {
    let query = db('prds')
      .join('users', 'prds.user_id', 'users.id')
      .where('prds.visibility', 'public')
      .whereNotNull('prds.share_token')
      .select([
        'prds.id',
        'prds.title',
        'prds.created_at',
        'prds.updated_at',
        'prds.view_count',
        'prds.template_id',
        'users.name as author_name',
        'users.avatar_url as author_avatar'
      ]);

    // Apply filters
    if (filters.search) {
      query = query.where(function() {
        this.where('prds.title', 'ilike', `%${filters.search}%`);
      });
    }

    if (filters.templateId) {
      query = query.where('prds.template_id', filters.templateId);
    }

    // Get total count
    const totalResult = await query.clone().count('* as count').first();
    const total = parseInt(totalResult?.count as string) || 0;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const prds = await query
      .orderBy('prds.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: prds,
      pagination: getPaginationInfo(page, limit, total),
    };
  }

  // Helper method to verify PRD access
  private async verifyPRDAccess(prd: PRD, userId?: string): Promise<void> {
    // Public PRDs with share tokens are accessible to everyone
    if (prd.visibility === 'public' && prd.share_token) {
      return;
    }

    // Private PRDs require ownership
    if (prd.visibility === 'private') {
      if (!userId || prd.user_id !== userId) {
        throw ErrorFactory.forbidden('Access denied');
      }
      return;
    }

    // Team PRDs require team membership
    if (prd.visibility === 'team') {
      if (!userId) {
        throw ErrorFactory.forbidden('Authentication required');
      }

      if (prd.user_id === userId) {
        return; // Owner can always access
      }

      if (prd.team_id) {
        await teamService['verifyTeamMembership'](prd.team_id, userId);
      } else {
        throw ErrorFactory.forbidden('Access denied');
      }
    }
  }
}

export const prdService = new PRDService();