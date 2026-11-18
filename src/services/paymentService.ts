import {
  SubscriptionPlan,
  PaymentTransaction,
  UserSubscription,
  PaymentMethod,
  TransactionStatus
} from '../types';

const TRANSACTIONS_KEY = 'lionel_stream_transactions';
const USER_SUB_KEY = 'lionel_stream_user_subscription';

export interface PaymentRequest {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction: PaymentTransaction;
  subscription?: UserSubscription;
  message: string;
}

/**
 * Retrieves all payment transactions stored locally.
 */
export function getStoredTransactions(): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing stored transactions:', e);
    return [];
  }
}

/**
 * Saves or updates a transaction in local storage.
 */
export function saveTransaction(tx: PaymentTransaction): void {
  try {
    const list = getStoredTransactions();
    const index = list.findIndex((item) => item.id === tx.id);
    if (index >= 0) {
      list[index] = tx;
    } else {
      list.unshift(tx);
    }
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving transaction:', e);
  }
}

/**
 * Retrieves current active subscription for user.
 */
export function getStoredUserSubscription(userId: string): UserSubscription | null {
  try {
    const raw = localStorage.getItem(`${USER_SUB_KEY}_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Saves subscription to local storage.
 */
export function saveUserSubscription(sub: UserSubscription): void {
  try {
    localStorage.setItem(`${USER_SUB_KEY}_${sub.userId}`, JSON.stringify(sub));
  } catch (e) {
    console.error('Error saving user subscription:', e);
  }
}

/**
 * Processes a subscription checkout for MTN Mobile Money, Airtel Money, or Card payments.
 * Simulates high-reliability mobile money push prompt / card gateway and returns provisioned subscription.
 */
export async function processSubscriptionPayment(request: PaymentRequest): Promise<PaymentResult> {
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date();
  
  // Generate provider specific payment reference
  let paymentReference = '';
  if (request.paymentMethod === 'MTN_MOMO') {
    paymentReference = `MOMO-RW-${Math.floor(100000 + Math.random() * 900000)}`;
  } else if (request.paymentMethod === 'AIRTEL_MONEY') {
    paymentReference = `AIRTEL-RW-${Math.floor(100000 + Math.random() * 900000)}`;
  } else {
    paymentReference = `CARD-${Math.floor(10000000 + Math.random() * 90000000)}`;
  }

  const initialTx: PaymentTransaction = {
    id: txId,
    userId: request.userId,
    userName: request.userName,
    userEmail: request.userEmail,
    userPhone: request.userPhone,
    planId: request.plan.id,
    planName: request.plan.name,
    amount: request.plan.price,
    currency: request.plan.currency,
    paymentMethod: request.paymentMethod,
    paymentReference,
    status: 'PENDING',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  saveTransaction(initialTx);

  // Simulate network request & mobile money gateway approval (1.5 seconds)
  await new Promise((res) => setTimeout(res, 1500));

  // Compute expiry date based on plan duration
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (request.plan.durationDays || 30));

  const completedTx: PaymentTransaction = {
    ...initialTx,
    status: 'SUCCESS',
    updatedAt: new Date().toISOString()
  };
  saveTransaction(completedTx);

  const newSubscription: UserSubscription = {
    id: `sub_${Date.now()}`,
    userId: request.userId,
    planId: request.plan.id,
    planName: request.plan.name,
    status: 'ACTIVE',
    startDate: now.toISOString(),
    expiryDate: expiry.toISOString(),
    paymentMethod: request.paymentMethod,
    autoRenew: true
  };

  saveUserSubscription(newSubscription);

  return {
    success: true,
    transaction: completedTx,
    subscription: newSubscription,
    message: `Payment successful! Your ${request.plan.name} subscription is now active.`
  };
}
