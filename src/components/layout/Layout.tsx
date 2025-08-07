
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useIframe } from '@/context/IframeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { config } = useIframe();

  // In iframe mode, conditionally hide header/sidebar based on config
  const showHeader = !config.isIframe || !config.hideHeader;
  const showSidebar = !config.isIframe || !config.hideSidebar;

  // Adjust container classes for iframe mode
  const containerClass = config.isIframe 
    ? "h-full bg-background" 
    : "min-h-screen bg-background";
  
  const mainClass = config.isIframe
    ? "flex-1 overflow-auto p-4" // Reduced padding in iframe
    : "flex-1 overflow-auto p-6";

  const flexContainerHeight = showHeader 
    ? "h-[calc(100%-4rem)]" 
    : "h-full";

  return (
    <div className={containerClass}>
      {showHeader && <Header />}
      <div className={`flex ${flexContainerHeight}`}>
        {showSidebar && <Sidebar />}
        <main className={mainClass}>
          {children}
        </main>
      </div>
    </div>
  );
};
