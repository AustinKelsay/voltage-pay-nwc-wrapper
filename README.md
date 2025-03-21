# Voltage Pay NWC Wrapper

A TypeScript wrapper for integrating Voltage Pay with Nostr Wallet Connect (NIP-47).

## Features

- Full NIP-47 support
- Integration with Voltage Pay API
- Real-time payment notifications
- TypeScript support
- Easy-to-use interface

## Installation

```bash
npm install nostr-tools @noble/hashes
```

## Configuration

Create a `.env` file with your Voltage Pay credentials:

```env
VOLTAGE_API_KEY=your_api_key
VOLTAGE_ORG_ID=your_org_id
VOLTAGE_ENV_ID=your_env_id
VOLTAGE_WALLET_ID=your_wallet_id
```

## Usage

```typescript
import { VoltagePayments } from './src/VoltagePayments';
import { NWCService } from './src/nwc/NWCService';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

// Initialize Voltage client
const voltage = new VoltagePayments({
  apiKey: process.env.VOLTAGE_API_KEY!,
  organizationId: process.env.VOLTAGE_ORG_ID!,
  environmentId: process.env.VOLTAGE_ENV_ID!
});

// Generate NWC keys
const secretKey = generateSecretKey();
const secret = bytesToHex(secretKey);
const pubkey = getPublicKey(secretKey);

// Initialize NWC service
const nwc = new NWCService(voltage, {
  relayUrl: 'wss://relay.damus.io',
  pubkey,
  secret,
  walletId: process.env.VOLTAGE_WALLET_ID!
});

// Start the service
await nwc.init();

// Get NWC URI for clients to connect
const uri = `nostr+walletconnect://${pubkey}?relay=${encodeURIComponent('wss://relay.damus.io')}&secret=${secret}`;
console.log('NWC URI:', uri);
```

## Supported Methods

The wrapper supports the following NIP-47 methods:

- `pay_invoice`: Pay a Lightning invoice
- `make_invoice`: Create a Lightning invoice
- `get_balance`: Get wallet balance
- `get_info`: Get wallet information

## Example Client Usage

After getting the NWC URI from the service, clients can connect and interact with the wallet:

```typescript
// Example of paying an invoice
const request = {
  method: 'pay_invoice',
  params: {
    invoice: 'lnbc...',
    amount: 1000 // Optional, in millisatoshis
  }
};

// The request will be encrypted and sent to the NWC service
// The service will process it and send back an encrypted response
```

## Development

To run the example:

```bash
npm install
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.