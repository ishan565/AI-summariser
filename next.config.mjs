/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to not bundle pdf-parse and treat it as an external dependency.
  serverExternalPackages: ['pdf-parse'],
};

// FIX: Changed "module.exports =" to "export default" for ES module syntax
export default nextConfig;
