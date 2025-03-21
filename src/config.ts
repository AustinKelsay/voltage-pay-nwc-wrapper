/**
 * Configuration Module
 * 
 * This module handles loading and validating environment variables for the Voltage API.
 * Key features:
 * 
 * 1. Environment Variables:
 *    - Loads from both .env and .env.local
 *    - Validates required variables
 *    - Provides type-safe access
 * 
 * 2. Error Handling:
 *    - Graceful fallback if files don't exist
 *    - Clear error messages for missing variables
 *    - Debug logging for troubleshooting
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Try to load environment variables from both .env and .env.local
try {
  // Load .env first (if it exists)
  dotenv.config();
  
  // Then try to load .env.local (if it exists)
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: true, // .env.local values override .env values
  });
} catch (error) {
  console.warn('Warning: Could not load environment files:', error);
}

/**
 * Configuration interface for the application
 */
interface Config {
  voltage: {
    apiKey?: string;
    organizationId?: string;
    environmentId?: string;
    walletId?: string;
  };
}

/**
 * Application configuration object
 * 
 * This object provides type-safe access to environment variables.
 * All values are optional to allow for partial configuration loading.
 */
export const config: Config = {
  voltage: {
    apiKey: process.env.VOLTAGE_API_KEY,
    organizationId: process.env.ORGANIZATION_ID,
    environmentId: process.env.ENVIRONMENT_ID,
    walletId: process.env.WALLET_ID,
  },
};

// Debug logging to help troubleshoot configuration issues
console.log('Configuration loaded:', {
  hasApiKey: !!config.voltage.apiKey,
  hasOrganizationId: !!config.voltage.organizationId,
  hasEnvironmentId: !!config.voltage.environmentId,
  hasWalletId: !!config.voltage.walletId,
});

// Validate required environment variables
const requiredVars = [
  { name: 'VOLTAGE_API_KEY', value: config.voltage.apiKey },
  { name: 'ORGANIZATION_ID', value: config.voltage.organizationId },
  { name: 'ENVIRONMENT_ID', value: config.voltage.environmentId },
  { name: 'WALLET_ID', value: config.voltage.walletId },
];

const missingVars = requiredVars.filter(({ value }) => !value);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', 
    missingVars.map(({ name }) => name).join(', '));
  process.exit(1);
} 