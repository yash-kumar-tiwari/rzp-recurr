import { baseApi } from './baseApi';

export const plansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query({
      query: () => '/plans',
      providesTags: ['Plans'],
      // Transform to extract plans array
      transformResponse: (response) => response.data?.plans || [],
    }),
  }),
});

export const { useGetPlansQuery } = plansApi;
