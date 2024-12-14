import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StoreService, PaymentService, ConfigService } from './services';
import { PaymentRepository, StoreRepository } from './repositories';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    StoreService,
    PaymentService,
    ConfigService,
    PaymentRepository,
    StoreRepository,
  ],
})
export class AppModule {}
