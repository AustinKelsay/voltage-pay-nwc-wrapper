[WIP] Voltage Payments Documentation



Search...
⌘
K
Developer Guide
19min
﻿
﻿
﻿

Introduction
The Voltage API enables you to integrate Lightning Network functionality into your applications. This guide will walk you through common tasks and help you get started with the API.

If you are starting here we are assuming that you already have a team and a staging wallet setup for you. If you do not, the Quick Start guide will get you setup.

﻿
Authentication
For Authenticated API calls you will need an x-api-key header.
Your key can be generated from the "API Keys" page in the dashboard

API Key (via x-api-key header)
Generating API Key
You can manage your API keys by visiting your team page and clicking on "API Keys"

﻿
Be sure to select the correct Environment for your API key when generating and give it a descriptive name.

﻿
Base URL
https://voltageapi.com/v1
﻿
Quick Start Guides
Receiving a payment
Create a new payment
curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments' \
  --request POST \
  --data '{
    "amount_msats": 10000,
    "currency": "btc",
    "description": "test payment",
    "id": "11ca843c-bdaa-44b6-965a-39ac550fcdf3",
    "payment_kind": "bolt11",
    "wallet_id": {wallet_id}
  }'
﻿
Fetch your created payment
curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}' \
  --request GET
﻿
Response
{
    "bip21_uri": "lightning:lntbs140n1pnag...",
    "created_at": "2025-03-14T16:08:11.692963Z",
    "currency": "btc",
    "data": {
        "amount_msats": 14000,
        "memo": "test payment",
        "payment_request": "lntbs140n1pnag..."
    },
    "direction": "receive",
    "environment_id": "{environment_id}",
    "error": null,
    "id": "11ca843c-bdaa-44b6-965a-39ac550fcdf3",
    "organization_id": "{organization_id}",
    "status": "receiving",
    "type": "bolt11",
    "updated_at": "2025-03-14T16:08:13.959324Z",
    "wallet_id": "{wallet_id}"
}
﻿
Sending a Payment
curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments' \
  --request POST \
  --data '{
    "id": "68d00852-8dd8-4c71-94d2-91c84695da78",
    "wallet_id": "{wallet_id}",
    "currency": "btc",
    "type": "bolt11",
    "data": {
      "amount_msats": 150000,
      "max_fee_msats": 1000,
      "payment_request": "lntbs1500n1p..."
    }
  }'
﻿
Creating A Staging Wallet through the API:
Before creating a staging wallet through the API you must grab your 'line of credit ID" from the UI
[SCREENSHOT]
curl 'https://voltageapi.com/v1/organizations/{organization_id}/wallets' \
  --request POST \
  --data '{
    "environment_id": {environment_id},
    "id": "71111111-1111-1111-1111-111111111111",
    "line_of_credit_id": "your-line-of-credit-id",
    "limit": 100000000,
    "metadata": {
      "tag": "testing wallet"
    },
    "name": "My First Wallet",
    "network": "mutinynet"
  }'
﻿
Payment Status Monitoring
When sending or receiving payments, monitor the payment status:

For sent payments: sending → completed or failed
For received payments: receiving → completed or failed
Example of checking payment status:

curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}'
﻿
Wallet Balance Management
Regularly check wallet balances to ensure sufficient funds:

curl 'https://voltageapi.com/v1/organizations/{organization_id}/wallets/{wallet_id}'
﻿
Payment History
Track payment history and events:

curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}/history'
﻿
Metadata Support
Add custom metadata to wallets for better organization:

curl 'https://voltageapi.com/v1/organizations/{organization_id}/wallets' \
  --request POST \
  --data '{
    "name": "Customer Wallet",
    "metadata": {
      "customer_id": "cust_123",
      "purpose": "subscription_payments"
    }
    // ... other wallet creation fields
  }'
﻿
Error Handling
The API uses standard HTTP status codes:

200: Success
201: Resource created
400: Bad request
403: Authentication/authorization error
404: Resource not found
500: Server error
Always check the response status and handle errors appropriately.

Support and Resources
For additional support:

﻿Review the full API documentation﻿
Monitor the API health endpoint: /health_check
Check metrics endpoint for monitoring: /metrics
Remember to always use appropriate error handling and logging in your integration to ensure reliable operation of your Lightning Network payments.

Updated 14 Mar 2025
Doc contributor
Doc contributor
Did this page help you?

Yes

No
PREVIOUS
Wallet Setup Guide
NEXT
Sending
TABLE OF CONTENTS
Introduction
Authentication
Generating API Key
Base URL
Quick Start Guides
Receiving a payment
Sending a Payment
Creating A Staging Wallet through the API:
Payment Status Monitoring
Wallet Balance Management
Payment History
Metadata Support
Error Handling
Support and Resources
Receiving - [WIP] Voltage Payments Documentation


[WIP] Voltage Payments Documentation



Search...
⌘
K
Developer Guide
Sending
10min
﻿
﻿
﻿
Sending Payments
This guide explains how to send Lightning Network payments using the Voltage API.

Prerequisites
A Voltage account with an active wallet
An API key (get this from the "API Keys" page in your dashboard)
Sending a Payment
Endpoint
POST https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments
﻿
Headers
x-api-key: your-api-key
Content-Type: application/json
﻿
Request Body
{
  "id": "68d00852-8dd8-4c71-94d2-91c84695da78",  // Unique payment identifier
  "wallet_id": "7a68a525-9d11-4c1e-a3dd-1c2bf1378ba2",
  "currency": "btc",
  "type": "bolt11",
  "data": {
    "amount_msats": 150000,
    "max_fee_msats": 1000,
    "payment_request": "lntbs1500n1p..."  // Lightning invoice to pay
  }
}
﻿
Required Fields
id: A unique identifier for the payment
wallet_id: The ID of the wallet sending the payment
currency: Currently only "btc" is supported
type: Currently only "bolt11" is supported
data.payment_request: The Lightning invoice you want to pay
data.amount_msats: Payment amount in millisatoshis
data.max_fee_msats: Maximum routing fee you're willing to pay
Monitoring Payment Status
After sending a payment, monitor its status using:

GET https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}
﻿
The payment will transition through these states:

sending: Payment is in progress
completed: Payment was successful
failed: Payment failed (check error field for details)
Error Handling
Common HTTP status codes:

200: Success
400: Invalid request (check error message)
403: Authentication error
404: Payment not found
500: Server error
Example Implementation
# Send payment
curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments' \
  --request POST \
  --header 'x-api-key: your-api-key' \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "68d00852-8dd8-4c71-94d2-91c84695da78",
    "wallet_id": "7a68a525-9d11-4c1e-a3dd-1c2bf1378ba2",
    "currency": "btc",
    "type": "bolt11",
    "data": {
      "amount_msats": 150000,
      "max_fee_msats": 1000,
      "payment_request": "lntbs1500n1p..."
    }
  }'

# Check payment status
curl 'https://voltageapi.com/api/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}' \
  --header 'x-api-key: your-api-key'
﻿
﻿

Updated 14 Mar 2025
Doc contributor
Doc contributor
Doc contributor
Did this page help you?

Yes

No
PREVIOUS
Developer Guide
NEXT
Receiving
TABLE OF CONTENTS
Sending Payments
Prerequisites
Sending a Payment
Endpoint
Headers
Request Body
Required Fields
Monitoring Payment Status
Error Handling
Example Implementation
Developer Guide - [WIP] Voltage Payments Documentation


[WIP] Voltage Payments Documentation



Search...
⌘
K
Developer Guide
Receiving
15min
﻿
﻿
﻿
Receiving Payments
This guide explains how to receive Lightning Network payments using the Voltage API.

Prerequisites
A Voltage account with an active wallet
An API key (get this from the "API Keys" page in your dashboard)
Creating and Retrieving a Payment Request
Receiving a payment is a two-step process:

Create a payment request
Retrieve the payment details to get the BOLT11 invoice
Step 1: Create Payment Request
Endpoint
POST https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments
﻿
Headers
x-api-key: your-api-key
Content-Type: application/json
﻿
Request Body
{
  "amount_msats": 10000,
  "currency": "btc",
  "description": "test payment",
  "id": "11ca843c-bdaa-44b6-965a-39ac550fcdf3",
  "payment_kind": "bolt11",
  "wallet_id": "{wallet_id}"
}
﻿
Required Fields
id: A unique identifier for the payment
wallet_id: The ID of the wallet receiving the payment
amount_msats: Amount to receive in millisatoshis
currency: Currently only "btc" is supported
payment_kind: Currently only "bolt11" is supported
description: Description that will be included in the invoice
Step 2: Retrieve Payment Details
Endpoint
GET https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}
﻿
Headers
x-api-key: your-api-key
﻿
Response
{
  "direction": "receive",
  "id": "{payment_id}",
  "wallet_id": "{wallet_id}",
  "organization_id": "{organization_id}",
  "environment_id": "{environment_id}",
  "created_at": "2025-02-12T20:16:14.095785Z",
  "updated_at": "2025-02-12T20:16:14.807961Z",
  "currency": "btc",
  "type": "bolt11",
  "data": {
    "payment_request": "lntbs1404n1pn66qv...",
    "amount_msats": 10000,
    "memo": "test payment"
  },
  "status": "receiving",
  "error": null
}
﻿
The payment_request in the response contains the BOLT11 invoice that should be provided to the payer.

Complete Example Implementation
# Step 1: Create payment request
curl 'https://voltageapi.com/v1/organizations/{organization_id}/environments/{environment_id}/payments' \
  --request POST \
  --header 'x-api-key: your-api-key' \
  --header 'Content-Type: application/json' \
  --data '{
    "amount_msats": 10000,
    "currency": "btc",
    "description": "test payment",
    "id": "11ca843c-bdaa-44b6-965a-39ac550fcdf3",
    "payment_kind": "bolt11",
    "wallet_id": "{wallet_id}"
  }'

# Step 2: Retrieve payment details to get BOLT11 invoice
curl 'https://voltageapi.com/api/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}' \
  --header 'x-api-key: your-api-key'

# Step 3: Monitor payment status
curl 'https://voltageapi.com/api/v1/organizations/{organization_id}/environments/{environment_id}/payments/{payment_id}' \
  --header 'x-api-key: your-api-key'
﻿
Monitoring Payment Status
After creating a payment request, monitor its status using the same GET endpoint:

The payment will transition through these states:

receiving: Waiting for payment
completed: Payment received successfully
failed: Payment failed (check error field for details)
Error Handling
Common HTTP status codes:

200: Success
201: Payment request created
400: Invalid request (check error message)
403: Authentication error
404: Payment not found
500: Server error
Best Practices
Generate unique payment IDs for each request
Always retrieve the payment details after creation to get the BOLT11 invoice
Store the payment ID to track the payment status
Provide clear descriptions for better record keeping
Monitor payment status changes to update your application accordingly
Consider implementing webhook notifications for real-time updates
﻿

Updated 14 Mar 2025
Doc contributor
Doc contributor
Doc contributor
Did this page help you?

Yes

No
PREVIOUS
Sending
NEXT
Staging Environment
TABLE OF CONTENTS
Receiving Payments
Prerequisites
Creating and Retrieving a Payment Request
Step 1: Create Payment Request
Endpoint
Headers
Request Body
Required Fields
Step 2: Retrieve Payment Details
Endpoint
Headers
Response
Complete Example Implementation
Monitoring Payment Status
Error Handling
Best Practices
Sending - [WIP] Voltage Payments Documentation
