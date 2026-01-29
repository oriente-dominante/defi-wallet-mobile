import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import {
  NetworkType,
  PortfolioResponse,
  TokenBalanceResponse,
  NativeBalanceResponse,
} from './dto/portfolio.dto';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  private readonly logger = new Logger(PortfolioController.name);

  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get complete portfolio for a wallet address' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  @ApiQuery({ name: 'network', enum: NetworkType, description: 'Blockchain network', required: true })
  @ApiResponse({
    status: 200,
    description: 'Portfolio data retrieved successfully',
    type: PortfolioResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid address or network' })
  async getPortfolio(
    @Query('address') address: string,
    @Query('network') network: NetworkType,
  ): Promise<PortfolioResponse> {
    if (!address) {
      throw new BadRequestException('Address is required');
    }

    if (!Object.values(NetworkType).includes(network)) {
      throw new BadRequestException('Invalid network. Must be "solana" or "ethereum"');
    }

    const isValid = await this.portfolioService.validateAddress(address, network);
    if (!isValid) {
      throw new BadRequestException(`Invalid ${network} address`);
    }

    return this.portfolioService.getPortfolio(address, network);
  }

  @Get('native')
  @ApiOperation({ summary: 'Get native token balance (ETH/SOL)' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  @ApiQuery({ name: 'network', enum: NetworkType, description: 'Blockchain network', required: true })
  @ApiResponse({
    status: 200,
    description: 'Native balance retrieved successfully',
    type: NativeBalanceResponse,
  })
  async getNativeBalance(
    @Query('address') address: string,
    @Query('network') network: NetworkType,
  ): Promise<NativeBalanceResponse> {
    if (!address) {
      throw new BadRequestException('Address is required');
    }

    const isValid = await this.portfolioService.validateAddress(address, network);
    if (!isValid) {
      throw new BadRequestException(`Invalid ${network} address`);
    }

    return this.portfolioService.getNativeBalance(address, network);
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get all token balances for a wallet' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  @ApiQuery({ name: 'network', enum: NetworkType, description: 'Blockchain network', required: true })
  @ApiResponse({
    status: 200,
    description: 'Token balances retrieved successfully',
    type: [TokenBalanceResponse],
  })
  async getTokenBalances(
    @Query('address') address: string,
    @Query('network') network: NetworkType,
  ): Promise<TokenBalanceResponse[]> {
    if (!address) {
      throw new BadRequestException('Address is required');
    }

    const isValid = await this.portfolioService.validateAddress(address, network);
    if (!isValid) {
      throw new BadRequestException(`Invalid ${network} address`);
    }

    return this.portfolioService.getTokenBalances(address, network);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a wallet address' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  @ApiQuery({ name: 'network', enum: NetworkType, description: 'Blockchain network', required: true })
  @ApiResponse({
    status: 200,
    description: 'Address validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        address: { type: 'string' },
        network: { type: 'string' },
      },
    },
  })
  async validateAddress(
    @Query('address') address: string,
    @Query('network') network: NetworkType,
  ): Promise<{ valid: boolean; address: string; network: string }> {
    const valid = await this.portfolioService.validateAddress(address, network);
    return { valid, address, network };
  }
}
