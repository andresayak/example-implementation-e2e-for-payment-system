import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  config: ConfigType = {
    fixedFee: 0,
    feeRate: 0,
    duration: 0,
  };

  save(config: ConfigType) {
    this.config = config;

    return true;
  }
}

type ConfigType = { fixedFee: number; feeRate: number; duration: number };
