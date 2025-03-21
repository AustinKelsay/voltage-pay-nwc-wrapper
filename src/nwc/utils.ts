import { Event, finalizeEvent } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Creates and signs a nostr event
 */
export function createSignedEvent(
  kind: number,
  content: string,
  tags: string[][],
  privateKey: string
): Event {
  // Convert private key from hex to Uint8Array
  const secretKey = Buffer.from(privateKey, 'hex');

  // Create the event template
  const event = {
    kind,
    content,
    tags,
    created_at: Math.floor(Date.now() / 1000),
    pubkey: '', // This will be set by finalizeEvent
  };

  // Use finalizeEvent to create and sign the event
  return finalizeEvent(event, secretKey);
} 