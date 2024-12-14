import { BaseRepository } from './base.repository';
import { StoreType } from '../types';

export class StoreRepository extends BaseRepository<StoreType> {
  blockBalance(storeId: number, amount: number) {
    this.items = this.items.map((item) =>
      item.id === storeId
        ? {
            ...item,
            blockedBalance: item.blockedBalance + amount,
          }
        : item,
    );
  }

  unblockBalance(storeId: number, amount: number) {
    this.items = this.items.map((item) =>
      item.id === storeId
        ? {
            ...item,
            availableBalance: item.availableBalance + amount,
            blockedBalance: item.blockedBalance - amount,
          }
        : item,
    );
  }

  rejectBalance(storeId: number, amount: number) {
    this.items = this.items.map((item) =>
      item.id === storeId
        ? {
            ...item,
            blockedBalance: item.blockedBalance - amount,
          }
        : item,
    );
  }

  payout(storeId: number, amount: number) {
    this.items = this.items.map((item) =>
      item.id === storeId
        ? {
            ...item,
            availableBalance: item.availableBalance - amount,
            lastPaymentAt: new Date(),
          }
        : item,
    );
  }
}
