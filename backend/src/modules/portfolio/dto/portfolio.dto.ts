import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export enum NetworkType {
  SOLANA = 'solana',
  ETHEREUM = 'ethereum',
}

export class GetPortfolioDto {
  @ApiProperty({ description: 'Wallet address' })
  @IsString()
  address: string;

  @ApiProperty({ enum: NetworkType, description: 'Blockchain network' })
  @IsEnum(NetworkType)
  network: NetworkType;
}

export class GetTokenBalanceDto {
  @ApiProperty({ description: 'Wallet address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Token contract address' })
  @IsString()
  tokenAddress: string;

  @ApiProperty({ enum: NetworkType, description: 'Blockchain network' })
  @IsEnum(NetworkType)
  network: NetworkType;
}

export class TokenBalanceResponse {
  @ApiProperty({ description: 'Token contract address' })
  address: string;

  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Token decimals' })
  decimals: number;

  @ApiProperty({ description: 'Raw balance as string' })
  balance: string;

  @ApiProperty({ description: 'UI-friendly balance' })
  uiBalance: number;

  @ApiPropertyOptional({ description: 'Token logo URI' })
  logoUri?: string;

  @ApiPropertyOptional({ description: 'USD value' })
  usdValue?: number;
}

export class NativeBalanceResponse {
  @ApiProperty({ description: 'Raw balance as string' })
  balance: string;

  @ApiProperty({ description: 'UI-friendly balance' })
  uiBalance: number;

  @ApiProperty({ description: 'Token symbol (ETH, SOL)' })
  symbol: string;

  @ApiProperty({ description: 'Token decimals' })
  decimals: number;

  @ApiPropertyOptional({ description: 'USD value' })
  usdValue?: number;
}

export class PortfolioResponse {
  @ApiProperty({ description: 'Wallet address' })
  address: string;

  @ApiProperty({ enum: NetworkType, description: 'Blockchain network' })
  network: NetworkType;

  @ApiProperty({ type: NativeBalanceResponse, description: 'Native token balance' })
  nativeBalance: NativeBalanceResponse;

  @ApiProperty({ type: [TokenBalanceResponse], description: 'Token balances' })
  tokens: TokenBalanceResponse[];

  @ApiProperty({ description: 'Total portfolio value in USD' })
  totalValueUsd: number;

  @ApiProperty({ description: 'Timestamp of the data' })
  timestamp: string;
}
