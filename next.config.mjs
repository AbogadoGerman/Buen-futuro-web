/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3hzflklh28tts.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/data/inventory.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
