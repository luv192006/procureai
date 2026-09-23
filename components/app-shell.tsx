'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const stored = localStorage.getItem('procureai-sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading ProcureAI...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6">
          {title && (
            <div className="mb-6 animate-fade-up">
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{title}</h1>
            </div>
          )}
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
