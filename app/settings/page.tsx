'use client';

import { useState } from 'react';
import { User, Bell, Shield, Palette, Building2, Mail, Phone, Globe, Save, LogOut, Moon, Sun, Check } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

type Tab = 'profile' | 'notifications' | 'security' | 'preferences' | 'company';

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'company', label: 'Company', icon: Building2 },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState({
    name: user?.name || 'Alex Morgan',
    email: user?.email || 'alex.morgan@procureai.com',
    phone: '+1 (555) 123-4567',
    role: 'Head of Procurement',
    department: 'Supply Chain',
  });
  const [notifications, setNotifications] = useState({
    riskAlerts: true,
    priceAlerts: true,
    quotationUpdates: true,
    inventoryAlerts: true,
    weeklyReport: true,
    aiRecommendations: true,
  });
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'YYYY-MM-DD',
    theme: 'dark',
    autoRefresh: true,
    compactView: false,
  });
  const [company, setCompany] = useState({
    name: 'Manufacturing Corp India',
    industry: 'Industrial Manufacturing',
    employees: '5000+',
    annualSpend: '$12.4M',
    website: 'www.manufacturingcorp.com',
    location: 'Mumbai, India',
  });

  const handleSave = (section: string) => {
    toast({ title: 'Settings saved', description: `Your ${section} settings have been updated.` });
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
          {/* Sidebar Tabs */}
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={handleSignOut}
              className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Content */}
          <div>
            {/* Profile */}
            {activeTab === 'profile' && (
              <Card className="border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
                <h2 className="mb-1 text-lg font-semibold">Profile Information</h2>
                <p className="mb-6 text-sm text-muted-foreground">Update your personal information and contact details.</p>

                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profile.role} • {profile.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                  </div>
                </div>

                <Button className="mt-6" onClick={() => handleSave('profile')}>
                  <Save className="mr-1.5 h-4 w-4" /> Save Changes
                </Button>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <Card className="border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
                <h2 className="mb-1 text-lg font-semibold">Notification Preferences</h2>
                <p className="mb-6 text-sm text-muted-foreground">Choose what alerts you want to receive.</p>

                <div className="space-y-1">
                  {[
                    { key: 'riskAlerts', label: 'Supplier Risk Alerts', desc: 'Get notified when supplier risk scores change' },
                    { key: 'priceAlerts', label: 'Price Forecast Alerts', desc: 'Notifications for predicted price changes' },
                    { key: 'quotationUpdates', label: 'Quotation Updates', desc: 'Alerts when new quotations are received' },
                    { key: 'inventoryAlerts', label: 'Inventory Alerts', desc: 'Critical stock and reorder notifications' },
                    { key: 'weeklyReport', label: 'Weekly Report Email', desc: 'Receive a weekly procurement summary' },
                    { key: 'aiRecommendations', label: 'AI Recommendations', desc: 'Get notified about new AI suggestions' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                      />
                    </div>
                  ))}
                </div>

                <Button className="mt-6" onClick={() => handleSave('notification')}>
                  <Save className="mr-1.5 h-4 w-4" /> Save Preferences
                </Button>
              </Card>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <Card className="border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
                <h2 className="mb-1 text-lg font-semibold">Security Settings</h2>
                <p className="mb-6 text-sm text-muted-foreground">Manage your password and account security.</p>

                <div className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="Re-enter new password" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4">
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4">
                    <div>
                      <p className="text-sm font-medium">Session Timeout</p>
                      <p className="text-xs text-muted-foreground">Automatically log out after 30 minutes of inactivity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button className="mt-6" onClick={() => handleSave('security')}>
                  <Shield className="mr-1.5 h-4 w-4" /> Update Security
                </Button>
              </Card>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <Card className="border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
                <h2 className="mb-1 text-lg font-semibold">Display Preferences</h2>
                <p className="mb-6 text-sm text-muted-foreground">Customize how ProcureAI looks and behaves.</p>

                <div className="space-y-4">
                  <div>
                    <Label>Currency</Label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                      className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Date Format</Label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4">
                    <div>
                      <p className="text-sm font-medium">Auto-Refresh Dashboard</p>
                      <p className="text-xs text-muted-foreground">Update data every 30 seconds</p>
                    </div>
                    <Switch
                      checked={preferences.autoRefresh}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, autoRefresh: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4">
                    <div>
                      <p className="text-sm font-medium">Compact View</p>
                      <p className="text-xs text-muted-foreground">Show more data in tables with smaller rows</p>
                    </div>
                    <Switch
                      checked={preferences.compactView}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, compactView: checked })}
                    />
                  </div>
                </div>

                <Button className="mt-6" onClick={() => handleSave('display')}>
                  <Save className="mr-1.5 h-4 w-4" /> Save Preferences
                </Button>
              </Card>
            )}

            {/* Company */}
            {activeTab === 'company' && (
              <Card className="border-border bg-card/40 p-6 backdrop-blur-sm animate-fade-up">
                <h2 className="mb-1 text-lg font-semibold">Company Information</h2>
                <p className="mb-6 text-sm text-muted-foreground">Your organization details used in reports and analytics.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Company Name</Label>
                    <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} />
                  </div>
                  <div>
                    <Label>Employees</Label>
                    <Input value={company.employees} onChange={(e) => setCompany({ ...company, employees: e.target.value })} />
                  </div>
                  <div>
                    <Label>Annual Procurement Spend</Label>
                    <Input value={company.annualSpend} onChange={(e) => setCompany({ ...company, annualSpend: e.target.value })} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={company.location} onChange={(e) => setCompany({ ...company, location: e.target.value })} />
                  </div>
                </div>

                <Button className="mt-6" onClick={() => handleSave('company')}>
                  <Save className="mr-1.5 h-4 w-4" /> Save Company Info
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
