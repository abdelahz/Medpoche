/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    // pdfjs-dist (server-side text extraction in the RAG ingestion) must load at
    // runtime via Node require, not be bundled by webpack — bundling trips on its
    // worker/canvas references. Keep it external on the server.
    serverComponentsExternalPackages: ['pdfjs-dist'],
    // pdfjs loads its worker (pdf.worker.mjs) via a runtime path the file tracer
    // can't see, so Vercel ships pdf.mjs without the worker beside it → "Setting
    // up fake worker failed" on the ingestion route. Force the worker into that
    // function's bundle.
    outputFileTracingIncludes: {
      '/api/admin/index-dataset': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker*.mjs'],
    },
  },
};

export default nextConfig;
