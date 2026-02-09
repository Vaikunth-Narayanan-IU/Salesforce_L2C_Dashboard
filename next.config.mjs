/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Avoid clean-URL ambiguity on static hosts by exporting /about/index.html, etc.
  trailingSlash: true
};

