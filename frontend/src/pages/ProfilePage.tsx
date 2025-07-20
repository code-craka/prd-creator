
import { createPage } from '../utils/componentFactory';

const ProfileContent = () => (
  <>
    <h1 className="text-2xl font-bold text-white mb-6">Profile Settings</h1>
    <p className="text-gray-300">Profile management interface coming soon...</p>
  </>
);

export const ProfilePage = createPage(ProfileContent, {
  variant: 'glass',
  displayName: 'ProfilePage'
});