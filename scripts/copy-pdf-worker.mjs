// Copies the pdf.js worker from pdfjs-dist into /public so it is served as a
// static module worker (never run through Terser). Runs on predev/prebuild so
// the worker always matches the installed pdfjs-dist version. Idempotent.
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const destDir = join(root, 'public')
const dest = join(destDir, 'pdf.worker.min.mjs')

mkdirSync(destDir, { recursive: true })
copyFileSync(src, dest)
console.log('Copied pdf.js worker → public/pdf.worker.min.mjs')
