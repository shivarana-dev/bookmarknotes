import React from 'react';
import { Menu, Mail, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleContactUs = () => {
    window.location.href = 'mailto:shivarana6877@gmail.com';
  };

  const showAuthDialog = () => {
    window.location.reload();
  };

  return (
    <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/8a59dbbc-df78-4864-8163-6aaf2c63c051.png" 
          alt="Bookmark" 
          className="h-7 w-7 rounded-md"
        />
        <h1 className="text-base font-semibold">Bookmark</h1>
      </div>
      
      <div className="flex items-center gap-1">
        {!user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={showAuthDialog}
            className="h-8 w-8"
            title="Sign In"
          >
            <LogIn className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleContactUs}
          className="h-8 w-8"
          title="Contact Us"
        >
          <Mail className="h-4 w-4" />
        </Button>
        
        <ThemeToggle />
        
        <SidebarTrigger className="p-2 hover:bg-accent hover:text-accent-foreground">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
      </div>
    </header>
  );
}