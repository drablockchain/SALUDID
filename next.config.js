/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_NETWORK_ID: process.env.NEXT_PUBLIC_NETWORK_ID,
    NEXT_PUBLIC_WEB3_STORAGE_TOKEN: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN,
    NEXT_PUBLIC_PINATA_API_KEY: process.env.NEXT_PUBLIC_PINATA_API_KEY,
    NEXT_PUBLIC_PINATA_SECRET_KEY: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
    NEXT_PUBLIC_PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT,
    NEXT_PUBLIC_PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
    NEXT_PUBLIC_STORACHA_DID: process.env.NEXT_PUBLIC_STORACHA_DID,
    NEXT_PUBLIC_UNLOCK_LOCK: process.env.NEXT_PUBLIC_UNLOCK_LOCK,
    NEXT_PUBLIC_UNLOCK_NETWORK: process.env.NEXT_PUBLIC_UNLOCK_NETWORK,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig
