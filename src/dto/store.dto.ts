import { IsNotEmpty } from 'class-validator';
import { StoreType } from '../types';

export class StoreDto implements Pick<StoreType, 'name' | 'feeRate'> {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  feeRate: number;
}
