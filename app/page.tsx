'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, ArrowRight, Sparkles, TrendingUp, ShieldAlert, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginDemo, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: 'Welcome back!', description: 'Successfully logged in.' });
      router.push('/dashboard');
    } catch {
      toast({ title: 'Login failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    toast({ title: 'Demo mode activated', description: 'Explore ProcureAI with sample data.' });
    router.push('/dashboard');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-chart-4/10 blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Branding */}
        <div className="hidden flex-col justify-between lg:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">ProcureAI</p>
                <p className="text-xs text-muted-foreground">Predict. Optimize. Procure Smarter.</p>
              </div>
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight">
              AI-Powered <span className="text-gradient">Procurement</span>
              <br />
              Decision Intelligence
            </h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Transform your procurement with AI-driven supplier risk analysis, price forecasting, and intelligent
              quotation evaluation.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Sparkles, title: 'AI Recommendations', desc: 'Identify $184K in savings opportunities' },
              { icon: ShieldAlert, title: 'Supplier Risk Analysis', desc: 'Real-time risk scoring & mitigation' },
              { icon: TrendingUp, title: 'Price Forecasting', desc: '30-day material price predictions' },
              { icon: BarChart3, title: 'Spend Analytics', desc: 'Deep procurement spend insights' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-center gap-3 rounded-xl border border-border bg-card/30 p-3 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Login form */}
        <div className="flex items-center">
          <div className="w-full rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold">ProcureAI</p>
                <p className="text-[10px] text-muted-foreground">Predict. Optimize. Procure Smarter.</p>
              </div>
            </div>

            <h2 className="mb-1 text-2xl font-bold">Welcome back</h2>
            <p className="mb-6 text-sm text-muted-foreground">Sign in to your procurement intelligence dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.morgan@procureai.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button onClick={handleDemo} variant="outline" className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Continue with Demo Account
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button onClick={() => router.push('/signup')} className="font-medium text-primary hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
