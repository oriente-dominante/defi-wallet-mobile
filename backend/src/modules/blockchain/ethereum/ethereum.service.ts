import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract } from 'ethers';
import { TokenBalance, NativeBalance } from '../blockchain.service';

// ERC-20 ABI for balance and metadata
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Common Ethereum tokens
const ETHEREUM_TOKENS: Record<string, { symbol: string; name: string; decimals: number; logoUri: string }> = {
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
  },
  '0x6B175474E89094C44Da98b954EesdeZdcec7Bef1ca': {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
  },
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoUri: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
  },
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  },
  '0x514910771AF9Ca656af840dff83E8264EcF986CA': {
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  },
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  },
};

@Injectable()
export class EthereumService {
  private readonly logger = new Logger(EthereumService.name);
  private readonly provider: ethers.JsonRpcProvider;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('blockchain.ethereum.rpcUrl');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getNativeBalance(address: string): Promise<NativeBalance> {
    try {
      const balance = await this.provider.getBalance(address);

      return {
        balance: balance.toString(),
        uiBalance: parseFloat(ethers.formatEther(balance)),
        symbol: 'ETH',
        decimals: 18,
      };
    } catch (error) {
      this.logger.error(`Failed to get ETH balance for ${address}:`, error);
      throw error;
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];

    // Check balances for known tokens
    for (const [tokenAddress, tokenMeta] of Object.entries(ETHEREUM_TOKENS)) {
      try {
        const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
        const balance = await contract.balanceOf(address);

        if (balance > 0n) {
          const uiBalance = parseFloat(ethers.formatUnits(balance, tokenMeta.decimals));

          balances.push({
            address: tokenAddress,
            symbol: tokenMeta.symbol,
            name: tokenMeta.name,
            decimals: tokenMeta.decimals,
            balance: balance.toString(),
            uiBalance,
            logoUri: tokenMeta.logoUri,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to get balance for token ${tokenAddress}:`, error);
        // Continue with other tokens
      }
    }

    return balances;
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance | null> {
    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);

      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol(),
        contract.name(),
      ]);

      const uiBalance = parseFloat(ethers.formatUnits(balance, decimals));

      const knownMeta = ETHEREUM_TOKENS[tokenAddress];

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        balance: balance.toString(),
        uiBalance,
        logoUri: knownMeta?.logoUri,
      };
    } catch (error) {
      this.logger.error(`Failed to get token balance for ${tokenAddress}:`, error);
      return null;
    }
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }
}
