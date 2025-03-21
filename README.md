# Voltage Payments API Wrapper

A TypeScript wrapper for the Voltage Payments API that handles retries, polling, and error handling.

## Installation

```bash
npm install voltage-pay-nwc-wrapper
```

## Usage

```typescript
import { VoltagePayments } from 'voltage-pay-nwc-wrapper';

// Initialize the client
const voltage = new VoltagePayments({
  apiKey: 'your-api-key',
  organizationId: 'your-organization-id',
  environmentId: 'your-environment-id',
  // Optional configuration
  maxRetries: 10, // Default: 10
  retryDelay: 1000, // Default: 1000ms
});

// Create a payment request (receive payment)
const paymentRequest = await voltage.createPaymentRequest({
  amount_msats: 10000, // 10 sats
  wallet_id: 'your-wallet-id',
  description: 'Test payment',
});

// Send a payment
const payment = await voltage.sendPayment({
  wallet_id: 'your-wallet-id',
  payment_request: 'lntbs1500n1p...', // Lightning invoice
  amount_msats: 150000, // 150 sats
  max_fee_msats: 1000, // Optional: max routing fee
});

// Poll payment status with callback
const result = await voltage.pollPaymentStatus(payment.id, (status) => {
  console.log(`Payment status: ${status}`);
});

// Get payment details
const paymentDetails = await voltage.getPayment(payment.id);
```

## Features

- Automatic retry logic for failed requests
- Built-in polling for payment status
- TypeScript support with full type definitions
- Handles 202 Accepted responses with automatic polling
- Configurable retry attempts and delay
- Error handling and status monitoring

## API Reference

### Constructor

```typescript
new VoltagePayments(config: {
  apiKey: string;
  organizationId: string;
  environmentId: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
})
```

### Methods

#### createPaymentRequest

Creates a new payment request (receive payment).

```typescript
createPaymentRequest(params: {
  amount_msats: number;
  wallet_id: string;
  description?: string;
}): Promise<PaymentResponse>
```

#### sendPayment

Sends a payment using a Lightning invoice.

```typescript
sendPayment(params: {
  wallet_id: string;
  payment_request: string;
  amount_msats: number;
  max_fee_msats?: number;
}): Promise<PaymentResponse>
```

#### getPayment

Retrieves payment details by ID.

```typescript
getPayment(paymentId: string): Promise<PaymentResponse>
```

#### pollPaymentStatus

Polls payment status until completion or failure.

```typescript
pollPaymentStatus(
  paymentId: string,
  onStatusUpdate?: (status: PaymentResponse['status']) => void
): Promise<PaymentResponse>
```

## License

MIT