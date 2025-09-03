import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Info,
  FileText,
  Shield,
  LogOut,
  Mail,
  Bookmark as BookmarkIcon
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const mainNavItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'About Us', url: '/about', icon: Info },
];

const legalNavItems = [
  { title: 'Terms & Conditions', url: '/terms', icon: FileText },
  { title: 'Privacy Policy', url: '/privacy', icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully.",
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const collapsed = state === 'collapsed';

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/8a59dbbc-df78-4864-8163-6aaf2c63c051.png" 
            alt="Bookmark" 
            className="h-8 w-8 rounded-md"
          />
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">Bookmark</h1>
              <p className="text-xs text-sidebar-foreground/60">Organize your materials</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Legal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {legalNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          {!collapsed && (
            <>
              <Button
                variant="ghost"
                onClick={() => window.location.href = 'mailto:shivarana6877@gmail.com'}
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Mail className="h-4 w-4" />
                Contact Us
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
          
          {collapsed && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = 'mailto:shivarana6877@gmail.com'}
                className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
                title="Contact Us"
              >
                <Mail className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}