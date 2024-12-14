import { BaseRepository } from './base.repository';
import { PaymentStatus, PaymentType, StoreType } from '../types';
import { NotFoundException } from '@nestjs/common';

export class PaymentRepository extends BaseRepository<PaymentType> {
  findManyByStoreId(storeId: number) {
    return this.items.filter((item) => item.storeId === storeId);
  }

  payout(storeId: number) {
    let amount = 0;
    const ids: number[] = [];
    this.items = this.items.map((item) => {
      if (
        item.storeId === storeId &&
        item.availableBalance > 0 &&
        (item.status == PaymentStatus.PROCESSED ||
          item.status == PaymentStatus.COMPLETED)
      ) {
        amount += item.availableBalance;
        ids.push(item.id);
        return { ...item, availableBalance: 0 };
      }
      return item;
    });

    return {
      amount,
      ids,
    };
  }

  findOneByIdAndStoreIdOrFail({
    paymentId,
    storeId,
  }: {
    paymentId: number;
    storeId: number;
  }): PaymentType {
    const item = this.items.find(
      (item) => item.id === paymentId && item.storeId === storeId,
    );
    if (!item) {
      throw new NotFoundException(`Item with id ${paymentId} not found`);
    }
    return item;
  }

  process(store: StoreType, ids: number[]) {
    let amount = 0;
    this.items = this.items.map((item) => {
      if (
        item.storeId == store.id &&
        ids.includes(item.id) &&
        item.status === PaymentStatus.RECEIVED
      ) {
        const availableBalance = item.amountAfterFee - item.blockedAmount;
        amount += availableBalance;
        return { ...item, availableBalance, status: PaymentStatus.PROCESSED };
      }
      return item;
    });

    return amount;
  }

  compete(store: StoreType, ids: number[]) {
    let amount = 0;
    this.items = this.items.map((item) => {
      if (
        item.storeId == store.id &&
        ids.includes(item.id) &&
        item.status === PaymentStatus.PROCESSED
      ) {
        const availableBalance = item.availableBalance + item.blockedAmount;
        amount += item.blockedAmount;
        return {
          ...item,
          status: PaymentStatus.COMPLETED,
          availableBalance,
          blockedAmount: 0,
        };
      }
      return item;
    });
    return amount;
  }

  rejected(store: StoreType, ids: number[]) {
    let amount = 0;
    this.items = this.items.map((item) => {
      if (
        item.storeId == store.id &&
        ids.includes(item.id) &&
        item.status === PaymentStatus.RECEIVED
      ) {
        amount += item.amountAfterFee;
        return {
          ...item,
          status: PaymentStatus.REJECTED,
          availableBalance: 0,
          blockedAmount: 0,
        };
      }
      return item;
    });
    return amount;
  }
}
