import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Wand2,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  Film,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/auth';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/create', icon: Wand2, label: 'Create Clip', highlight: true },
  { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/dashboard/jobs', icon: Activity, label: 'Jobs' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet & Access' },
];

const BOTTOM_NAV = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

function NavItem({
  href,
  icon: Icon,
  label,
  highlight,
  active,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary/10 text-primary border border-primary/20'
          : highlight
          ? 'text-primary/80 hover:text-primary hover:bg-primary/8'
          : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary' : '')} />
      <span>{label}</span>
      {highlight && !active && (
        <Badge className="ml-auto text-2xs px-1.5 py-0 bg-primary/15 text-primary border-primary/20 font-medium">
          New
        </Badge>
      )}
      {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/50" />}
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, accessStatus } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const tierLabel = accessStatus?.nftVerified
    ? 'NFT Premium'
    : accessStatus?.tier === 'pro'
    ? 'Pro'
    : 'Free';

  const sidebar = (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Film className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-semibold text-foreground tracking-tight">CineForge</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href)
            }
            onClick={() => setMobileOpen(false)}
          />
        ))}

        <div className="my-3 px-3">
          <Separator className="bg-sidebar-border" />
        </div>

        {BOTTOM_NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={location.pathname.startsWith(item.href)}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors group">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{tierLabel}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-shrink-0 flex-col">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-60 z-10">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-sm">CineForge</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
