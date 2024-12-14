import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class StoreService {
  private items: StoreType[] = [];
  private nextId = 0;

  findOneByIdOrFail(id: number): StoreType {
    const store = this.items.find((item) => item.id === id);
    if (!store) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    return store;
  }

  create(dto: Omit<StoreType, 'id' | 'balance'>) {
    const store: StoreType = {
      ...dto,
      id: ++this.nextId,
      balance: 0,
    };
    this.items.push(store);

    return store.id;
  }
}

type StoreType = { id: number; name: string; domain: string; balance: number };
