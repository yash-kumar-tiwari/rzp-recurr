'use client';

import { useState } from 'react';
import { AlertTriangle, Calendar, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/validators';

export default function CancelModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  hasAccessUntil = false,
  accessUntilDate,
}) {
  const [cancelMode, setCancelMode] = useState('period_end');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg">Cancel your subscription?</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            Choose how you want to cancel. You won&apos;t be charged for future billing cycles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-1">
          <button
            type="button"
            onClick={() => setCancelMode('period_end')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              cancelMode === 'period_end'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                cancelMode === 'period_end' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {cancelMode === 'period_end' && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">Cancel at period end</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasAccessUntil && accessUntilDate
                    ? `Keep access until ${formatDate(accessUntilDate)}. No further charges.`
                    : 'Keep access until end of current billing cycle.'}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCancelMode('immediate')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              cancelMode === 'immediate'
                ? 'border-destructive bg-destructive/5'
                : 'border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                cancelMode === 'immediate' ? 'border-destructive' : 'border-muted-foreground'
              }`}>
                {cancelMode === 'immediate' && (
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">Cancel immediately</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Access lost immediately. No refund for remaining days.
                </p>
              </div>
            </div>
          </button>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(cancelMode === 'period_end' ? true : false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {cancelMode === 'period_end' ? 'Cancel at Period End' : 'Cancel Immediately'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
