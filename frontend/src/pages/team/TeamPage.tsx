import { createPage } from '../../utils/componentFactory';

const TeamContent = () => (
  <>
    <h1 className="text-2xl font-bold text-white mb-6">Team Management</h1>
    <p className="text-gray-300">Team management interface coming soon...</p>
  </>
);

export const TeamPage = createPage(TeamContent, {
  variant: 'glass',
  displayName: 'TeamPage'
});