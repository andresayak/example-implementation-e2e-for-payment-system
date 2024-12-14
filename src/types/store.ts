export type StoreType = {
  id: number;
  name: string;
  feeRate: number;
  availableBalance: number;
  blockedBalance: number;
  lastPaymentAt?: Date;
};
