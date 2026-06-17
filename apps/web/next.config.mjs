/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace package from source.
  transpilePackages: ["@engineerdna/shared"],
};

export default nextConfig;
