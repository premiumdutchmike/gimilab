import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'www.torreypines.com' },
      { protocol: 'https', hostname: 'www.sandiegogolf.com' },
      { protocol: 'https', hostname: 'golf-pass-brightspot.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'visitnewportbeach.com' },
      { protocol: 'https', hostname: 'symphony.cdn.tambourine.com' },
      { protocol: 'https', hostname: 'alwaystimefor9.com' },
      { protocol: 'https', hostname: 'www.steelecanyon.com' },
      { protocol: 'https', hostname: 'lavallecoastalclub.com' },
    ],
  },
};

export default nextConfig;
