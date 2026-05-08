'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useGetPaymentHistoryQuery } from '@/store/api/paymentsApi';
import PaymentHistoryTable, {
  PaymentHistoryTableSkeleton,
} from '@/components/payments/PaymentHistoryTable';

export default function PaymentHistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPaymentHistoryQuery({ page, limit: 10 });

  const payments = data?.payments || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All your past billing transactions
            </p>
          </div>
        </motion.div>
      </div>

      {/* Table */}
      {isLoading ? (
        <PaymentHistoryTableSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={isFetching ? 'opacity-60 transition-opacity' : ''}
        >
          <PaymentHistoryTable
            payments={payments}
            pagination={pagination}
            onPageChange={setPage}
          />
        </motion.div>
      )}
    </div>
  );
}
