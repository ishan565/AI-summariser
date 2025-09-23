/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This tells Next.js to not bundle pdf-parse and treat it as an external dependency.
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

// FIX: Changed "module.exports =" to "export default" for ES module syntax
export default nextConfig;