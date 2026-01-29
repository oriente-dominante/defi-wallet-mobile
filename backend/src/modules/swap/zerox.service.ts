import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SwapQuoteResponse, SwapTransactionResponse, SwapNetwork, TokenInfo } from './dto/swap.dto';

interface ZeroXQuoteResponse {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  minBuyAmount: string;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  gas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  allowanceTarget: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
}

@Injectable()
export class ZeroXService {
  private readonly logger = new Logger(ZeroXService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('apis.zerox.baseUrl') || 'https://api.0x.org';
    this.apiKey = this.configService.get<string>('apis.zerox.apiKey') || '';
  }

  async getQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    slippageBps: number = 50,
  ): Promise<SwapQuoteResponse> {
    try {
      const slippagePercentage = slippageBps / 10000; // Convert bps to decimal

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['0x-api-key'] = this.apiKey;
      }

      const response = await firstValueFrom(
        this.httpService.get<ZeroXQuoteResponse>(`${this.baseUrl}/swap/v1/quote`, {
          params: {
            sellToken,
            buyToken,
            sellAmount,
            slippagePercentage: slippagePercentage.toString(),
          },
          headers,
        }),
      );

      const quote = response.data;

      // Convert 0x response to our unified format
      return {
        inputMint: quote.sellToken,
        outputMint: quote.buyToken,
        inAmount: quote.sellAmount,
        outAmount: quote.buyAmount,
        otherAmountThreshold: quote.minBuyAmount,
        slippageBps,
        priceImpactPct: quote.estimatedPriceImpact || '0',
        routePlan: quote.sources
          .filter(s => parseFloat(s.proportion) > 0)
          .map(source => ({
            swapInfo: {
              ammKey: source.name,
              label: source.name,
              inputMint: quote.sellToken,
              outputMint: quote.buyToken,
              inAmount: (BigInt(quote.sellAmount) * BigInt(Math.floor(parseFloat(source.proportion) * 100)) / BigInt(100)).toString(),
              outAmount: (BigInt(quote.buyAmount) * BigInt(Math.floor(parseFloat(source.proportion) * 100)) / BigInt(100)).toString(),
              feeAmount: '0',
              feeMint: quote.sellToken,
            },
            percent: Math.round(parseFloat(source.proportion) * 100),
          })),
        estimatedGas: quote.gas,
        network: SwapNetwork.ETHEREUM,
      };
    } catch (error) {
      this.logger.error('Failed to get 0x quote:', error);
      throw error;
    }
  }

  async getSwapTransaction(
    userAddress: string,
    quote: SwapQuoteResponse,
  ): Promise<SwapTransactionResponse> {
    try {
      const slippagePercentage = quote.slippageBps / 10000;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['0x-api-key'] = this.apiKey;
      }

      // For Ethereum, we need to get the full transaction data
      const response = await firstValueFrom(
        this.httpService.get<ZeroXQuoteResponse>(`${this.baseUrl}/swap/v1/quote`, {
          params: {
            sellToken: quote.inputMint,
            buyToken: quote.outputMint,
            sellAmount: quote.inAmount,
            slippagePercentage: slippagePercentage.toString(),
            takerAddress: userAddress,
          },
          headers,
        }),
      );

      const txData = response.data;

      return {
        swapTransaction: txData.data,
        network: SwapNetwork.ETHEREUM,
        to: txData.to,
        data: txData.data,
        value: txData.value,
        gasLimit: txData.gas,
        gasPrice: txData.gasPrice,
      };
    } catch (error) {
      this.logger.error('Failed to get 0x swap transaction:', error);
      throw error;
    }
  }

  async getPrice(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
  ): Promise<{ price: string; estimatedGas: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['0x-api-key'] = this.apiKey;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/swap/v1/price`, {
          params: {
            sellToken,
            buyToken,
            sellAmount,
          },
          headers,
        }),
      );

      return {
        price: response.data.price,
        estimatedGas: response.data.estimatedGas,
      };
    } catch (error) {
      this.logger.error('Failed to get 0x price:', error);
      throw error;
    }
  }

  // Native ETH address (0x uses this special address)
  static readonly NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

  // Common Ethereum token addresses
  static readonly TOKENS = {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EesdeZdcec7Bef1ca',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  };
}
