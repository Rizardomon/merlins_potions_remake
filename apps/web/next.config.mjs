/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@merlins-potions-remake/shared"],
  // Imagem Docker enxuta: o build emite `.next/standalone` com um server.js e só as
  // dependências usadas — sem o monorepo inteiro. Ver docs/padroes/deploy.md.
  output: "standalone",
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
};

export default nextConfig;
