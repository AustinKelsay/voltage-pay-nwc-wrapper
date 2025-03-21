/**
 * Voltage Pay NWC Wrapper Example
 * 
 * This example demonstrates how to use the Voltage Pay NWC wrapper to create a Nostr Wallet Connect service.
 * Key features:
 * 
 * 1. NWC Service Setup:
 *    - Generates NWC keys
 *    - Connects to Nostr relay
 *    - Publishes info event
 * 
 * 2. Request Handling:
 *    - Listens for encrypted NWC requests
 *    - Processes payment operations
 *    - Sends encrypted responses
 * 
 * 3. Configuration:
 *    - Uses environment variables
 *    - Supports custom relay URLs
 *    - Handles graceful shutdown
 */

import { VoltagePayments } from './VoltagePayments';
import { NWCService } from './nwc/NWCService';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { config } from './config';
import { bytesToHex } from '@noble/hashes/utils';

async function main() {
  try {
    // Debug log the actual values we're using
    console.log('Using config values:', {
      apiKey: config.voltage.apiKey?.slice(0, 8) + '...',
      organizationId: config.voltage.organizationId,
      environmentId: config.voltage.environmentId,
    });

    // Initialize Voltage client
    const voltage = new VoltagePayments({
      apiKey: config.voltage.apiKey!,
      organizationId: config.voltage.organizationId!,
      environmentId: config.voltage.environmentId!,
    });

    // Generate NWC keys
    const secretKey = generateSecretKey();
    const pubkey = getPublicKey(secretKey);
    const secret = bytesToHex(secretKey);

    // Debug log the NWC keys
    console.log('Generated NWC keys:', {
      pubkey,
      secret: secret.slice(0, 8) + '...',
    });

    // Initialize NWC service
    const nwc = new NWCService(voltage, {
      relayUrl: 'wss://relay.damus.io',
      pubkey,
      secret,
      walletId: config.voltage.walletId!
    });

    // Start the service
    await nwc.init();

    // Generate NWC URI
    const uri = `nostr+walletconnect://${pubkey}?relay=${encodeURIComponent('wss://relay.damus.io')}&secret=${secret}`;
    console.log('NWC URI:', uri);

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('Shutting down...');
      process.exit(0);
    });

    console.log('NWC service running. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 