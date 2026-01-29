import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JupiterService } from './jupiter.service';
import { ZeroXService } from './zerox.service';
import {
  SwapNetwork,
  SwapQuoteResponse,
  SwapTransactionResponse,
  TokenInfo,
} from './dto/swap.dto';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    private readonly jupiterService: JupiterService,
    private readonly zeroxService: ZeroXService,
  ) {}

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    network: SwapNetwork,
    slippageBps: number = 50,
  ): Promise<SwapQuoteResponse> {
    if (network === SwapNetwork.SOLANA) {
      return this.jupiterService.getQuote(inputMint, outputMint, amount, slippageBps);
    } else if (network === SwapNetwork.ETHEREUM) {
      return this.zeroxService.getQuote(inputMint, outputMint, amount, slippageBps);
    } else {
      throw new BadRequestException(`Unsupported network: ${network}`);
    }
  }

  async getSwapTransaction(
    userPublicKey: string,
    quote: SwapQuoteResponse,
    wrapAndUnwrapSol: boolean = true,
    feeAccount?: string,
  ): Promise<SwapTransactionResponse> {
    if (quote.network === SwapNetwork.SOLANA) {
      return this.jupiterService.getSwapTransaction(
        userPublicKey,
        quote,
        wrapAndUnwrapSol,
        feeAccount,
      );
    } else if (quote.network === SwapNetwork.ETHEREUM) {
      return this.zeroxService.getSwapTransaction(userPublicKey, quote);
    } else {
      throw new BadRequestException(`Unsupported network: ${quote.network}`);
    }
  }

  async getTokenList(network: SwapNetwork): Promise<TokenInfo[]> {
    if (network === SwapNetwork.SOLANA) {
      return this.jupiterService.getTokenList();
    } else if (network === SwapNetwork.ETHEREUM) {
      // Return common Ethereum tokens as a static list
      return Object.entries(ZeroXService.TOKENS).map(([symbol, address]) => ({
        address,
        symbol,
        name: symbol === 'ETH' ? 'Ethereum' : symbol,
        decimals: this.getEthereumTokenDecimals(symbol),
        logoUri: undefined,
      }));
    } else {
      throw new BadRequestException(`Unsupported network: ${network}`);
    }
  }

  async getTokenByAddress(address: string, network: SwapNetwork): Promise<TokenInfo | null> {
    if (network === SwapNetwork.SOLANA) {
      return this.jupiterService.getTokenByAddress(address);
    } else if (network === SwapNetwork.ETHEREUM) {
      // Check common Ethereum tokens
      for (const [symbol, tokenAddress] of Object.entries(ZeroXService.TOKENS)) {
        if (tokenAddress.toLowerCase() === address.toLowerCase()) {
          return {
            address: tokenAddress,
            symbol,
            name: symbol === 'ETH' ? 'Ethereum' : symbol,
            decimals: this.getEthereumTokenDecimals(symbol),
          };
        }
      }
      return null;
    } else {
      throw new BadRequestException(`Unsupported network: ${network}`);
    }
  }

  getNativeTokenAddress(network: SwapNetwork): string {
    if (network === SwapNetwork.SOLANA) {
      return JupiterService.NATIVE_SOL;
    } else {
      return ZeroXService.NATIVE_ETH;
    }
  }

  private getEthereumTokenDecimals(symbol: string): number {
    const decimalsMap: Record<string, number> = {
      ETH: 18,
      WETH: 18,
      USDC: 6,
      USDT: 6,
      DAI: 18,
      WBTC: 8,
      LINK: 18,
      UNI: 18,
    };
    return decimalsMap[symbol] || 18;
  }
}
