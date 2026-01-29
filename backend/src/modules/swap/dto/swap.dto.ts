import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum SwapNetwork {
  SOLANA = 'solana',
  ETHEREUM = 'ethereum',
}

export class GetQuoteDto {
  @ApiProperty({ description: 'Input token address (mint for Solana, contract for Ethereum)' })
  @IsString()
  inputMint: string;

  @ApiProperty({ description: 'Output token address' })
  @IsString()
  outputMint: string;

  @ApiProperty({ description: 'Amount in base units (lamports, wei, etc.)' })
  @IsString()
  amount: string;

  @ApiProperty({ enum: SwapNetwork, description: 'Blockchain network' })
  @IsEnum(SwapNetwork)
  network: SwapNetwork;

  @ApiPropertyOptional({ description: 'Maximum allowed slippage in basis points (default: 50 = 0.5%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  slippageBps?: number;
}

export class SwapQuoteResponse {
  @ApiProperty({ description: 'Input token address' })
  inputMint: string;

  @ApiProperty({ description: 'Output token address' })
  outputMint: string;

  @ApiProperty({ description: 'Input amount in base units' })
  inAmount: string;

  @ApiProperty({ description: 'Expected output amount in base units' })
  outAmount: string;

  @ApiProperty({ description: 'Minimum output amount after slippage' })
  otherAmountThreshold: string;

  @ApiProperty({ description: 'Slippage in basis points' })
  slippageBps: number;

  @ApiProperty({ description: 'Price impact percentage' })
  priceImpactPct: string;

  @ApiProperty({ description: 'Route information' })
  routePlan: RouteStep[];

  @ApiPropertyOptional({ description: 'Estimated gas (Ethereum only)' })
  estimatedGas?: string;

  @ApiPropertyOptional({ description: 'Quote ID for execution' })
  quoteId?: string;

  @ApiProperty({ description: 'Blockchain network' })
  network: SwapNetwork;
}

export class RouteStep {
  @ApiProperty({ description: 'DEX/AMM name' })
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

  @ApiProperty({ description: 'Percentage of the swap using this route' })
  percent: number;
}

export class GetSwapTransactionDto {
  @ApiProperty({ description: 'User wallet address' })
  @IsString()
  userPublicKey: string;

  @ApiProperty({ description: 'Quote response from getQuote' })
  quote: SwapQuoteResponse;

  @ApiPropertyOptional({ description: 'Wrap/unwrap SOL automatically (Solana only)' })
  @IsOptional()
  wrapAndUnwrapSol?: boolean;

  @ApiPropertyOptional({ description: 'Fee account for referral fees (Solana only)' })
  @IsOptional()
  @IsString()
  feeAccount?: string;
}

export class SwapTransactionResponse {
  @ApiProperty({ description: 'Serialized transaction to sign' })
  swapTransaction: string;

  @ApiProperty({ description: 'Blockchain network' })
  network: SwapNetwork;

  @ApiPropertyOptional({ description: 'Last valid block height (Solana)' })
  lastValidBlockHeight?: number;

  @ApiPropertyOptional({ description: 'Transaction to address (Ethereum)' })
  to?: string;

  @ApiPropertyOptional({ description: 'Transaction data (Ethereum)' })
  data?: string;

  @ApiPropertyOptional({ description: 'Transaction value (Ethereum)' })
  value?: string;

  @ApiPropertyOptional({ description: 'Gas limit (Ethereum)' })
  gasLimit?: string;

  @ApiPropertyOptional({ description: 'Gas price (Ethereum)' })
  gasPrice?: string;
}

export class TokenInfo {
  @ApiProperty({ description: 'Token address' })
  address: string;

  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Token decimals' })
  decimals: number;

  @ApiPropertyOptional({ description: 'Token logo URI' })
  logoUri?: string;
}
