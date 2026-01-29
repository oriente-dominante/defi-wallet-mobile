import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolanaService } from './solana/solana.service';
import { EthereumService } from './ethereum/ethereum.service';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainService, SolanaService, EthereumService],
  exports: [BlockchainService, SolanaService, EthereumService],
})
export class BlockchainModule {}
