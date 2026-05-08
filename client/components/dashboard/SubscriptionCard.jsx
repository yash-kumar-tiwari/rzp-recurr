'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Crown,
  TrendingUp,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  PauseCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import { formatDate, formatPrice, getStatusColor } from '@/lib/validators';
import Link from 'next/link';

function StatusIcon({ status }) {
  const icons = {
    active: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    created: <Clock className="w-4 h-4 text-blue-500" />,
    authenticated: <Clock className="w-4 h-4 text-blue-500" />,
    cancelled: <XCircle className="w-4 h-4 text-red-500" />,
    halted: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    paused: <PauseCircle className="w-4 h-4 text-yellow-500" />,
    expired: <Ban className="w-4 h-4 text-slate-500" />,
    completed: <CheckCircle2 className="w-4 h-4 text-slate-500" />,
    pending: <Clock className="w-4 h-4 text-orange-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
  };
  return icons[status] || <Info className="w-4 h-4 text-muted-foreground" />;
}

export function SubscriptionCardSkeleton() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionCard({
  subscription,
  onUpgrade,
  onCancel,
  onResubscribe,
  isUpgrading,
  isCancelling,
  canUpgrade,
  canCancel,
  canReSubscribe,
  isCancelAtPeriodEnd,
  accessUntil,
}) {
  if (!subscription) {
    return (
      <Card className="col-span-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">No active subscription</h3>
            <p className="text-muted-foreground text-sm">
              Choose a plan to unlock all features
            </p>
          </div>
          <Button asChild>
            <Link href="/plans">Browse Plans</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (canReSubscribe) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full"
      >
        <Card className="overflow-hidden border-dashed">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400" />
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {subscription.status === 'expired' ? 'Subscription Expired' : 'Subscription Ended'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {subscription.status === 'expired'
                  ? 'Your subscription has expired. Subscribe again to continue.'
                  : 'Your previous plan is no longer active. Subscribe again anytime.'}
              </p>
              {subscription.planId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last plan: {subscription.planId.name} ({formatPrice(subscription.planId.price)}/mo)
                </p>
              )}
            </div>
            <Button onClick={onResubscribe} className="gap-2 bg-violet-600 hover:bg-violet-700">
              <RotateCcw className="w-4 h-4" />
              Subscribe Again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const plan = subscription.planId;
  const statusColor = getStatusColor(subscription.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-full"
    >
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-indigo-400" />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                {plan?.name || 'Unknown'} Plan
              </CardTitle>
            </div>
            <Badge className={`capitalize px-3 py-1 text-xs font-medium ${statusColor}`}>
              <StatusIcon status={subscription.status} />
              <span className="ml-1.5">
                {subscription.status}
                {isCancelAtPeriodEnd ? ' (ends ' + formatDate(accessUntil) + ')' : ''}
              </span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Monthly Price
              </p>
              <p className="text-2xl font-bold">
                {formatPrice(plan?.price || 0)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </div>

            {subscription.currentEnd && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {isCancelAtPeriodEnd ? 'Access Until' : 'Renews On'}
                </p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">{formatDate(subscription.currentEnd)}</p>
                </div>
              </div>
            )}

            {subscription.paidCount !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Billing Cycles
                </p>
                <p className="text-sm font-semibold">
                  {subscription.paidCount} / {subscription.totalCount}
                </p>
              </div>
            )}
          </div>

          {subscription.previousPlanName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              <span>
                Upgraded from {subscription.previousPlanName}
                {subscription.upgradeHistory?.length > 0 &&
                  ` — ${formatPrice(subscription.upgradeHistory[subscription.upgradeHistory.length - 1].amountPaid)} paid`}
              </span>
            </div>
          )}

          {plan?.features?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Included
              </p>
              <div className="flex flex-wrap gap-2">
                {plan.features.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
                {plan.features.length > 4 && (
                  <span className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                    +{plan.features.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {canUpgrade && (
              <Button
                id="upgrade-plan-btn"
                onClick={onUpgrade}
                disabled={isUpgrading}
                className="gap-2"
              >
                {isUpgrading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                Upgrade Plan
              </Button>
            )}

            {canCancel && (
              <Button
                id="cancel-subscription-btn"
                variant="outline"
                onClick={onCancel}
                disabled={isCancelling}
                className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              >
                <XCircle className="w-4 h-4" />
                Cancel Subscription
              </Button>
            )}

            {subscription.status === 'created' && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4" />
                Awaiting payment completion via Razorpay
              </p>
            )}

            {subscription.status === 'halted' && (
              <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-4 h-4" />
                Payment failed. Please update your payment method.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
