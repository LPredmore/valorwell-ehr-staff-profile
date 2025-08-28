
import React from 'react';
import { cn } from '@/lib/utils';
import {
  Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  // Profile-only sidebar - no navigation needed
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border">
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          <div className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-sidebar-accent-foreground" />
            Profile Settings
          </div>
        </div>
      </nav>
    </div>
  );
};
