const razorpay = require('../configs/razorpay');

const createSubscription = async ({ razorpayPlanId, totalCount = 12, customerName, customerEmail }) => {
  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: 1,
    notes: {
      customer_name: customerName,
      customer_email: customerEmail,
    },
  });
  return subscription;
};

const cancelSubscription = async (razorpaySubscriptionId, cancelAtCycleEnd = false) => {
  const result = await razorpay.subscriptions.cancel(razorpaySubscriptionId, {
    cancel_at_cycle_end: cancelAtCycleEnd,
  });
  return result;
};

const fetchSubscription = async (razorpaySubscriptionId) => {
  return razorpay.subscriptions.fetch(razorpaySubscriptionId);
};

const createOrder = async ({ amountInPaise, currency = 'INR', receipt, notes = {} }) => {
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
  return order;
};

const fetchOrder = async (orderId) => {
  return razorpay.orders.fetch(orderId);
};

const fetchPayment = async (paymentId) => {
  return razorpay.payments.fetch(paymentId);
};

module.exports = {
  createSubscription,
  cancelSubscription,
  fetchSubscription,
  createOrder,
  fetchOrder,
  fetchPayment,
};
