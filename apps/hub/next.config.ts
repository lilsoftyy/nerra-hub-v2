import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nerra/ui', '@nerra/db'],
};

export default nextConfig;
