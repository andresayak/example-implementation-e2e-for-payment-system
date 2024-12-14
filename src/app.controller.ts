import {
  BadRequestException,
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
import { PaymentRepository, StoreRepository } from './repositories';
import { PaymentType, StoreType } from './types';
import { ConfigType } from './types';

@Controller()
export class AppController {
  constructor(
    private readonly storeService: StoreService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly storeRepository: StoreRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  @Get('config')
  config(): ConfigType {
    return this.configService.config;
  }

  @Post('config')
  saveConfig(@Body() dto: ConfigDto): boolean {
    return this.configService.save(dto);
  }

  @Post('store')
  saveStore(@Body() dto: StoreDto): { id: number } {
    const item = this.storeService.create(dto);

    return {
      id: item.id,
    };
  }

  @Get('stores')
  stores(): StoreType[] {
    return this.storeRepository.findAll();
  }

  @Get('store/:storeId')
  store(@Param('storeId', ParseIntPipe) storeId: number): StoreType {
    return this.storeRepository.findOneByIdOrFail(storeId);
  }

  @Post('store/:storeId/payment')
  payment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: PaymentDto,
  ): { id: number } {
    const store = this.storeRepository.findOneByIdOrFail(storeId);
    const item = this.paymentService.purchase(store, dto);
    this.storeRepository.blockBalance(store.id, item.amountAfterFee);

    return {
      id: item.id,
    };
  }

  @Get('store/:storeId/payments')
  getPayments(@Param('storeId', ParseIntPipe) storeId: number): PaymentType[] {
    return this.paymentService.payments(storeId);
  }

  @Get('store/:storeId/payment/:paymentId')
  getPayment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): PaymentType {
    return this.paymentRepository.findOneByIdAndStoreIdOrFail({
      paymentId,
      storeId,
    });
  }

  @Post('store/:storeId/processed')
  processed(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('ids', new ParseArrayPipe({ items: Number }))
    paymentIds: number[],
  ) {
    const store = this.storeRepository.findOneByIdOrFail(storeId);
    const amount = this.paymentService.processed(store, paymentIds);
    this.storeRepository.unblockBalance(store.id, amount);

    return {
      status: true,
      amount,
    };
  }

  @Post('store/:storeId/rejected')
  reject(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('ids', new ParseArrayPipe({ items: Number }))
    paymentIds: number[],
  ) {
    const store = this.storeRepository.findOneByIdOrFail(storeId);
    const amount = this.paymentService.rejected(store, paymentIds);
    this.storeRepository.rejectBalance(store.id, amount);

    return {
      status: true,
      amount,
    };
  }

  @Post('store/:storeId/completed')
  completed(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('ids', new ParseArrayPipe({ items: Number }))
    paymentIds: number[],
  ) {
    const store = this.storeRepository.findOneByIdOrFail(storeId);
    const amount = this.paymentService.completed(store, paymentIds);
    this.storeRepository.unblockBalance(store.id, amount);

    return {
      status: true,
    };
  }

  @Post('store/:storeId/payout')
  payout(@Param('storeId', ParseIntPipe) storeId: number) {
    const store = this.storeRepository.findOneByIdOrFail(storeId);
    if (!this.paymentService.isValidPayout(store)) {
      throw new BadRequestException('you can payout only one time per day');
    }

    const { ids, amount } = this.paymentService.payout(storeId);

    this.storeRepository.payout(store.id, amount);

    return {
      ids,
      amount,
    };
  }
}
