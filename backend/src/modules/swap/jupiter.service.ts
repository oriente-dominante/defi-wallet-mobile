import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SwapQuoteResponse, SwapTransactionResponse, SwapNetwork, TokenInfo } from './dto/swap.dto';

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

@Injectable()
export class JupiterService {
  private readonly logger = new Logger(JupiterService.name);
  private readonly baseUrl: string;
  private tokenListCache: TokenInfo[] | null = null;
  private tokenListTimestamp = 0;
  private readonly TOKEN_CACHE_TTL = 3600000; // 1 hour

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('apis.jupiter.baseUrl') || 'https://quote-api.jup.ag/v6';
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50,
  ): Promise<SwapQuoteResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<JupiterQuoteResponse>(`${this.baseUrl}/quote`, {
          params: {
            inputMint,
            outputMint,
            amount,
            slippageBps,
            swapMode: 'ExactIn',
          },
        }),
      );

      const quote = response.data;

      return {
        inputMint: quote.inputMint,
        outputMint: quote.outputMint,
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        otherAmountThreshold: quote.otherAmountThreshold,
        slippageBps: quote.slippageBps,
        priceImpactPct: quote.priceImpactPct,
        routePlan: quote.routePlan,
        network: SwapNetwork.SOLANA,
      };
    } catch (error) {
      this.logger.error('Failed to get Jupiter quote:', error);
      throw error;
    }
  }

  async getSwapTransaction(
    userPublicKey: string,
    quote: SwapQuoteResponse,
    wrapAndUnwrapSol: boolean = true,
    feeAccount?: string,
  ): Promise<SwapTransactionResponse> {
    try {
      const requestBody: Record<string, unknown> = {
        userPublicKey,
        wrapAndUnwrapSol,
        quoteResponse: {
          inputMint: quote.inputMint,
          outputMint: quote.outputMint,
          inAmount: quote.inAmount,
          outAmount: quote.outAmount,
          otherAmountThreshold: quote.otherAmountThreshold,
          swapMode: 'ExactIn',
          slippageBps: quote.slippageBps,
          priceImpactPct: quote.priceImpactPct,
          routePlan: quote.routePlan,
        },
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      };

      if (feeAccount) {
        requestBody.feeAccount = feeAccount;
      }

      const response = await firstValueFrom(
        this.httpService.post<JupiterSwapResponse>(`${this.baseUrl}/swap`, requestBody),
      );

      return {
        swapTransaction: response.data.swapTransaction,
        lastValidBlockHeight: response.data.lastValidBlockHeight,
        network: SwapNetwork.SOLANA,
      };
    } catch (error) {
      this.logger.error('Failed to get Jupiter swap transaction:', error);
      throw error;
    }
  }

  async getTokenList(): Promise<TokenInfo[]> {
    const now = Date.now();

    // Return cached list if still valid
    if (this.tokenListCache && now - this.tokenListTimestamp < this.TOKEN_CACHE_TTL) {
      return this.tokenListCache;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://token.jup.ag/strict'),
      );

      this.tokenListCache = response.data.map((token: {
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        logoURI?: string;
      }) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUri: token.logoURI,
      }));
      this.tokenListTimestamp = now;

      return this.tokenListCache;
    } catch (error) {
      this.logger.error('Failed to fetch Jupiter token list:', error);
      // Return cached list even if expired, or empty array
      return this.tokenListCache || [];
    }
  }

  async getTokenByAddress(address: string): Promise<TokenInfo | null> {
    const tokens = await this.getTokenList();
    return tokens.find(t => t.address === address) || null;
  }

  // Native SOL address constant
  static readonly NATIVE_SOL = 'So11111111111111111111111111111111111111112';

  // Common Solana token addresses
  static readonly TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  };
}
