/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  // Fix for image domains - using remotePatterns instead of deprecated domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    unoptimized: true,
  },

  // Remove all experimental features for maximum compatibility
  experimental: {
    // Increase body size limit for Server Actions (needed for rich text editor images)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Server external packages configuration
  serverExternalPackages: ['mongoose'],

  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Improve build reliability
  poweredByHeader: false,
  reactStrictMode: false,

  // Basic configuration
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  distDir: '.next',
  transpilePackages: [],

  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {},

  // Enhanced webpack config with proper path resolution
  // Note: This will be used when --webpack flag is explicitly passed
  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Add explicit path resolution for @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), './'),
    };

    // Handle ES modules better
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default nextConfig;