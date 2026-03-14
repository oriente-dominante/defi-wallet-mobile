import { baseApi } from './baseApi';
import { Portfolio } from '../../types/portfolio';

export interface PortfolioRequest {
  address: string;
  network: 'solana' | 'ethereum';
}

export interface TokenBalanceRequest {
  address: string;
  token: string;
  network: 'solana' | 'ethereum';
}

export interface TokenBalance {
  balance: string;
  usdValue: number;
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoUri?: string;
  };
}

const mockPortfolio: Portfolio = {
  totalValue: 15420.5,
  totalChange24h: 340.25,
  totalChangePercent24h: 2.26,
  tokens: [
    {
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      balance: '12.5456',
      usdValue: 2180.5,
      price: 173.8,
      change24h: 5.2,
    },
    {
      address: '0xA0b86a33E6441b8b03dB53C5B8c1A7F8be3d7A8F',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      balance: '5.2341',
      usdValue: 12840.25,
      price: 2452.3,
      change24h: -2.1,
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: '399.75',
      usdValue: 399.75,
      price: 1.0,
      change24h: 0.0,
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// Real portfolio API integration with mock fallback
export const portfolioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPortfolio: builder.query<Portfolio, PortfolioRequest>({
      queryFn: async ({ address, network }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `/portfolio/${address}`,
          params: { network },
        });
        if (result.error) {
          // Fallback to mock data when backend is unavailable
          return { data: mockPortfolio };
        }
        return { data: result.data as Portfolio };
      },
      providesTags: (_result, _error, { address }) => [
        { type: 'Portfolio', id: address },
      ],
      keepUnusedDataFor: 300,
    }),

    getTokenBalance: builder.query<TokenBalance, TokenBalanceRequest>({
      query: ({ address, token, network }) => ({
        url: `/portfolio/${address}/balance/${token}`,
        params: { network },
      }),
      providesTags: (_result, _error, { address, token }) => [
        { type: 'Portfolio', id: `${address}-${token}` },
      ],
      keepUnusedDataFor: 300,
    }),

    refreshPortfolio: builder.mutation<Portfolio, PortfolioRequest>({
      queryFn: async ({ address, network }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `/portfolio/${address}/refresh`,
          method: 'POST',
          body: { network },
        });
        if (result.error) {
          return { data: { ...mockPortfolio, lastUpdated: new Date().toISOString() } };
        }
        return { data: result.data as Portfolio };
      },
      invalidatesTags: (_result, _error, { address }) => [
        { type: 'Portfolio', id: address },
        'Prices',
      ],
    }),
  }),
});

export const {
  useGetPortfolioQuery,
  useGetTokenBalanceQuery,
  useRefreshPortfolioMutation,
} = portfolioApi;
