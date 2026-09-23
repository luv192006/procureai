'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">ProcureAI</p>
            <p className="text-xs text-muted-foreground">Predict. Optimize. Procure Smarter.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Check your email</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to <span className="font-medium text-foreground">{email}</span>
              </p>
              <Button onClick={() => router.push('/')} className="w-full" size="lg">
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-2xl font-bold">Forgot password?</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link
              </p>

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

                <Button type="submit" disabled={submitting} className="w-full" size="lg">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send reset link <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <button
                onClick={() => router.push('/')}
                className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
