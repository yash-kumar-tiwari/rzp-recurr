'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { History, ArrowLeft, ArrowRight, Tag, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, getStatusColor, formatPrice } from '@/lib/validators';

const formatAmount = (paise) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(paise / 100);
};

const PAYMENT_TYPE_LABELS = {
  new_subscription: 'New Subscription',
  upgrade: 'Upgrade',
  renewal: 'Renewal',
  retry: 'Retry',
};

const PAYMENT_TYPE_COLORS = {
  new_subscription: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  upgrade: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  renewal: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  retry: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

export function PaymentHistoryTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function PaymentHistoryTable({ payments = [], pagination = {}, onPageChange }) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">No payments yet</h3>
            <p className="text-muted-foreground text-sm">
              Your payment history will appear here after your first billing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span className="col-span-2">Transaction</span>
        <span>Type</span>
        <span>Amount</span>
        <span>Credit</span>
        <span>Status</span>
      </div>

      {payments.map((payment, i) => (
        <motion.div
          key={payment._id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 items-center p-4 rounded-xl border border-border/50 hover:border-border transition-colors bg-card"
        >
          <div className="col-span-1 md:col-span-2 flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {payment.paymentType === 'upgrade' ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <History className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-mono font-medium truncate">
                {payment.razorpayPaymentId}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(payment.paidAt)}</p>
            </div>
          </div>

          <div>
            <Badge
              className={`capitalize text-xs font-medium ${PAYMENT_TYPE_COLORS[payment.paymentType] || 'bg-slate-500/15 text-slate-500'}`}
              variant="secondary"
            >
              {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType || '—'}
            </Badge>
          </div>

          <div>
            <span className="text-sm font-semibold">
              {payment.payableAmount
                ? formatPrice(payment.payableAmount)
                : formatAmount(payment.amount)}
            </span>
            {payment.fullPlanAmount && payment.payableAmount && payment.fullPlanAmount !== payment.payableAmount && (
              <p className="text-xs text-muted-foreground">
                Full: {formatPrice(payment.fullPlanAmount)}
              </p>
            )}
          </div>

          <div>
            {payment.creditApplied > 0 ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {formatPrice(payment.creditApplied)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>

          <div>
            <Badge
              className={`capitalize text-xs font-medium ${getStatusColor(payment.status)}`}
              variant="secondary"
            >
              {payment.status === 'captured' ? 'Success' : payment.status}
            </Badge>
          </div>
        </motion.div>
      ))}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
