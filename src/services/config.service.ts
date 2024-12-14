import { Injectable } from '@nestjs/common';
import { ConfigType } from '../types';

@Injectable()
export class ConfigService {
  config: ConfigType = {
    fixedFee: 0,
    feeRate: 0,
    blockRate: 0,
  };

  save(config: ConfigType) {
    this.config = config;

    return true;
  }
}
