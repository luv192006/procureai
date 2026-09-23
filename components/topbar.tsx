'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  ShieldAlert,
  FileText,
  TrendingUp,
  Package,
  Sparkles,
  Users,
  Scale,
  Check,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { suppliers, rfqs, quotations, inventory, recommendations } from '@/lib/data';
import { notifications as defaultNotifications } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface SearchResult {
  type: 'Supplier' | 'RFQ' | 'Quotation' | 'Inventory' | 'Recommendation';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  suppliers.forEach((s) => {
    if (s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) {
      results.push({
        type: 'Supplier',
        title: s.name,
        subtitle: `${s.category} • ${s.location}`,
        href: '/suppliers',
        icon: Users,
      });
    }
  });

  rfqs.forEach((r) => {
    if (r.id.toLowerCase().includes(q) || r.product.toLowerCase().includes(q)) {
      results.push({
        type: 'RFQ',
        title: r.id,
        subtitle: r.product,
        href: '/rfqs',
        icon: FileText,
      });
    }
  });

  quotations.forEach((qt) => {
    if (qt.supplierName.toLowerCase().includes(q) || qt.id.toLowerCase().includes(q)) {
      results.push({
        type: 'Quotation',
        title: qt.supplierName,
        subtitle: `${qt.id} • ₹${qt.price}`,
        href: '/quotations',
        icon: Scale,
      });
    }
  });

  inventory.forEach((i) => {
    if (i.product.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)) {
      results.push({
        type: 'Inventory',
        title: i.product,
        subtitle: `${i.sku} • ${i.currentStock} ${i.unit}`,
        href: '/inventory',
        icon: Package,
      });
    }
  });

  recommendations.forEach((r) => {
    if (r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) {
      results.push({
        type: 'Recommendation',
        title: r.title,
        subtitle: r.category,
        href: '/recommendations',
        icon: Sparkles,
      });
    }
  });

  return results.slice(0, 8);
}

const notifIcons = {
  risk: ShieldAlert,
  quotation: FileText,
  price: TrendingUp,
  inventory: Package,
  savings: Sparkles,
  rfq: FileText,
};

const notifColors = {
  risk: 'text-destructive',
  quotation: 'text-primary',
  price: 'text-warning',
  inventory: 'text-chart-2',
  savings: 'text-chart-1',
  rfq: 'text-info',
};

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>(defaultNotifications);
  const searchRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem('procureai-notifications-v2');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(defaultNotifications);
      }
    } catch {
      setNotifications(defaultNotifications);
    }
  };

  useEffect(() => {
    loadNotifications();
    const handleNotifEvent = () => loadNotifications();
    window.addEventListener('procureai-notification', handleNotifEvent);
    return () => window.removeEventListener('procureai-notification', handleNotifEvent);
  }, []);

  useEffect(() => {
    setSearchResults(searchAll(searchQuery));
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleResultClick = (href: string) => {
    setShowSearch(false);
    setSearchQuery('');
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/40 backdrop-blur-xl px-4 lg:px-6">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            placeholder="Search suppliers, RFQs, inventory..."
            className="h-10 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
        {showSearch && searchQuery && (
          <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-border bg-popover/95 shadow-2xl backdrop-blur-xl animate-scale-in">
            {searchResults.length > 0 ? (
              <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
                {searchResults.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleResultClick(r.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {r.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.map((n) => {
                const Icon = notifIcons[n.type as keyof typeof notifIcons] || FileText;
                const color = notifColors[n.type as keyof typeof notifColors] || 'text-primary';
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-secondary/30',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.description}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{n.time}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-secondary/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-foreground">{user?.name}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{user?.role}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <UserIcon className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); router.push('/'); }} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
