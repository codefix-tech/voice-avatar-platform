/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Avoid double-rendering in dev with R3F
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

module.exports = nextConfig
