'use client';

import { useEffect, useState } from 'react';
import { Brain, Check } from 'lucide-react';
import { aiAnalysisSteps } from '@/lib/ai';
import { cn } from '@/lib/utils';

export function AIProcessingOverlay({
  steps = aiAnalysisSteps,
  onComplete,
  duration = 2500,
  title = 'AI Analysis',
}: {
  steps?: string[];
  onComplete?: () => void;
  duration?: number;
  title?: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const stepDuration = duration / steps.length;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          setCompletedSteps((c) => [...c, prev]);
          return prev + 1;
        } else {
          setCompletedSteps((c) => [...c, prev]);
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 400);
          return prev;
        }
      });
    }, stepDuration);
    return () => clearInterval(interval);
  }, [steps.length, duration, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
              <Brain className="h-8 w-8 animate-pulse text-primary-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Processing procurement intelligence...</p>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isCurrent = i === currentStep && !isCompleted;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300',
                  isCompleted
                    ? 'border-success/30 bg-success/5'
                    : isCurrent
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-secondary/20 opacity-50'
                )}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {isCompleted ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                      <Check className="h-3.5 w-3.5 text-success" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    isCompleted ? 'text-foreground' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
            style={{ width: `${((completedSteps.length + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
