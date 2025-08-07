/**
 * Environment configuration
 * Centralized management of environment variables
 */

export const ENV = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1',

  // App Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Feature Flags
  ENABLE_API_LOGGING: process.env.REACT_APP_ENABLE_API_LOGGING === 'true',

  // Development helpers
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Validation function to ensure required environment variables are set
export const validateEnv = (): void => {
  const requiredEnvVars = ['REACT_APP_API_BASE_URL'];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0 && ENV.IS_PRODUCTION) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};

// Run validation on import
validateEnv();
