import { Event } from 'nostr-tools';
import { PaymentResponse } from '../VoltagePayments';

export interface NWCRequest {
  method: string;
  params: Record<string, any>;
}

export interface NWCResponse {
  result_type: string;
  error?: {
    code: string;
    message: string;
  } | null;
  result?: Record<string, any> | null;
}

export interface NWCNotification {
  notification_type: string;
  notification: Record<string, any>;
}

export interface NWCConfig {
  relayUrl: string;
  pubkey: string;
  secret: string;
  walletId: string;
}

export interface NWCInfo {
  alias: string;
  color: string;
  pubkey: string;
  network: string;
  methods: string[];
  notifications: string[];
}

// Command method types
export type PayInvoiceParams = {
  invoice: string;
  amount?: number;
};

export type MakeInvoiceParams = {
  amount: number;
  description?: string;
  description_hash?: string;
  expiry?: number;
};

export type GetBalanceParams = Record<string, never>;

export type GetInfoParams = Record<string, never>;

// Error codes from NIP-47
export enum NWCErrorCode {
  RATE_LIMITED = 'RATE_LIMITED',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RESTRICTED = 'RESTRICTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL = 'INTERNAL',
  OTHER = 'OTHER',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NOT_FOUND = 'NOT_FOUND'
}

// Event kinds from NIP-47
export enum NWCEventKind {
  INFO = 13194,
  REQUEST = 23194,
  RESPONSE = 23195,
  NOTIFICATION = 23196
}

// Supported methods
export const SUPPORTED_METHODS = [
  'pay_invoice',
  'make_invoice',
  'get_balance',
  'get_info'
] as const;

export type SupportedMethod = typeof SUPPORTED_METHODS[number];

// Supported notifications
export const SUPPORTED_NOTIFICATIONS = [
  'payment_received',
  'payment_sent'
] as const;

export type SupportedNotification = typeof SUPPORTED_NOTIFICATIONS[number]; 