import React from 'react';

// Generic page wrapper with common styling and structure
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'animated' | 'centered';
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  className = '', 
  variant = 'glass' 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'glass-card p-8';
      case 'animated':
        return 'min-h-screen animated-bg p-6';
      case 'centered':
        return 'min-h-screen animated-bg flex items-center justify-center';
      default:
        return 'glass-card p-8';
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Factory function to create consistent page components
export const createPage = (
  content: React.ReactNode | (() => React.ReactNode),
  options: {
    variant?: 'glass' | 'animated' | 'centered';
    className?: string;
    displayName?: string;
  } = {}
) => {
  const PageComponent: React.FC = () => {
    const renderContent = typeof content === 'function' ? content() : content;
    
    return (
      <PageWrapper 
        variant={options.variant} 
        className={options.className}
      >
        {renderContent}
      </PageWrapper>
    );
  };

  if (options.displayName) {
    PageComponent.displayName = options.displayName;
  }

  return PageComponent;
};

// Higher-order component for common page patterns
export const withPageWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  wrapperOptions: {
    variant?: 'glass' | 'animated' | 'centered';
    className?: string;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PageWrapper {...wrapperOptions}>
      <Component {...props} />
    </PageWrapper>
  );

  WrappedComponent.displayName = `withPageWrapper(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Common placeholder component for unimplemented pages
export const PlaceholderPage = createPage(
  <div className="text-center">
    <h1 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon</h1>
    <p className="text-gray-600">This page is under development.</p>
  </div>,
  { displayName: 'PlaceholderPage' }
);