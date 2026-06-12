/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    // pdfjs-dist (server-side text extraction in the RAG ingestion) must load at
    // runtime via Node require, not be bundled by webpack — bundling trips on its
    // worker/canvas references. Keep it external on the server.
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
};

export default nextConfig;
