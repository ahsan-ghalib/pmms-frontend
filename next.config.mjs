import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "soouqlive.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "livemarket-storage-bucket.oss-me-central-1.aliyuncs.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "soouq-live.test",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "soouq-live.test",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
