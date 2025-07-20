
import { createPage } from '../utils/componentFactory';

const PublicGalleryContent = () => (
  <div className="max-w-7xl mx-auto">
    <div className="glass-card p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Public PRD Gallery</h1>
      <p className="text-gray-300">Public gallery interface coming soon...</p>
    </div>
  </div>
);

export const PublicGalleryPage = createPage(PublicGalleryContent, {
  variant: 'animated',
  displayName: 'PublicGalleryPage'
});