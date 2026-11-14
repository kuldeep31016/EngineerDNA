/** @type {import('next').NextConfig} */

// In production the browser calls the API through this app's own origin
// (/api/* and /uploads/* are proxied to the API host), so the httpOnly auth
// cookies are first-party. Set API_PROXY_TARGET to the API's origin,
// e.g. https://engineerdna-api.onrender.com (no trailing /api).
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace package from source.
  transpilePackages: ["@engineerdna/shared"],
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      { source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiProxyTarget}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
