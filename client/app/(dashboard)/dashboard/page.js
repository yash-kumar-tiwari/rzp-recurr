'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar, Crown, DollarSign, Shield, Clock, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import {
  useCancelSubscriptionMutation,
} from '@/store/api/subscriptionApi';
import SubscriptionCard, { SubscriptionCardSkeleton } from '@/components/dashboard/SubscriptionCard';
import StatsRow, { StatsRowSkeleton } from '@/components/dashboard/StatsRow';
import CancelModal from '@/components/dashboard/CancelModal';
import { formatDate, formatPrice, getStatusColor } from '@/lib/validators';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    subscription,
    isLoading,
    isActive,
    isPending,
    isCancelled,
    isExpired,
    isCompleted,
    isTerminalState,
    canUpgrade,
    canCancel,
    canReSubscribe,
    currentPlan,
    isCancelAtPeriodEnd,
    accessUntil,
    isExpiringSoon,
    status,
    refetch,
  } = useSubscription();

  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);

  const statusDisplay = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : '—';

  const statusSub = isActive
    ? 'Subscription active'
    : isPending
    ? 'Awaiting payment'
    : isCancelled
    ? isCancelAtPeriodEnd ? `Access until ${formatDate(accessUntil)}` : 'Cancelled'
    : isExpired
    ? 'Subscription expired'
    : isCompleted
    ? 'All cycles completed'
    : isTerminalState
    ? 'Not active'
    : 'Not subscribed';

  const stats = [
    {
      icon: <Crown className="w-5 h-5" />,
      label: 'Current Plan',
      value: currentPlan?.name || (canReSubscribe ? 'No Plan' : 'None'),
      sub: currentPlan ? `${formatPrice(currentPlan.price)}/month` : (canReSubscribe ? 'Subscribe again' : 'No active plan'),
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Status',
      value: statusDisplay,
      sub: statusSub,
    },
    {
      icon: isExpiringSoon ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <Calendar className="w-5 h-5" />,
      label: isCancelled ? 'Access Until' : 'Renewal Date',
      value: accessUntil ? formatDate(accessUntil) : '—',
      sub: isCancelAtPeriodEnd
        ? 'Cancels at period end'
        : isActive
        ? subscription?.chargeAt ? `Next charge ${formatDate(subscription.chargeAt)}` : ''
        : '',
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Billing Cycles',
      value: subscription
        ? `${subscription.paidCount || 0}/${subscription.totalCount || 12}`
        : '0/12',
      sub: subscription?.remainingCount != null
        ? `${subscription.remainingCount} remaining`
        : '',
    },
  ];

  const handleCancel = useCallback(async (cancelAtPeriodEnd) => {
    try {
      const body = cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd } : {};
      await cancelSubscription(body).unwrap();
      if (cancelAtPeriodEnd !== false) {
        toast.success('Subscription will cancel at the end of your billing period.', {
          description: `You have access until ${formatDate(accessUntil)}`,
          duration: 6000,
        });
      } else {
        toast.success('Subscription cancelled immediately.');
      }
      setShowCancelModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel subscription');
    }
  }, [cancelSubscription, accessUntil]);

  const handleResubscribe = useCallback(() => {
    router.push('/plans');
  }, [router]);

  return (
    <div className="space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Welcome back, {user?.name?.split(' ')[0]}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          Here&apos;s an overview of your subscription
        </motion.p>
      </div>

      {isExpiringSoon && isActive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-400 text-sm"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Your subscription renews on {formatDate(accessUntil)}. Make sure your payment method is active.</span>
        </motion.div>
      )}

      {isCancelAtPeriodEnd && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/8 text-blue-700 dark:text-blue-400 text-sm"
        >
          <Info className="w-5 h-5 shrink-0" />
          <span>Your subscription is set to cancel on {formatDate(accessUntil)}. You still have access until then.</span>
        </motion.div>
      )}

      {isLoading ? (
        <StatsRowSkeleton />
      ) : (
        <StatsRow stats={stats} />
      )}

      {isLoading ? (
        <SubscriptionCardSkeleton />
      ) : (
        <SubscriptionCard
          subscription={subscription}
          canUpgrade={canUpgrade}
          canCancel={canCancel}
          canReSubscribe={canReSubscribe}
          isCancelAtPeriodEnd={isCancelAtPeriodEnd}
          accessUntil={accessUntil}
          isCancelling={isCancelling}
          onUpgrade={() => router.push('/plans')}
          onCancel={() => setShowCancelModal(true)}
          onResubscribe={handleResubscribe}
        />
      )}

      <CancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        hasAccessUntil={!!subscription?.currentEnd}
        accessUntilDate={subscription?.currentEnd}
      />
    </div>
  );
}
