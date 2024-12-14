export enum PaymentStatus {
  RECEIVED = 'received',
  PROCESSED = 'processed',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export type PaymentType = {
  id: number;
  storeId: number;
  amount: number;

  feeAmounts: {
    fixed: number; // A
    system: number; // B
    store: number; // C
  };
  amountAfterFee: number;
  availableBalance: number;
  blockedAmount: number; // D
  status: PaymentStatus;
  createdAt: Date;
  lastPaydAt?: Date;
};
