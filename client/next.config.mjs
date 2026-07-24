import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    root: fileURLToPath(new URL('..', import.meta.url)),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/avatars/:path*',
        destination: 'http://localhost:5000/avatars/:path*',
      },
    ];
  },
};

export default nextConfig;
