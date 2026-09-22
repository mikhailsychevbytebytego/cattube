import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net", pathname: "/**" },
      { protocol: "https", hostname: "**.cloudflarestream.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
