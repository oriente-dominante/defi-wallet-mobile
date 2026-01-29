import { Injectable, Logger } from '@nestjs/common';
import { SolanaService } from './solana/solana.service';
import { EthereumService } from './ethereum/ethereum.service';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  uiBalance: number;
  logoUri?: string;
}

export interface NativeBalance {
  balance: string;
  uiBalance: number;
  symbol: string;
  decimals: number;
}

export type Network = 'solana' | 'ethereum';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private readonly solanaService: SolanaService,
    private readonly ethereumService: EthereumService,
  ) {}

  async getNativeBalance(address: string, network: Network): Promise<NativeBalance> {
    if (network === 'solana') {
      return this.solanaService.getNativeBalance(address);
    } else {
      return this.ethereumService.getNativeBalance(address);
    }
  }

  async getTokenBalances(address: string, network: Network): Promise<TokenBalance[]> {
    if (network === 'solana') {
      return this.solanaService.getTokenBalances(address);
    } else {
      return this.ethereumService.getTokenBalances(address);
    }
  }

  async isValidAddress(address: string, network: Network): Promise<boolean> {
    try {
      if (network === 'solana') {
        return this.solanaService.isValidAddress(address);
      } else {
        return this.ethereumService.isValidAddress(address);
      }
    } catch {
      return false;
    }
  }

  getExplorerUrl(txHash: string, network: Network): string {
    if (network === 'solana') {
      return `https://solscan.io/tx/${txHash}`;
    } else {
      return `https://etherscan.io/tx/${txHash}`;
    }
  }
}
