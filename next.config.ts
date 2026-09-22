import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-common",
    "onnxruntime-node",
    "sharp",
  ],
  // transformers.node.mjs loads onnxruntime-node via createRequire(), which NFT
  // does not follow. Without this include the Vercel function is missing the native package.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@huggingface/transformers/**/*",
      "./node_modules/onnxruntime-common/**/*",
      "./node_modules/onnxruntime-node/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net", pathname: "/**" },
      { protocol: "https", hostname: "**.cloudflarestream.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
