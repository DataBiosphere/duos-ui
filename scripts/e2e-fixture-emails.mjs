// Prints the automation service-account emails for DUOS_TEST_SIGNIN_EMAILS.
// Only public identity names go to the BFF allowlist, never the keys. The server
// validates the list at boot (server/src/auth/testSignin.ts).
const roles = ['ADMIN', 'CHAIR', 'MEMBER', 'RESEARCHER', 'SIGNING_OFFICIAL']
const emails = roles.map((role) => {
  const name = `DUOS_AUTOMATION_${role}_SA`
  const raw = process.env[name]
  if (!raw) throw new Error(`Missing ${name}`)
  const parsed = JSON.parse(raw)
  return (parsed.key ?? parsed).client_email
})
console.log(emails.join(','))
