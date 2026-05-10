import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: 'restox',
  project: 'restox-nextjs',
  hideSourceMaps: true,
  widenClientFileUpload: true,
})
