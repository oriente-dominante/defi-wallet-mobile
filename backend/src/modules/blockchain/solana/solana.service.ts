import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TokenBalance, NativeBalance } from '../blockchain.service';

// Common Solana tokens with metadata
const SOLANA_TOKENS: Record<string, { symbol: string; name: string; decimals: number; logoUri: string }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  },
  'So11111111111111111111111111111111111111112': {
    symbol: 'wSOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
  },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    logoUri: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    logoUri: 'https://static.jup.ag/jup/icon.png',
  },
};

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private readonly connection: Connection;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('blockchain.solana.rpcUrl');
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getNativeBalance(address: string): Promise<NativeBalance> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);

      return {
        balance: balance.toString(),
        uiBalance: balance / LAMPORTS_PER_SOL,
        symbol: 'SOL',
        decimals: 9,
      };
    } catch (error) {
      this.logger.error(`Failed to get SOL balance for ${address}:`, error);
      throw error;
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      const publicKey = new PublicKey(address);

      // Get all token accounts for the address
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      const balances: TokenBalance[] = [];

      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed?.info;
        if (!parsedInfo) continue;

        const mintAddress = parsedInfo.mint;
        const tokenAmount = parsedInfo.tokenAmount;

        if (tokenAmount.uiAmount === 0) continue;

        // Get token metadata from our list or use defaults
        const tokenMeta = SOLANA_TOKENS[mintAddress] || {
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          decimals: tokenAmount.decimals,
          logoUri: undefined,
        };

        balances.push({
          address: mintAddress,
          symbol: tokenMeta.symbol,
          name: tokenMeta.name,
          decimals: tokenMeta.decimals,
          balance: tokenAmount.amount,
          uiBalance: tokenAmount.uiAmount,
          logoUri: tokenMeta.logoUri,
        });
      }

      return balances;
    } catch (error) {
      this.logger.error(`Failed to get token balances for ${address}:`, error);
      throw error;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  async getRecentBlockhash(): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    return blockhash;
  }
}
