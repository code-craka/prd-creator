import express from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { teamService } from '../services/teamService';
import { prdService } from '../services/prdService';
import { validateBody, validateQuery } from '../utils/validation';
import { createTeamSchema, inviteMemberSchema, updateMemberRoleSchema, prdFiltersSchema } from '../utils/validation';
import { asyncWrapper } from '../utils/helpers';

const router = express.Router();

// Create new team
router.post('/', 
  requireAuth,
  validateBody(createTeamSchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
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
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
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
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
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
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
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
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
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

// Invite team member
router.post('/:teamId/invite',
  requireAuth,
  validateBody(inviteMemberSchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    const { email } = req.body;
    
    await teamService.inviteMember(teamId, req.user.id, email);
    
    res.json({
      success: true,
      message: 'Member invited successfully',
    });
  })
);

// Get team members
router.get('/:teamId/members',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const members = await teamService.getTeamMembers(teamId, req.user.id);
    
    res.json({
      success: true,
      data: { members },
    });
  })
);

// Update member role
router.put('/:teamId/members/:memberId/role',
  requireAuth,
  validateBody(updateMemberRoleSchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId, memberId } = req.params;
    const { role } = req.body;
    
    await teamService.updateMemberRole(teamId, req.user.id, memberId, role);
    
    res.json({
      success: true,
      message: 'Member role updated successfully',
    });
  })
);

// Remove team member
router.delete('/:teamId/members/:memberId',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId, memberId } = req.params;
    
    await teamService.removeMember(teamId, req.user.id, memberId);
    
    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  })
);

// Get team PRDs
router.get('/:teamId/prds',
  requireAuth,
  validateQuery(prdFiltersSchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    const result = await prdService.getTeamPRDs(teamId, req.user.id, req.query as any);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// Delete team
router.delete('/:teamId',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.params;
    
    await teamService.deleteTeam(teamId, req.user.id);
    
    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  })
);

export default router;