import { Injectable } from '@nestjs/common';
import { PaymentStatus, PaymentType, StoreType } from '../types';
import { PaymentRepository } from '../repositories';
import { ConfigService } from './config.service';
import * as moment from 'moment';

@Injectable()
export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly configService: ConfigService,
  ) {}

  purchase(store: StoreType, { amount }: Pick<PaymentType, 'amount'>) {
    const { feeRate, fixedFee, blockRate } = this.configService.config;

    const systemFeeAmount = (amount * feeRate) / 100;
    const storeFeeAmount = (amount * store.feeRate) / 100;
    const blockedAmount = (amount * blockRate) / 100;
    const amountAfterFee = amount - systemFeeAmount - storeFeeAmount - fixedFee;

    return this.repository.create({
      amount,
      storeId: store.id,
      status: PaymentStatus.RECEIVED,
      createdAt: new Date(),

      feeAmounts: {
        fixed: fixedFee, // A
        system: systemFeeAmount, // B
        store: storeFeeAmount, // C
      },
      availableBalance: 0,
      amountAfterFee,
      blockedAmount, // D
    });
  }

  payments(storeId: number): PaymentType[] {
    return this.repository.findManyByStoreId(storeId);
  }

  processed(store: StoreType, ids: number[]): number {
    return this.repository.process(store, ids);
  }

  completed(store: StoreType, ids: number[]): number {
    return this.repository.compete(store, ids);
  }

  rejected(store: StoreType, ids: number[]): number {
    return this.repository.rejected(store, ids);
  }

  payout(storeId: number) {
    return this.repository.payout(storeId);
  }

  isValidPayout(store: StoreType) {
    return (
      !store.lastPaymentAt ||
      moment().subtract(1, 'day').toDate() >= store.lastPaymentAt
    );
  }
}
