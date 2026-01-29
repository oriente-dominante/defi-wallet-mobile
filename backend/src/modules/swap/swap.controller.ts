import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SwapService } from './swap.service';
import {
  SwapNetwork,
  SwapQuoteResponse,
  SwapTransactionResponse,
  GetSwapTransactionDto,
  TokenInfo,
} from './dto/swap.dto';

@ApiTags('swap')
@Controller('swap')
export class SwapController {
  private readonly logger = new Logger(SwapController.name);

  constructor(private readonly swapService: SwapService) {}

  @Get('quote')
  @ApiOperation({ summary: 'Get swap quote for a token pair' })
  @ApiQuery({ name: 'inputMint', description: 'Input token address', required: true })
  @ApiQuery({ name: 'outputMint', description: 'Output token address', required: true })
  @ApiQuery({ name: 'amount', description: 'Amount in base units', required: true })
  @ApiQuery({ name: 'network', enum: SwapNetwork, description: 'Blockchain network', required: true })
  @ApiQuery({ name: 'slippageBps', description: 'Slippage in basis points (default: 50)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Swap quote retrieved successfully',
    type: SwapQuoteResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getQuote(
    @Query('inputMint') inputMint: string,
    @Query('outputMint') outputMint: string,
    @Query('amount') amount: string,
    @Query('network') network: SwapNetwork,
    @Query('slippageBps') slippageBps?: number,
  ): Promise<SwapQuoteResponse> {
    if (!inputMint || !outputMint || !amount) {
      throw new BadRequestException('inputMint, outputMint, and amount are required');
    }

    if (!Object.values(SwapNetwork).includes(network)) {
      throw new BadRequestException('Invalid network. Must be "solana" or "ethereum"');
    }

    const slippage = slippageBps ? parseInt(String(slippageBps), 10) : 50;

    return this.swapService.getQuote(inputMint, outputMint, amount, network, slippage);
  }

  @Post('transaction')
  @ApiOperation({ summary: 'Get serialized swap transaction to sign' })
  @ApiBody({ type: GetSwapTransactionDto })
  @ApiResponse({
    status: 200,
    description: 'Swap transaction retrieved successfully',
    type: SwapTransactionResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getSwapTransaction(
    @Body() dto: GetSwapTransactionDto,
  ): Promise<SwapTransactionResponse> {
    if (!dto.userPublicKey || !dto.quote) {
      throw new BadRequestException('userPublicKey and quote are required');
    }

    return this.swapService.getSwapTransaction(
      dto.userPublicKey,
      dto.quote,
      dto.wrapAndUnwrapSol ?? true,
      dto.feeAccount,
    );
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get list of supported tokens for swapping' })
  @ApiQuery({ name: 'network', enum: SwapNetwork, description: 'Blockchain network', required: true })
  @ApiQuery({ name: 'search', description: 'Search by symbol or name', required: false })
  @ApiResponse({
    status: 200,
    description: 'Token list retrieved successfully',
    type: [TokenInfo],
  })
  async getTokenList(
    @Query('network') network: SwapNetwork,
    @Query('search') search?: string,
  ): Promise<TokenInfo[]> {
    if (!Object.values(SwapNetwork).includes(network)) {
      throw new BadRequestException('Invalid network. Must be "solana" or "ethereum"');
    }

    let tokens = await this.swapService.getTokenList(network);

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      tokens = tokens.filter(
        t =>
          t.symbol.toLowerCase().includes(searchLower) ||
          t.name.toLowerCase().includes(searchLower),
      );
    }

    return tokens;
  }

  @Get('token')
  @ApiOperation({ summary: 'Get token info by address' })
  @ApiQuery({ name: 'address', description: 'Token address', required: true })
  @ApiQuery({ name: 'network', enum: SwapNetwork, description: 'Blockchain network', required: true })
  @ApiResponse({
    status: 200,
    description: 'Token info retrieved successfully',
    type: TokenInfo,
  })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async getTokenByAddress(
    @Query('address') address: string,
    @Query('network') network: SwapNetwork,
  ): Promise<TokenInfo | null> {
    if (!address) {
      throw new BadRequestException('Address is required');
    }

    return this.swapService.getTokenByAddress(address, network);
  }

  @Get('native-token')
  @ApiOperation({ summary: 'Get native token address for a network' })
  @ApiQuery({ name: 'network', enum: SwapNetwork, description: 'Blockchain network', required: true })
  @ApiResponse({
    status: 200,
    description: 'Native token address',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        network: { type: 'string' },
      },
    },
  })
  getNativeTokenAddress(
    @Query('network') network: SwapNetwork,
  ): { address: string; network: SwapNetwork } {
    if (!Object.values(SwapNetwork).includes(network)) {
      throw new BadRequestException('Invalid network. Must be "solana" or "ethereum"');
    }

    return {
      address: this.swapService.getNativeTokenAddress(network),
      network,
    };
  }
}
