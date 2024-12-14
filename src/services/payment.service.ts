import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private items: PaymentType[] = [];
  private nextId = 0;

  findOneByIdOrFail(id: number): PaymentType {
    const store = this.items.find((item) => item.id === id);
    if (!store) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    return store;
  }

  purchase(storeId: number, dto: Pick<PaymentType, 'amount' | 'price'>) {
    const item: PaymentType = {
      ...dto,
      storeId,
      total: dto.amount * dto.price,
      id: ++this.nextId,
      status: PaymentStatus.NEW,
    };
    this.items.push(item);

    return item.id;
  }

  payments(storeId: number): PaymentType[] {
    return this.items.filter((item) => item.id === storeId);
  }

  update(ids: number[], status: PaymentStatus) {
    this.items = this.items.map((item) =>
      ids.includes(item.id) ? { ...item, status } : item,
    );
  }

  complete(ids: number[]) {
    return this.update(ids, PaymentStatus.COMPLETED);
  }

  payout(storeId: number) {
    return true;
  }
}

enum PaymentStatus {
  NEW = 'new',
  COMPLETED = 'completed',
}

export type PaymentType = {
  id: number;
  storeId: number;
  amount: number;
  price: number;
  total: number;
  status: PaymentStatus;
};
