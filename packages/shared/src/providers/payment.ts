import type { UserPlan } from '../types/user.js';

export interface PaymentProvider {
  startCheckout(plan: 'premium'): Promise<void>;
  getStatus(): Promise<UserPlan>;
  /** Mobile only: restore prior in-app purchases */
  restorePurchases(): Promise<void>;
}
