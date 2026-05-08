import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Required environment variables (add to .env.local):
//   PLAID_CLIENT_ID=your_client_id
//   PLAID_SANDBOX_SECRET=your_sandbox_secret
//   PLAID_ENV=sandbox   (sandbox | development | production)
//   ENCRYPTION_KEY=64-char-hex-string  (for encrypting access tokens at rest)

const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments

const configuration = new Configuration({
  basePath: PlaidEnvironments[env],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
      'PLAID-SECRET': process.env.PLAID_SANDBOX_SECRET ?? '',
    },
  },
})

export const plaidClient = new PlaidApi(configuration)
