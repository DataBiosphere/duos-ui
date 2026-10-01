// DIAGNOSTIC (not for merge): time dev Consent directly, outside the BFF, while the
// Playwright role specs run. If /api/user/me stalls here too, Consent is the cause.
// Prints status codes and elapsed times only, never the token.
import { JWT } from 'google-auth-library'

const base = process.env.DUOS_API_URL
const raw = JSON.parse(process.env.DUOS_AUTOMATION_ADMIN_SA ?? 'null')
if (!base || !raw) throw new Error('DUOS_API_URL and DUOS_AUTOMATION_ADMIN_SA are required')
const key = raw.key ?? raw

const client = new JWT({ email: key.client_email, key: key.private_key, scopes: ['email', 'profile'] })
await client.authorize()
const token = client.credentials.access_token

async function probe(path) {
  const started = performance.now()
  try {
    const response = await fetch(base + path, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(150_000),
    })
    await response.arrayBuffer()
    return `${response.status} ${Math.round(performance.now() - started)}ms`
  }
  catch (err) {
    return `${err.name} ${Math.round(performance.now() - started)}ms`
  }
}

const stopAt = Date.now() + Number(process.env.DIAG_SECONDS ?? 420) * 1000
while (Date.now() < stopAt) {
  const [status, me] = await Promise.all([probe('/status'), probe('/api/user/me')])
  console.log(new Date().toISOString(), `status ${status} | user/me ${me}`)
  await new Promise(resolve => setTimeout(resolve, 5000))
}
