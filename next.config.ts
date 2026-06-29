import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉터리의 다른 lockfile 때문에 워크스페이스 루트가 잘못 추론되는 것 방지
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
