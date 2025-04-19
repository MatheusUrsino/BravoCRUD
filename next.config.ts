import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 env: {
  NEXT_APPWRITE_URL: process.env.NEXT_APPWRITE_URL,
  NEXT_APPWRITE_PROJECT_ID: process.env.NEXT_APPWRITE_PROJECT_ID,
  NEXT_APPWRITE_DB_ID: process.env.NEXT_APPWRITE_DB_ID,
  NEXT_APPWRITE_COLLECTION_ID: process.env.NEXT_APPWRITE_COLLECTION_ID

 }
};

export default nextConfig;
