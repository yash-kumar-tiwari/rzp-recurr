import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name too long'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const formatCurrency = (amountInPaise, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amountInPaise / 100);
};

export const formatPrice = (rupees, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(rupees);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const calculateProration = (subscription, currentPrice, newPrice) => {
  const now = new Date();
  const cycleStart = subscription?.currentStart ? new Date(subscription.currentStart) : null;
  const cycleEnd = subscription?.currentEnd ? new Date(subscription.currentEnd) : null;

  if (!cycleStart || !cycleEnd || cycleEnd <= now) {
    return {
      proratedCost: newPrice,
      remainingCredit: 0,
      daysRemaining: 0,
      totalDays: 30,
      hasCredit: false,
    };
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, (cycleEnd - cycleStart) / MS_PER_DAY);
  const daysRemaining = Math.max(0, (cycleEnd - now) / MS_PER_DAY);

  const remainingCredit = Math.round((daysRemaining / totalDays) * currentPrice);
  const proratedCost = Math.max(0, newPrice - remainingCredit);

  return {
    proratedCost,
    remainingCredit,
    daysRemaining: Math.ceil(daysRemaining),
    totalDays: Math.round(totalDays),
    hasCredit: remainingCredit > 0,
  };
};

export const getStatusColor = (status) => {
  const map = {
    active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    created: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    authenticated: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
    completed: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    halted: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    paused: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    expired: 'bg-slate-500/15 text-slate-500',
    pending: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
    captured: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    refunded: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  };
  return map[status] || 'bg-slate-500/15 text-slate-500';
};

export const PAYMENT_TYPE_LABELS = {
  new_subscription: 'New Subscription',
  upgrade: 'Upgrade',
  renewal: 'Renewal',
  retry: 'Retry',
};
