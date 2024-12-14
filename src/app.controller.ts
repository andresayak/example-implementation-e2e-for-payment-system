import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ConfigService, StoreService, PaymentService } from './services';
import { ConfigDto } from './dto/config.dto';
import { StoreDto } from './dto/store.dto';
import { PaymentDto } from './dto/payment.dto';
import { StoreRepository } from './repositories';
import { PaymentType, StoreType } from './types';

@Controller()
export class AppController {
  constructor(
    private readonly storeService: StoreService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly storeRepository: StoreRepository,
  ) {}

  @Post('config')
  config(@Body() dto: ConfigDto): boolean {
    return this.configService.save(dto);
  }

  @Post('store')
  store(@Body() dto: StoreDto): number {
    return this.storeService.create(dto);
  }

  @Get('stores')
  stores(): StoreType[] {
    return this.storeRepository.findAll();
  }

  @Post('store/:storeId/purchase')
  payment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: PaymentDto,
  ): number {
    const store = this.storeRepository.findOneByIdOrFail(storeId);

    return this.paymentService.purchase(store.id, dto);
  }

  @Get('store/:storeId/payments')
  getPayments(@Param('storeId', ParseIntPipe) storeId: number): PaymentType[] {
    return this.paymentService.payments(storeId);
  }

  @Post('store/:storeId/payments')
  payments(
    @Body('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
    paymentIds: number[],
  ) {
    return this.paymentService.complete(paymentIds);
  }

  @Post('store/:storeId/payout')
  payouts(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.paymentService.payout(storeId);
  }
}
