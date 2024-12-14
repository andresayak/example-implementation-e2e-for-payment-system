import { IsNotEmpty } from 'class-validator';
import { ConfigType } from '../types';

export class ConfigDto implements ConfigType {
  @IsNotEmpty()
  fixedFee: number;

  @IsNotEmpty()
  feeRate: number;

  @IsNotEmpty()
  blockRate: number;
}
