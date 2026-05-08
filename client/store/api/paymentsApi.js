import { baseApi } from './baseApi';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentHistory: builder.query({
      query: ({ page = 1, limit = 10 } = {}) =>
        `/payments/history?page=${page}&limit=${limit}`,
      providesTags: ['Payments'],
      transformResponse: (response) => response.data || { payments: [], pagination: {} },
    }),
  }),
});

export const { useGetPaymentHistoryQuery } = paymentsApi;
