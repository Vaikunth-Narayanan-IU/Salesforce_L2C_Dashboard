/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  // Avoid clean-URL ambiguity on static hosts by exporting /about/index.html, etc.
  trailingSlash: true
};

