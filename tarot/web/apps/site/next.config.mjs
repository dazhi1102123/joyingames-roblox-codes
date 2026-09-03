/** @type {import('next').NextConfig} */
const nextConfig = {
  // @arcana/core ships TypeScript source, not a build. Next compiles it with
  // the app, which keeps the package free of a build step of its own and lets
  // a future React Native app consume the same files.
  transpilePackages: ["@arcana/core"],
  reactStrictMode: true,
}

export default nextConfig
