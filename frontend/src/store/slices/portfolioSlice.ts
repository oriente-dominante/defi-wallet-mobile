import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Portfolio, PortfolioState, Token } from '../../types/portfolio';

// Mock data for initial implementation
const mockTokens: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    balance: '12.5456',
    usdValue: 2180.50,
    price: 173.80,
    change24h: 5.2,
  },
  {
    address: '0xA0b86a33E6441b8b03dB53C5B8c1A7F8be3d7A8F',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '5.2341',
    usdValue: 12840.25,
    price: 2452.30,
    change24h: -2.1,
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '399.75',
    usdValue: 399.75,
    price: 1.00,
    change24h: 0.0,
  },
];

const mockPortfolio: Portfolio = {
  totalValue: 15420.50,
  totalChange24h: 340.25,
  totalChangePercent24h: 2.26,
  tokens: mockTokens,
  lastUpdated: new Date().toISOString(),
};

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async ({ address, network }: { address: string; network: 'solana' | 'ethereum' }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockPortfolio;
  }
);

const initialState: PortfolioState = {
  portfolio: mockPortfolio,
  isLoading: false,
  error: null,
  selectedAddress: null,
  selectedNetwork: 'solana',
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setSelectedAddress: (state, action: PayloadAction<string>) => {
      state.selectedAddress = action.payload;
    },
    setSelectedNetwork: (state, action: PayloadAction<'solana' | 'ethereum'>) => {
      state.selectedNetwork = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch portfolio';
      });
  },
});

export const { setSelectedAddress, setSelectedNetwork, clearError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
