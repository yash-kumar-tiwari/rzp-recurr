'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { useGetPlansQuery } from '@/store/api/plansApi';
import {
  useCreateSubscriptionMutation,
  useUpgradeSubscriptionMutation,
  useVerifyPaymentMutation,
  useVerifyUpgradePaymentMutation,
  useReSubscribeMutation,
  useGetUpgradePreviewQuery,
} from '@/store/api/subscriptionApi';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import PricingCard, { PricingCardSkeleton } from '@/components/plans/PricingCard';
import { openRazorpayCheckout } from '@/lib/razorpay';

function UpgradePlanCard({ plan, isPopular, isLoading, onSelect }) {
  const { data: preview, isLoading: previewLoading } = useGetUpgradePreviewQuery(plan.slug);

  const proration = preview
    ? {
        proratedCost: preview.amountToPay,
        remainingCredit: preview.remainingCredit,
        daysRemaining: preview.daysRemaining,
        totalDays: preview.totalDays,
        hasCredit: preview.remainingCredit > 0,
      }
    : null;

  return (
    <PricingCard
      plan={plan}
      isCurrentPlan={false}
      isPopular={isPopular}
      isLoading={isLoading || previewLoading}
      onSelect={onSelect}
      canSubscribe={false}
      canUpgrade={true}
      isDisabled={false}
      proration={proration}
    />
  );
}

export default function PlansPage() {
  const { user } = useAuth();
  const { data: plans = [], isLoading: plansLoading } = useGetPlansQuery();
  const { subscription, canUpgradeSub, currentPlan, hasLiveSub, canReSubscribe, isPending, isTerminalState } = useSubscription();

  const [createSubscription, { isLoading: isCreating }] = useCreateSubscriptionMutation();
  const [upgradeSubscription, { isLoading: isUpgrading }] = useUpgradeSubscriptionMutation();
  const [reSubscribe, { isLoading: isResubscribing }] = useReSubscribeMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [verifyUpgradePayment] = useVerifyUpgradePaymentMutation();

  const processingRef = useRef(false);

  const POPULAR_PLAN = 'pro';

  const getPlanRole = (plan) => {
    const currentIdx = plans.findIndex((p) => p.slug === currentPlan?.slug);
    const planIdx = plans.findIndex((p) => p.slug === plan.slug);

    if (canReSubscribe && isTerminalState) return 'resubscribe';
    if (!hasLiveSub && !isPending) return 'subscribe';
    if (canUpgradeSub && plan.slug === currentPlan?.slug) return 'current';
    if (canUpgradeSub && planIdx > currentIdx) return 'upgrade';
    if (canUpgradeSub && planIdx < currentIdx) return 'lower';
    if (isPending) return 'pending';
    return 'subscribe';
  };

  const handleNewSubscription = useCallback(async (plan) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const result = await createSubscription({ planSlug: plan.slug }).unwrap();
      const { razorpaySubscriptionId } = result.data;

      await openRazorpayCheckout({
        subscriptionId: razorpaySubscriptionId,
        userName: user?.name,
        userEmail: user?.email,
        planName: plan.name,
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id || razorpaySubscriptionId,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();
          } catch { }
          toast.success('Payment successful! Your subscription is now active.', {
            description: 'You can now upgrade anytime from the Plans page.',
            duration: 5000,
          });
        },
        onDismiss: () => {
          toast.info('Checkout closed. Your subscription is pending payment.');
        },
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to initiate subscription');
    } finally {
      processingRef.current = false;
    }
  }, [createSubscription, user, verifyPayment]);

  const handleUpgrade = useCallback(async (plan) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const result = await upgradeSubscription({ planSlug: plan.slug }).unwrap();
      const data = result.data;

      toast.info(
        `Upgrading to ${plan.name} — ₹${data.remainingCredit} credit from your previous plan applied.`,
        { duration: 6000 }
      );

      await openRazorpayCheckout({
        orderId: data.razorpayOrderId,
        amount: data.amountInPaise,
        userName: user?.name,
        userEmail: user?.email,
        planName: plan.name,
        onSuccess: async (response) => {
          try {
            await verifyUpgradePayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || data.razorpayOrderId,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();
            toast.success(`Upgraded to ${plan.name}!`, {
              description: 'Your new plan is now active.',
              duration: 5000,
            });
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        onDismiss: () => {
          toast.warning('Checkout closed — upgrade pending payment.');
        },
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Upgrade failed. Please try again.');
    } finally {
      processingRef.current = false;
    }
  }, [upgradeSubscription, user, verifyUpgradePayment]);

  const handleReSubscribe = useCallback(async (plan) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const result = await reSubscribe({ planSlug: plan.slug }).unwrap();
      const { razorpaySubscriptionId } = result.data;

      await openRazorpayCheckout({
        subscriptionId: razorpaySubscriptionId,
        userName: user?.name,
        userEmail: user?.email,
        planName: plan.name,
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id || razorpaySubscriptionId,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();
          } catch { }
          toast.success('Re-subscription successful!', {
            description: 'Welcome back.',
            duration: 5000,
          });
        },
        onDismiss: () => {
          toast.info('Checkout closed. Re-subscription pending payment.');
        },
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to re-subscribe');
    } finally {
      processingRef.current = false;
    }
  }, [reSubscribe, user, verifyPayment]);

  const handlePlanSelect = useCallback(async (plan) => {
    const role = getPlanRole(plan);
    if (role === 'upgrade') return handleUpgrade(plan);
    if (role === 'resubscribe') return handleReSubscribe(plan);
    if (role === 'subscribe') return handleNewSubscription(plan);
    if (role === 'current') { toast.info('You are already on this plan.'); return; }
    if (role === 'pending') { toast.warning('You have a pending subscription payment. Complete it from your dashboard.'); return; }
    if (role === 'lower') { toast.error('You can only upgrade to a higher plan, not downgrade.'); return; }
  }, [getPlanRole, handleUpgrade, handleReSubscribe, handleNewSubscription]);

  const renderCard = (plan) => {
    const role = getPlanRole(plan);
    const isPopular = plan.slug === POPULAR_PLAN;

    if (role === 'upgrade') {
      return (
        <UpgradePlanCard
          key={plan._id}
          plan={plan}
          isPopular={isPopular}
          isLoading={isUpgrading}
          onSelect={handlePlanSelect}
        />
      );
    }

    return (
      <PricingCard
        key={plan._id}
        plan={plan}
        isCurrentPlan={role === 'current'}
        isPopular={isPopular && (role === 'subscribe' || role === 'resubscribe')}
        isLoading={(isCreating || isUpgrading || isResubscribing) && role !== 'current'}
        onSelect={handlePlanSelect}
        canSubscribe={role === 'subscribe'}
        canUpgrade={false}
        canReSubscribe={role === 'resubscribe'}
        isDisabled={role === 'lower' || role === 'pending'}
        proration={null}
      />
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2"
        >
          <Sparkles className="w-4 h-4" />
          Simple, transparent pricing
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl font-bold tracking-tight"
        >
          Choose your{' '}
          <span className="gradient-text">perfect plan</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg max-w-xl mx-auto"
        >
          Start free, upgrade anytime. All plans include a 12-month subscription billed monthly.
        </motion.p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plansLoading
          ? [...Array(3)].map((_, i) => <PricingCardSkeleton key={i} />)
          : plans.map(renderCard)}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-muted-foreground"
      >
        Powered by{' '}
        <span className="font-medium text-foreground">Razorpay</span>
        {' '}· Secure payments · Cancel anytime
      </motion.p>
    </div>
  );
}
