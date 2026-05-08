'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Building2, Loader2, TrendingUp, Tag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/validators';
import { cn } from '@/lib/utils';

const PLAN_ICONS = {
  basic: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
};

const PLAN_GRADIENT = {
  basic: 'from-blue-500/10 to-cyan-500/5',
  pro: 'from-primary/15 to-purple-500/10',
  enterprise: 'from-amber-500/10 to-orange-500/5',
};

const PLAN_ACCENT = {
  basic: 'text-blue-500',
  pro: 'text-primary',
  enterprise: 'text-amber-500',
};

export function PricingCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="w-10 h-10 rounded-xl mb-3" />
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-12 w-full rounded-lg" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function PricingCard({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  isLoading = false,
  onSelect,
  canSubscribe = false,
  canUpgrade = false,
  canReSubscribe = false,
  isDisabled = false,
  proration = null,
}) {
  const slug = plan.slug;
  const isUpgradeCard = canUpgrade;
  const isHighlighted = isCurrentPlan || (!isUpgradeCard && (isPopular || canReSubscribe));

  const getButtonLabel = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (canReSubscribe) return `Subscribe Again · ${formatPrice(plan.price)}/mo`;
    if (canUpgrade) {
      if (proration?.hasCredit) {
        return `Upgrade · Pay ${formatPrice(proration.proratedCost)} now`;
      }
      return `Upgrade to ${plan.name}`;
    }
    if (canSubscribe) return `Get ${plan.name}`;
    return 'Subscribe';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('h-full', isHighlighted && 'scale-[1.02] md:scale-105')}
    >
      <Card
        className={cn(
          'h-full flex flex-col relative overflow-hidden transition-shadow',
          isHighlighted && 'border-primary/50 shadow-xl shadow-primary/10',
          isUpgradeCard && !isHighlighted && 'border-emerald-500/40 shadow-lg shadow-emerald-500/10',
          canReSubscribe && !isCurrentPlan && 'border-violet-500/40 shadow-lg shadow-violet-500/10',
          !isHighlighted && !isUpgradeCard && !canReSubscribe && 'hover:shadow-lg hover:border-border'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 opacity-50 bg-gradient-to-br pointer-events-none',
            PLAN_GRADIENT[slug]
          )}
        />
        <div className="absolute top-4 right-4">
          {isCurrentPlan && (
            <Badge variant="outline" className="text-xs border-primary text-primary">
              Current Plan
            </Badge>
          )}
          {isUpgradeCard && (
            <Badge className="bg-emerald-500 text-white text-xs gap-1">
              <TrendingUp className="w-3 h-3" />
              Upgrade
            </Badge>
          )}
          {canReSubscribe && (
            <Badge className="bg-violet-500 text-white text-xs gap-1">
              <RefreshCw className="w-3 h-3" />
              Subscribe Again
            </Badge>
          )}
          {!isCurrentPlan && !isUpgradeCard && !canReSubscribe && isPopular && (
            <Badge className="bg-primary text-primary-foreground text-xs">Most Popular</Badge>
          )}
        </div>

        <CardHeader className="pb-4 relative">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center mb-3',
              `bg-gradient-to-br ${PLAN_GRADIENT[slug]} border border-border/50`,
              PLAN_ACCENT[slug]
            )}
          >
            {PLAN_ICONS[slug]}
          </div>
          <h3 className="font-bold text-xl">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 relative">
          <div className="space-y-2">
            <div className="flex items-end gap-1">
              <span
                className={cn(
                  'text-4xl font-bold',
                  PLAN_ACCENT[slug],
                  canUpgrade && proration?.hasCredit && 'text-2xl line-through opacity-40'
                )}
              >
                {formatPrice(plan.price)}
              </span>
              <span
                className={cn(
                  'text-muted-foreground text-sm mb-1',
                  canUpgrade && proration?.hasCredit && 'opacity-40'
                )}
              >
                /month
              </span>
            </div>

            {canUpgrade && proration?.hasCredit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pay today</span>
                  <span className={cn('text-xl font-bold', PLAN_ACCENT[slug])}>
                    {formatPrice(proration.proratedCost)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Tag className="w-3 h-3 shrink-0" />
                  <span>
                    {formatPrice(proration.remainingCredit)} credit applied ({proration.daysRemaining} of{' '}
                    {proration.totalDays} days remaining)
                  </span>
                </div>
                <div className="pt-0.5 text-xs text-muted-foreground">
                  Then {formatPrice(plan.price)}/month from next cycle
                </div>
              </motion.div>
            )}

            {canUpgrade && proration && !proration.hasCredit && (
              <p className="text-xs text-muted-foreground">
                Full {formatPrice(plan.price)} charged (no billing cycle started yet)
              </p>
            )}
          </div>

          <div className="h-px bg-border/60" />

          <ul className="space-y-2.5">
            {plan.features?.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check
                  className={cn('w-4 h-4 mt-0.5 shrink-0', PLAN_ACCENT[slug])}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="relative pt-4">
          <Button
            id={`plan-select-${slug}-btn`}
            className={cn(
              'w-full',
              isCurrentPlan && 'opacity-60 cursor-not-allowed',
              isUpgradeCard && 'bg-emerald-600 hover:bg-emerald-700 text-white border-0',
              canReSubscribe && 'bg-violet-600 hover:bg-violet-700 text-white border-0'
            )}
            variant={isHighlighted ? 'default' : 'outline'}
            onClick={() => !isCurrentPlan && !isDisabled && onSelect(plan)}
            disabled={isCurrentPlan || isDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              getButtonLabel()
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
