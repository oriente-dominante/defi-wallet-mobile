import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BlockchainService, Network } from '../blockchain/blockchain.service';
import {
  NetworkType,
  PortfolioResponse,
  TokenBalanceResponse,
  NativeBalanceResponse,
} from './dto/portfolio.dto';

// CoinGecko token IDs for price lookup
const TOKEN_TO_COINGECKO: Record<string, string> = {
  ETH: 'ethereum',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  WETH: 'weth',
  LINK: 'chainlink',
  UNI: 'uniswap',
  wSOL: 'wrapped-solana',
  mSOL: 'msol',
  BONK: 'bonk',
  JUP: 'jupiter-exchange-solana',
};

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly PRICE_CACHE_TTL = 60000; // 1 minute

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getPortfolio(address: string, network: NetworkType): Promise<PortfolioResponse> {
    const blockchainNetwork: Network = network as Network;

    // Fetch balances in parallel
    const [nativeBalance, tokenBalances] = await Promise.all([
      this.blockchainService.getNativeBalance(address, blockchainNetwork),
      this.blockchainService.getTokenBalances(address, blockchainNetwork),
    ]);

    // Fetch prices for all tokens
    const symbols = [nativeBalance.symbol, ...tokenBalances.map(t => t.symbol)];
    const prices = await this.getTokenPrices(symbols);

    // Calculate native balance with USD value
    const nativeWithValue: NativeBalanceResponse = {
      ...nativeBalance,
      usdValue: nativeBalance.uiBalance * (prices[nativeBalance.symbol] || 0),
    };

    // Calculate token balances with USD values
    const tokensWithValue: TokenBalanceResponse[] = tokenBalances.map(token => ({
      ...token,
      usdValue: token.uiBalance * (prices[token.symbol] || 0),
    }));

    // Calculate total portfolio value
    const totalValueUsd =
      (nativeWithValue.usdValue || 0) +
      tokensWithValue.reduce((sum, t) => sum + (t.usdValue || 0), 0);

    return {
      address,
      network,
      nativeBalance: nativeWithValue,
      tokens: tokensWithValue,
      totalValueUsd,
      timestamp: new Date().toISOString(),
    };
  }

  async getNativeBalance(address: string, network: NetworkType): Promise<NativeBalanceResponse> {
    const blockchainNetwork: Network = network as Network;
    const balance = await this.blockchainService.getNativeBalance(address, blockchainNetwork);
    const prices = await this.getTokenPrices([balance.symbol]);

    return {
      ...balance,
      usdValue: balance.uiBalance * (prices[balance.symbol] || 0),
    };
  }

  async getTokenBalances(address: string, network: NetworkType): Promise<TokenBalanceResponse[]> {
    const blockchainNetwork: Network = network as Network;
    const balances = await this.blockchainService.getTokenBalances(address, blockchainNetwork);
    const symbols = balances.map(t => t.symbol);
    const prices = await this.getTokenPrices(symbols);

    return balances.map(token => ({
      ...token,
      usdValue: token.uiBalance * (prices[token.symbol] || 0),
    }));
  }

  async validateAddress(address: string, network: NetworkType): Promise<boolean> {
    const blockchainNetwork: Network = network as Network;
    return this.blockchainService.isValidAddress(address, blockchainNetwork);
  }

  private async getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const symbolsToFetch: string[] = [];

    // Check cache first
    const now = Date.now();
    for (const symbol of symbols) {
      const cached = this.priceCache.get(symbol);
      if (cached && now - cached.timestamp < this.PRICE_CACHE_TTL) {
        prices[symbol] = cached.price;
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    if (symbolsToFetch.length === 0) {
      return prices;
    }

    // Fetch prices from CoinGecko
    try {
      const coingeckoIds = symbolsToFetch
        .map(s => TOKEN_TO_COINGECKO[s])
        .filter(Boolean)
        .join(',');

      if (coingeckoIds) {
        const response = await firstValueFrom(
          this.httpService.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`,
          ),
        );

        // Map prices back to symbols
        for (const symbol of symbolsToFetch) {
          const coingeckoId = TOKEN_TO_COINGECKO[symbol];
          if (coingeckoId && response.data[coingeckoId]) {
            const price = response.data[coingeckoId].usd;
            prices[symbol] = price;
            this.priceCache.set(symbol, { price, timestamp: now });
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to fetch prices from CoinGecko:', error);
      // Return cached or zero prices on error
    }

    return prices;
  }
}
