import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { SwapModule } from './modules/swap/swap.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
        limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      }),
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature modules
    HealthModule,
    NotificationsModule,
    BlockchainModule,
    PortfolioModule,
    SwapModule,
  ],
})
export class AppModule {}
