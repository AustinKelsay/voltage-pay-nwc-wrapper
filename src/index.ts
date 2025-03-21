/**
 * Voltage Payments CLI
 * 
 * This CLI application demonstrates how to interact with the Voltage API for Lightning Network payments.
 * Key learnings from this implementation:
 * 
 * 1. BOLT11 Invoice Handling:
 *    - BOLT11 invoices encode amounts in millisatoshis directly
 *    - We use light-bolt11-decoder to properly parse invoices instead of regex
 *    - Amount should only be included in send payment if invoice has no amount (rare)
 * 
 * 2. Payment Flow:
 *    - Receive: Create request -> Get BOLT11 -> Wait for payment
 *    - Send: Parse BOLT11 -> Send payment -> Wait for confirmation
 * 
 * 3. Status Management:
 *    - Payments go through states: sending/receiving -> completed/failed
 *    - We poll the API to track status changes
 *    - Status updates are shown with emojis for better UX
 */

import { config } from './config';
import { VoltagePayments } from './VoltagePayments';
import readline from 'readline';
import { decode, Section } from 'light-bolt11-decoder';

interface Bolt11Section {
  name: string;
  letters: string;
  value?: string | number | any;
  tag?: string;
}

// Create readline interface for CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize VoltagePayments with config from environment
const voltage = new VoltagePayments({
  apiKey: config.voltage.apiKey as string,
  organizationId: config.voltage.organizationId as string,
  environmentId: config.voltage.environmentId as string,
});

/**
 * Helper function to get user input
 * @param query The question to ask the user
 * @returns Promise resolving to user's answer
 */
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

/**
 * Handle receiving a payment
 * 
 * Flow:
 * 1. Get amount from user (in sats)
 * 2. Create payment request
 * 3. Display BOLT11 invoice and BIP21 URI
 * 4. Poll for payment status
 */
async function receivePayment() {
  try {
    // Get amount from user and convert to millisatoshis
    const amount = await question('Enter amount in sats: ');
    const amountMsats = parseInt(amount) * 1000;

    // Get optional max fee
    const maxFee = await question('Enter max fee in sats (optional, press enter to skip): ');
    const maxFeeMsats = maxFee ? parseInt(maxFee) * 1000 : undefined;

    console.log('\nCreating payment request...');
    const payment = await voltage.createPaymentRequest({
      amount_msats: amountMsats,
      wallet_id: config.voltage.walletId as string,
      description: 'CLI payment request',
      max_fee_msats: maxFeeMsats,
    });

    // Display payment details for the user
    console.log('\nPayment request created!');
    console.log('BOLT11 Invoice:', payment.data.payment_request);
    console.log('BIP21 URI:', payment.bip21_uri);
    if (maxFeeMsats) {
      console.log('Max Fee:', maxFeeMsats / 1000, 'sats');
    }

    // Monitor payment status with visual feedback
    console.log('\nWaiting for payment to be received...');
    const result = await voltage.pollPaymentStatus(payment.id, (status) => {
      const statusEmoji = {
        receiving: '⏳',
        sending: '📤',
        completed: '✅',
        failed: '❌',
      }[status];
      console.log(`Status: ${statusEmoji} ${status}`);
    });

    // Show final result
    if (result.status === 'completed') {
      console.log('\n✨ Payment received successfully!');
    } else {
      console.log('\n❌ Payment failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Handle sending a payment
 * 
 * Flow:
 * 1. Get BOLT11 invoice from user
 * 2. Decode invoice to get amount (if present)
 * 3. Send payment with appropriate parameters
 * 4. Poll for payment status
 * 
 * Key points:
 * - We use light-bolt11-decoder to properly parse the invoice
 * - Amount is only included if the invoice has one
 * - The amount in BOLT11 is already in millisatoshis
 */
async function sendPayment() {
  try {
    const bolt11 = await question('Enter BOLT11 invoice: ');
    
    // Decode the BOLT11 invoice to get structured data
    const decoded = decode(bolt11);
    
    // Find the amount section in the decoded invoice
    const amountSection = decoded.sections.find((s: Section) => s.name === 'amount');
    if (!amountSection || !('value' in amountSection)) {
      throw new Error('Invalid BOLT11 invoice: no amount found');
    }

    // The amount is already in millisatoshis in the BOLT11 format
    const amountMsats = parseInt(amountSection.value as string);

    console.log('\nSending payment...');
    console.log('Amount (msats):', amountMsats);
    
    // Prepare payment data - only include amount if invoice has one
    const paymentData: any = {
      wallet_id: config.voltage.walletId as string,
      payment_request: bolt11,
    };

    // Only include amount_msats if the invoice has an amount
    // This is important because some invoices might have no amount (rare)
    if (amountMsats > 0) {
      paymentData.amount_msats = amountMsats;
    }
    
    const payment = await voltage.sendPayment(paymentData);

    // Monitor payment status with visual feedback
    console.log('\nPayment initiated!');
    console.log('Waiting for confirmation...');
    
    const result = await voltage.pollPaymentStatus(payment.id, (status) => {
      const statusEmoji = {
        sending: '📤',
        receiving: '⏳',
        completed: '✅',
        failed: '❌',
      }[status];
      console.log(`Status: ${statusEmoji} ${status}`);
    });

    // Show final result
    if (result.status === 'completed') {
      console.log('\n✨ Payment sent successfully!');
    } else {
      console.log('\n❌ Payment failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Main CLI entry point
 * Provides menu options for sending or receiving payments
 */
async function main() {
  console.log('Voltage Payments CLI');
  console.log('-------------------');
  console.log('1. Receive Payment');
  console.log('2. Send Payment');
  console.log('3. Exit');

  const choice = await question('\nSelect an option (1-3): ');

  switch (choice) {
    case '1':
      await receivePayment();
      break;
    case '2':
      await sendPayment();
      break;
    case '3':
      console.log('Goodbye!');
      break;
    default:
      console.log('Invalid option');
  }

  rl.close();
}

main().catch(console.error); 