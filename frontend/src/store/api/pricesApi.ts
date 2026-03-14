import { baseApi } from './baseApi';

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface PricesResponse {
  [symbol: string]: PriceData;
}

const mockPrices: PricesResponse = {
  sol: {
    symbol: 'SOL',
    price: 173.8,
    change24h: 8.54,
    changePercent24h: 5.2,
    marketCap: 82400000000,
    volume24h: 3200000000,
    lastUpdated: new Date().toISOString(),
  },
  eth: {
    symbol: 'ETH',
    price: 2452.3,
    change24h: -52.65,
    changePercent24h: -2.1,
    marketCap: 295000000000,
    volume24h: 12800000000,
    lastUpdated: new Date().toISOString(),
  },
  bitcoin: {
    symbol: 'BTC',
    price: 67250.0,
    change24h: 1245.0,
    changePercent24h: 1.88,
    marketCap: 1320000000000,
    volume24h: 28500000000,
    lastUpdated: new Date().toISOString(),
  },
  solana: {
    symbol: 'SOL',
    price: 173.8,
    change24h: 8.54,
    changePercent24h: 5.2,
    marketCap: 82400000000,
    volume24h: 3200000000,
    lastUpdated: new Date().toISOString(),
  },
  ethereum: {
    symbol: 'ETH',
    price: 2452.3,
    change24h: -52.65,
    changePercent24h: -2.1,
    marketCap: 295000000000,
    volume24h: 12800000000,
    lastUpdated: new Date().toISOString(),
  },
  'usd-coin': {
    symbol: 'USDC',
    price: 1.0,
    change24h: 0.0,
    changePercent24h: 0.0,
    marketCap: 33000000000,
    volume24h: 5600000000,
    lastUpdated: new Date().toISOString(),
  },
};

// Real price API integration with mock fallback
export const pricesApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getTokenPrices: builder.query<PricesResponse, string[]>({
      queryFn: async (tokens, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: '/prices',
          params: { tokens: tokens.join(',') },
        });
        if (result.error) {
          // Fallback to mock prices when backend is unavailable
          const filtered: PricesResponse = {};
          tokens.forEach(token => {
            const key = token.toLowerCase();
            if (mockPrices[key]) {
              filtered[key] = mockPrices[key];
            }
          });
          return { data: filtered };
        }
        return { data: result.data as PricesResponse };
      },
      providesTags: ['Prices'],
      keepUnusedDataFor: 30,
    }),

    getTokenPrice: builder.query<PriceData, string>({
      queryFn: async (token, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `/prices/${token}`,
        });
        if (result.error) {
          const key = token.toLowerCase();
          if (mockPrices[key]) {
            return { data: mockPrices[key] };
          }
          return { error: { status: 404, data: 'Token not found' } };
        }
        return { data: result.data as PriceData };
      },
      providesTags: (_result, _error, token) => [{ type: 'Prices', id: token }],
      keepUnusedDataFor: 30,
    }),

    // CoinGecko integration fallback (if backend is down)
    getCoinGeckoPrices: builder.query<any, string[]>({
      query: tokens => ({
        url: 'https://api.coingecko.com/api/v3/simple/price',
        params: {
          ids: tokens.join(','),
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_market_cap: 'true',
          include_24hr_vol: 'true',
        },
      }),
      transformResponse: (response: any): PricesResponse => {
        const transformed: PricesResponse = {};
        Object.entries(response).forEach(([key, value]: [string, any]) => {
          transformed[key] = {
            symbol: key.toUpperCase(),
            price: value.usd || 0,
            change24h: value.usd_24h_change || 0,
            changePercent24h: value.usd_24h_change || 0,
            marketCap: value.usd_market_cap || 0,
            volume24h: value.usd_24h_vol || 0,
            lastUpdated: new Date().toISOString(),
          };
        });
        return transformed;
      },
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useGetTokenPricesQuery,
  useGetTokenPriceQuery,
  useGetCoinGeckoPricesQuery,
} = pricesApi;
