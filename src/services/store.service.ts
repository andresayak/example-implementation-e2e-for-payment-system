import { Injectable } from '@nestjs/common';
import { StoreRepository } from '../repositories';
import { StoreType } from '../types';

@Injectable()
export class StoreService {
  constructor(private readonly repository: StoreRepository) {}

  create(dto: Pick<StoreType, 'name' | 'feeRate'>) {
    return this.repository.create({
      ...dto,
      availableBalance: 0,
      blockedBalance: 0,
    });
  }
}
