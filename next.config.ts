import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: {
      ignore: [/\/api\/drive\/oauth\/callback/],
    },
  },
};

export default nextConfig;
