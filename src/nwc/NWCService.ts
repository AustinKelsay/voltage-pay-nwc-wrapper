import { SimplePool, getPublicKey, nip04, Event, Relay } from 'nostr-tools';
import { VoltagePayments } from '../VoltagePayments';
import { createSignedEvent } from './utils';
import {
  NWCConfig,
  NWCRequest,
  NWCResponse,
  NWCNotification,
  NWCEventKind,
  NWCErrorCode,
  SUPPORTED_METHODS,
  SUPPORTED_NOTIFICATIONS,
  PayInvoiceParams,
  MakeInvoiceParams,
  GetBalanceParams,
  GetInfoParams
} from './types';

export class NWCService {
  private pool: SimplePool;
  private config: NWCConfig;
  private voltage: VoltagePayments;
  private pubkey: string;
  private relay?: Relay;

  constructor(voltage: VoltagePayments, config: NWCConfig) {
    this.voltage = voltage;
    this.config = config;
    this.pool = new SimplePool();
    this.pubkey = config.pubkey;
  }

  /**
   * Initialize the NWC service and start listening for events
   */
  async init(): Promise<void> {
    // Connect to relay
    this.relay = await this.pool.ensureRelay(this.config.relayUrl);

    // Subscribe to requests
    this.relay.subscribe([{
      kinds: [NWCEventKind.REQUEST],
      '#p': [this.config.pubkey]
    }], {
      onevent: async (event: Event) => {
        try {
          const decrypted = await nip04.decrypt(
            Buffer.from(this.config.secret, 'hex'),
            event.pubkey,
            event.content
          );
          const request: NWCRequest = JSON.parse(decrypted);
          await this.handleRequest(event, request);
        } catch (error) {
          console.error('Error handling request:', error);
          await this.sendError(event, NWCErrorCode.INTERNAL, 'Internal error processing request');
        }
      }
    });

    // Publish info event
    await this.publishInfoEvent();
  }

  /**
   * Publish the NIP-47 info event
   */
  private async publishInfoEvent(): Promise<void> {
    const event = createSignedEvent(
      NWCEventKind.INFO,
      SUPPORTED_METHODS.join(' '),
      [['notifications', SUPPORTED_NOTIFICATIONS.join(' ')]],
      this.config.secret
    );

    if (this.relay) {
      await this.relay.publish(event);
    }
  }

  /**
   * Handle incoming NWC requests
   */
  private async handleRequest(event: Event, request: NWCRequest): Promise<void> {
    if (!SUPPORTED_METHODS.includes(request.method as any)) {
      await this.sendError(event, NWCErrorCode.NOT_IMPLEMENTED, `Method ${request.method} not supported`);
      return;
    }

    try {
      let result: Record<string, any>;

      switch (request.method) {
        case 'pay_invoice':
          result = await this.handlePayInvoice(request.params as PayInvoiceParams);
          break;
        case 'make_invoice':
          result = await this.handleMakeInvoice(request.params as MakeInvoiceParams);
          break;
        case 'get_balance':
          result = await this.handleGetBalance(request.params as GetBalanceParams);
          break;
        case 'get_info':
          result = await this.handleGetInfo(request.params as GetInfoParams);
          break;
        default:
          throw new Error(`Unhandled method: ${request.method}`);
      }

      await this.sendResponse(event, request.method, result);
    } catch (error) {
      if (error instanceof Error) {
        await this.sendError(event, NWCErrorCode.INTERNAL, error.message);
      } else {
        await this.sendError(event, NWCErrorCode.INTERNAL, 'Unknown error occurred');
      }
    }
  }

  /**
   * Send a response event
   */
  private async sendResponse(requestEvent: Event, method: string, result: Record<string, any>): Promise<void> {
    const response: NWCResponse = {
      result_type: method,
      error: null,
      result
    };

    const encrypted = await nip04.encrypt(
      Buffer.from(this.config.secret, 'hex'),
      requestEvent.pubkey,
      JSON.stringify(response)
    );

    const event = createSignedEvent(
      NWCEventKind.RESPONSE,
      encrypted,
      [
        ['p', requestEvent.pubkey],
        ['e', requestEvent.id]
      ],
      this.config.secret
    );

    if (this.relay) {
      await this.relay.publish(event);
    }
  }

  /**
   * Send an error response
   */
  private async sendError(requestEvent: Event, code: NWCErrorCode, message: string): Promise<void> {
    const response: NWCResponse = {
      result_type: 'error',
      error: { code, message },
      result: null
    };

    const encrypted = await nip04.encrypt(
      Buffer.from(this.config.secret, 'hex'),
      requestEvent.pubkey,
      JSON.stringify(response)
    );

    const event = createSignedEvent(
      NWCEventKind.RESPONSE,
      encrypted,
      [
        ['p', requestEvent.pubkey],
        ['e', requestEvent.id]
      ],
      this.config.secret
    );

    if (this.relay) {
      await this.relay.publish(event);
    }
  }

  /**
   * Send a notification event
   */
  private async sendNotification(clientPubkey: string, type: string, data: Record<string, any>): Promise<void> {
    const notification: NWCNotification = {
      notification_type: type,
      notification: data
    };

    const encrypted = await nip04.encrypt(
      Buffer.from(this.config.secret, 'hex'),
      clientPubkey,
      JSON.stringify(notification)
    );

    const event = createSignedEvent(
      NWCEventKind.NOTIFICATION,
      encrypted,
      [['p', clientPubkey]],
      this.config.secret
    );

    if (this.relay) {
      await this.relay.publish(event);
    }
  }

  /**
   * Handle pay_invoice command
   */
  private async handlePayInvoice(params: PayInvoiceParams): Promise<Record<string, any>> {
    const payment = await this.voltage.sendPayment({
      wallet_id: this.config.walletId,
      payment_request: params.invoice,
      amount_msats: params.amount || 0
    });

    return {
      preimage: payment.data.payment_request,
      fees_paid: payment.data.amount_msats
    };
  }

  /**
   * Handle make_invoice command
   */
  private async handleMakeInvoice(params: MakeInvoiceParams): Promise<Record<string, any>> {
    const payment = await this.voltage.createPaymentRequest({
      amount_msats: params.amount,
      wallet_id: this.config.walletId,
      description: params.description
    });

    return {
      type: 'incoming',  // Required by NIP-47 spec
      invoice: payment.data.payment_request,
      description: params.description,
      description_hash: params.description_hash,
      payment_hash: payment.id,
      amount: params.amount,
      created_at: Math.floor(new Date(payment.created_at).getTime() / 1000),
      expires_at: params.expiry ? Math.floor(new Date(payment.created_at).getTime() / 1000) + params.expiry : undefined,
      metadata: {}  // Optional metadata field
    };
  }

  /**
   * Handle get_balance command
   */
  private async handleGetBalance(_params: GetBalanceParams): Promise<Record<string, any>> {
    // TODO: Implement get_balance when available in VoltagePayments
    return {
      balance: 0 // Placeholder
    };
  }

  /**
   * Handle get_info command
   */
  private async handleGetInfo(_params: GetInfoParams): Promise<Record<string, any>> {
    return {
      alias: 'Voltage Pay NWC',
      color: '#ff9500',
      pubkey: this.config.pubkey,
      network: 'mainnet',
      methods: SUPPORTED_METHODS,
      notifications: SUPPORTED_NOTIFICATIONS
    };
  }
} 