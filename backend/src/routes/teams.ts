import express from 'express';
import { requireAuth, BackendAuthenticatedRequest } from '../middleware/auth';
import { teamService } from '../services/teamService';
import { prdService } from '../services/prdService';
import { memberService } from '../services/memberService';
import { validateBody, validateQuery } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { asyncWrapper } from '../utils/helpers';

const router = express.Router();

// Create new team
router.post('/', 
  requireAuth,
  validateBody(validationSchemas.team.create),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { name } = req.body;
    
    const team = await teamService.createTeam(req.user.id, { name });
    
    res.status(201).json({
      success: true,
      data: { team },
      message: 'Team created successfully',
    });
  })
);

// Get user's teams
router.get('/my-teams', 
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const teams = await teamService.getUserTeams(req.user.id);
    
    res.json({
      success: true,
      data: { teams },
    });
  })
);

// Switch current team
router.post('/switch',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.body;
    
    const team = await teamService.switchTeam(req.user.id, teamId);
    
    res.json({
      success: true,
      data: { team },
      message: 'Team switched successfully',
    });
  })
);

// Get team details
router.get('/:teamId',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const team = await teamService.getTeam(teamId, req.user.id);
    
    res.json({
      success: true,
      data: { team },
    });
  })
);

// Update team
router.put('/:teamId',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { name, description, avatar_url } = req.body;
    
    const team = await teamService.updateTeam(teamId, req.user.id, {
      name,
      description,
      avatar_url,
    });
    
    res.json({
      success: true,
      data: { team },
      message: 'Team updated successfully',
    });
  })
);

// Enhanced Invitation Management

// Create invitation
router.post('/:teamId/invitations',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { email, role = 'member', message } = req.body;
    
    const invitation = await memberService.createInvitation(
      teamId, 
      req.user.id, 
      email, 
      role, 
      message
    );
    
    res.status(201).json({
      success: true,
      data: { invitation },
      message: 'Invitation sent successfully',
    });
  })
);

// Get team invitations
router.get('/:teamId/invitations',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const invitations = await memberService.getTeamInvitations(teamId, req.user.id);
    
    res.json({
      success: true,
      data: { invitations },
    });
  })
);

// Resend invitation
router.post('/:teamId/invitations/:invitationId/resend',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId, invitationId } = req.params;
    
    await memberService.resendInvitation(teamId, req.user.id, invitationId);
    
    res.json({
      success: true,
      message: 'Invitation resent successfully',
    });
  })
);

// Cancel invitation
router.delete('/:teamId/invitations/:invitationId',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId, invitationId } = req.params;
    
    await memberService.cancelInvitation(teamId, req.user.id, invitationId);
    
    res.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  })
);

// Enhanced Member Management

// Get team members with activity data
router.get('/:teamId/members',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const members = await memberService.getTeamMembersWithActivity(teamId, req.user.id);
    
    res.json({
      success: true,
      data: { members },
    });
  })
);

// Update member role
router.put('/:teamId/members/:memberId/role',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId, memberId } = req.params;
    const { role, reason } = req.body;
    
    await memberService.updateMemberRole(teamId, req.user.id, memberId, role, reason);
    
    res.json({
      success: true,
      message: 'Member role updated successfully',
    });
  })
);

// Remove team member
router.delete('/:teamId/members/:memberId',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId, memberId } = req.params;
    const { reason } = req.body;
    
    await memberService.removeMember(teamId, req.user.id, memberId, reason);
    
    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  })
);

// Activity and Analytics

// Get member activity logs
router.get('/:teamId/activity',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { limit = 50 } = req.query;
    
    const activities = await memberService.getMemberActivity(
      teamId, 
      req.user.id, 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: { activities },
    });
  })
);

// Get role change history
router.get('/:teamId/role-history',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const history = await memberService.getRoleChangeHistory(teamId, req.user.id);
    
    res.json({
      success: true,
      data: { history },
    });
  })
);

// Legacy compatibility routes

// Invite team member (legacy)
router.post('/:teamId/invite',
  requireAuth,
  validateBody(validationSchemas.team.inviteMember),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { email } = req.body;
    
    await teamService.inviteMember(teamId, req.user.id, email);
    
    res.json({
      success: true,
      message: 'Member invited successfully',
    });
  })
);

// Get team PRDs
router.get('/:teamId/prds',
  requireAuth,
  validateQuery(validationSchemas.prd.filters),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const result = await prdService.getTeamPRDs(teamId, req.user.id, req.query as any);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// Get team settings
router.get('/:teamId/settings',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const settings = await teamService.getTeamSettings(teamId, req.user.id);
    
    res.json({
      success: true,
      data: settings,
    });
  })
);

// Transfer team ownership
router.post('/:teamId/transfer-ownership',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { newOwnerId, reason } = req.body;
    
    if (!newOwnerId) {
      return res.status(400).json({ 
        success: false,
        error: 'New owner ID is required' 
      });
    }
    
    await teamService.transferOwnership(teamId, req.user.id, newOwnerId, reason);
    
    res.json({
      success: true,
      message: 'Ownership transferred successfully',
    });
  })
);

// Delete team
router.delete('/:teamId',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { reason } = req.body;
    
    await teamService.deleteTeam(teamId, req.user.id, reason);
    
    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  })
);

export default router;