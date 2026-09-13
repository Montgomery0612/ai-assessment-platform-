import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Enables Cloudflare bindings (e.g. D1) when running `next dev` locally.
initOpenNextCloudflareForDev();

/** @type {import("next").NextConfig} */
const nextConfig = {};

export default nextConfig;
