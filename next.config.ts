import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/pay/payment_api.php",
        destination: "/pay/payment_api.php",
      },
      {
        source: "/airpay_php/responsefromairpay.php",
        destination: "/api/payment/airpay/callback",
      },
    ];
  },
};

export default nextConfig;
