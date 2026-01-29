import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { JupiterService } from './jupiter.service';
import { ZeroXService } from './zerox.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [SwapController],
  providers: [SwapService, JupiterService, ZeroXService],
  exports: [SwapService, JupiterService, ZeroXService],
})
export class SwapModule {}
