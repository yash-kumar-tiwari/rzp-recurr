import { useGetMySubscriptionQuery } from '@/store/api/subscriptionApi';

export const useSubscription = () => {
  const { data: subscription, isLoading, isError, refetch } = useGetMySubscriptionQuery();

  const status = subscription?.status;

  const isActive = status === 'active';
  const isAuthenticated = status === 'authenticated';
  const isPending = status === 'created' || isAuthenticated || status === 'pending';
  const isCancelled = status === 'cancelled';
  const isExpired = status === 'expired';
  const isCompleted = status === 'completed';
  const isHalted = status === 'halted';
  const isPaused = status === 'paused';
  const isFailed = status === 'failed';

  const isTerminalState = isCancelled || isExpired || isCompleted || isFailed;

  const canUpgradeSub = isActive || isAuthenticated;

  const canUpgrade = canUpgradeSub && subscription?.planId?.slug !== 'enterprise';

  const canCancel = canUpgradeSub || status === 'created' || status === 'pending';

  const canReSubscribe = isTerminalState || !subscription;

  const hasLiveSub = !isTerminalState && !!subscription;

  const isCancelAtPeriodEnd = subscription?.cancelAtPeriodEnd === true;
  const accessUntil = subscription?.expiresAt || subscription?.currentEnd;

  const isExpiringSoon =
    isActive &&
    subscription?.currentEnd &&
    new Date(subscription.currentEnd).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return {
    subscription,
    isLoading,
    isError,
    refetch,
    status,
    isActive,
    isAuthenticated,
    isPending,
    isCancelled,
    isExpired,
    isCompleted,
    isHalted,
    isPaused,
    isFailed,
    isTerminalState,
    canUpgrade,
    canUpgradeSub,
    canCancel,
    canReSubscribe,
    hasLiveSub,
    isCancelAtPeriodEnd,
    accessUntil,
    isExpiringSoon,
    currentPlan: subscription?.planId,
  };
};
