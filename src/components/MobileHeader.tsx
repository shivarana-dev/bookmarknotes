import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center gap-3">
        <img 
          src="/lovable-uploads/8a59dbbc-df78-4864-8163-6aaf2c63c051.png" 
          alt="Bookmark" 
          className="h-8 w-8 rounded-md"
        />
        <h1 className="text-lg font-semibold">Bookmark</h1>
      </div>
      
      <SidebarTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SidebarTrigger>
    </header>
  );
}