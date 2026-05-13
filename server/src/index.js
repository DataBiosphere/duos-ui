'use strict'

const express = require('express')
const path = require('node:path')

const app = express()
app.disable('x-powered-by') // S5689: do not disclose technology fingerprints
const PORT = process.env.PORT || 8080
const BUILD_DIR = path.join(__dirname, '..', '..', 'build')

// Health check — must come before static middleware so it always resolves
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Serve the React build as static files
app.use(express.static(BUILD_DIR))

// SPA fallback — any route not matched above serves index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'))
})

// Error handler — must have 4 args so Express treats it as an error handler.
// Suppresses stack traces from responses; NODE_ENV=production also prevents
// Express's default handler from leaking them.
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err)
  res.status(err.status ?? 500).json({ error: 'An unexpected error occurred.' })
})

app.listen(PORT, () => {
  console.log(`DUOS server listening on port ${PORT}`)
})
