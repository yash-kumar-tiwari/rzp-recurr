const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = async ({
  subscriptionId,
  orderId,
  amount,
  userName,
  userEmail,
  planName,
  onSuccess,
  onDismiss,
}) => {
  await loadRazorpayScript();

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    name: 'SubscriptionHub',
    description: `${planName} Plan Subscription`,
    image: '/logo.png',
    handler: (response) => {
      if (onSuccess) onSuccess(response);
    },
    prefill: {
      name: userName,
      email: userEmail,
    },
    theme: {
      color: '#6366f1',
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
    },
  };

  if (orderId && amount) {
    options.order_id = orderId;
    options.amount = amount;
  } else if (subscriptionId) {
    options.subscription_id = subscriptionId;
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
};
