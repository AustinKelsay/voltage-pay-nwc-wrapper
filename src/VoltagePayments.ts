/**
 * VoltagePayments Class
 * 
 * A TypeScript wrapper for the Voltage API that handles Lightning Network payments.
 * Key features:
 * 
 * 1. Authentication:
 *    - Uses API key for all requests
 *    - Handles organization and environment context
 * 
 * 2. Payment Operations:
 *    - Create payment requests (receive)
 *    - Send payments
 *    - Monitor payment status
 * 
 * 3. Error Handling:
 *    - Retries on 404 (resource not ready)
 *    - Proper error messages
 *    - Type safety with TypeScript
 * 
 * 4. Status Management:
 *    - Polls for payment status changes
 *    - Handles 202 Accepted responses
 *    - Waits for payment_request to be available
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration interface for VoltagePayments
 */
interface VoltageConfig {
  apiKey: string;
  organizationId: string;
  environmentId: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Payment data structure for API requests/responses
 */
interface PaymentData {
  amount_msats: number;
  max_fee_msats?: number;
  payment_request?: string;
  memo?: string;
}

/**
 * Payment response structure from the API
 */
export interface PaymentResponse {
  bip21_uri?: string;
  created_at: string;
  currency: string;
  data: PaymentData;
  direction: 'send' | 'receive';
  environment_id: string;
  error: string | null;
  id: string;
  organization_id: string;
  status: 'sending' | 'receiving' | 'completed' | 'failed';
  type: 'bolt11';
  payment_kind?: 'bolt11';
  updated_at: string;
  wallet_id: string;
}

export class VoltagePayments {
  private readonly apiKey: string;
  private readonly organizationId: string;
  private readonly environmentId: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  /**
   * Initialize VoltagePayments with configuration
   * @param config Configuration object containing API credentials and settings
   */
  constructor(config: VoltageConfig) {
    this.apiKey = config.apiKey;
    this.organizationId = config.organizationId;
    this.environmentId = config.environmentId;
    this.baseUrl = config.baseUrl || 'https://voltageapi.com/v1';
    this.maxRetries = config.maxRetries || 30;
    this.retryDelay = config.retryDelay || 2000;

    // Debug log the configuration (without sensitive data)
    console.log('VoltagePayments initialized with:', {
      hasApiKey: !!this.apiKey,
      organizationId: this.organizationId,
      environmentId: this.environmentId,
      baseUrl: this.baseUrl,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    });
  }

  /**
   * Fetch data from the API with retry logic
   * 
   * Key features:
   * - Retries on 404 (resource not ready)
   * - Adds API key to headers
   * - Handles errors with proper logging
   * 
   * @param url The API endpoint URL
   * @param options Fetch options (method, headers, body)
   * @param retryCount Current retry attempt number
   * @returns Promise resolving to the API response
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      console.log('fetching with retry', url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-api-key': this.apiKey,
        },
      });

      // Retry on 404 (resource not ready)
      if (response.status === 404 && retryCount < this.maxRetries) {
        console.log(`404 response, retrying (${retryCount + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Error fetching with retry:', error);
      if (retryCount < this.maxRetries) {
        console.log(`Retrying (${retryCount + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Get the API URL for payment operations
   * @param paymentId Optional payment ID for specific payment operations
   * @returns The complete API URL
   */
  private getPaymentUrl(paymentId?: string): string {
    const base = `${this.baseUrl}/organizations/${this.organizationId}/environments/${this.environmentId}/payments`;
    return paymentId ? `${base}/${paymentId}` : base;
  }

  /**
   * Create a payment request to receive funds
   * 
   * Flow:
   * 1. Create payment request
   * 2. Wait for payment_request to be available
   * 3. Return payment details
   * 
   * @param params Payment request parameters
   * @returns Promise resolving to payment details
   */
  async createPaymentRequest(params: {
    amount_msats: number;
    wallet_id: string;
    description?: string;
    max_fee_msats?: number;
  }): Promise<PaymentResponse> {
    const paymentId = uuidv4();
    const url = this.getPaymentUrl();

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: paymentId,
        amount_msats: params.amount_msats,
        currency: 'btc',
        description: params.description,
        payment_kind: 'bolt11',
        wallet_id: params.wallet_id,
        max_fee_msats: params.max_fee_msats,
      }),
    });

    // The API returns 202 Accepted with no body
    if (response.status === 202) {
      // Poll for the payment details until we get the payment_request
      let attempts = 0;
      while (attempts < this.maxRetries) {
        const payment = await this.getPayment(paymentId);
        console.log('payment', payment);
        
        if (payment.data.payment_request) {
          return payment;
        }
        
        console.log(`Waiting for payment request (${attempts + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        attempts++;
      }
      
      throw new Error('Timeout waiting for payment request to be generated');
    }

    return response.json();
  }

  /**
   * Send a payment using a BOLT11 invoice
   * 
   * @param params Payment parameters including invoice and amount
   * @returns Promise resolving to payment details
   */
  async sendPayment(params: {
    wallet_id: string;
    payment_request: string;
    amount_msats: number;
    max_fee_msats?: number;
  }): Promise<PaymentResponse> {
    const paymentId = uuidv4();
    const url = this.getPaymentUrl();

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: paymentId,
        wallet_id: params.wallet_id,
        currency: 'btc',
        type: 'bolt11',
        data: {
          amount_msats: params.amount_msats,
          max_fee_msats: params.max_fee_msats,
          payment_request: params.payment_request,
        },
      }),
    });

    // The API returns 202 Accepted with no body
    if (response.status === 202) {
      // Poll for the payment details
      return this.getPayment(paymentId);
    }

    return response.json();
  }

  /**
   * Get payment details by ID
   * @param paymentId The payment ID to fetch
   * @returns Promise resolving to payment details
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    const url = this.getPaymentUrl(paymentId);
    const response = await this.fetchWithRetry(url, {
      method: 'GET',
    });
    return response.json();
  }

  /**
   * Poll payment status until completion or failure
   * 
   * @param paymentId The payment ID to monitor
   * @param onStatusUpdate Optional callback for status updates
   * @returns Promise resolving to final payment details
   */
  async pollPaymentStatus(
    paymentId: string,
    onStatusUpdate?: (status: PaymentResponse['status']) => void
  ): Promise<PaymentResponse> {
    let payment: PaymentResponse;
    let attempts = 0;

    while (attempts < this.maxRetries) {
      payment = await this.getPayment(paymentId);

      if (onStatusUpdate) {
        onStatusUpdate(payment.status);
      }

      if (payment.status === 'completed' || payment.status === 'failed') {
        return payment;
      }

      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      attempts++;
    }

    throw new Error(`Payment status polling timed out after ${this.maxRetries} attempts`);
  }
} 