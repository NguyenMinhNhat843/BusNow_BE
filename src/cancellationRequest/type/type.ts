export const REFUND_STATUS = {
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
  REJECTED: 'REJECTED',
} as const;
export type RefundStatusType =
  (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];
