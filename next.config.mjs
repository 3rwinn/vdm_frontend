/** @type {import('next').NextConfig} */

const nextConfig = {
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/dashboard/overview",
        permanent: true
      }
    ];
  },
};

export default nextConfig;
