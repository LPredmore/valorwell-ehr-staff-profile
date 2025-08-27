
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useIframe } from '@/context/IframeContext';
import { getIframeClasses } from '@/utils/iframeUtils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { config } = useIframe();
  const classes = getIframeClasses();

  // Determine what to show based on iframe configuration
  const showHeader = !config.isIframeMode || !config.hideHeader;
  const showSidebar = !config.isIframeMode || !config.hideSidebar;

  // Calculate layout classes
  const flexContainerHeight = showHeader 
    ? config.isIframeMode ? "h-[calc(100%-4rem)]" : "h-[calc(100vh-4rem)]"
    : "h-full";

  // Iframe-specific container classes
  const containerClass = config.isIframeMode 
    ? `${classes.container} bg-background overflow-hidden` 
    : "min-h-screen bg-background";

  // Main content classes with iframe optimizations
  const mainClass = config.isIframeMode
    ? `${classes.main} flex-1 overflow-auto`
    : "flex-1 overflow-auto p-6";

  return (
    <div className={containerClass}>
      {showHeader && (
        <div className={classes.header}>
          <Header />
        </div>
      )}
      
      <div className={`flex ${flexContainerHeight}`}>
        {showSidebar && (
          <div className={config.isIframeMode ? 'iframe-sidebar' : ''}>
            <Sidebar />
          </div>
        )}
        
        <main className={`${mainClass} ${classes.content}`}>
          <div className={config.isIframeMode ? 'iframe-content-wrapper h-full' : ''}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
