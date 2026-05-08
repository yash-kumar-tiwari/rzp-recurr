import { baseApi } from './baseApi';

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMySubscription: builder.query({
      query: () => '/subscriptions/me',
      providesTags: ['Subscription'],
      transformResponse: (response) => response.data?.subscription || null,
    }),

    getUpgradePreview: builder.query({
      query: (planSlug) => `/subscriptions/upgrade-preview?planSlug=${planSlug}`,
      providesTags: (result, error, planSlug) => [{ type: 'Subscription', id: `preview-${planSlug}` }],
      transformResponse: (response) => response.data || null,
    }),

    createSubscription: builder.mutation({
      query: (body) => ({
        url: '/subscriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    upgradeSubscription: builder.mutation({
      query: (body) => ({
        url: '/subscriptions/upgrade',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    verifyPayment: builder.mutation({
      query: (body) => ({
        url: '/subscriptions/verify-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    verifyUpgradePayment: builder.mutation({
      query: (body) => ({
        url: '/subscriptions/verify-upgrade-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    cancelSubscription: builder.mutation({
      query: (body) => ({
        url: '/subscriptions/cancel',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    reSubscribe: builder.mutation({
      query: (body) => ({
        url: '/subscriptions/resubscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetMySubscriptionQuery,
  useGetUpgradePreviewQuery,
  useCreateSubscriptionMutation,
  useUpgradeSubscriptionMutation,
  useVerifyPaymentMutation,
  useVerifyUpgradePaymentMutation,
  useCancelSubscriptionMutation,
  useReSubscribeMutation,
} = subscriptionApi;
