// Print public client_email values for DUOS_TEST_SIGNIN_EMAILS, never keys.
const roles = ['ADMIN', 'CHAIR', 'MEMBER', 'RESEARCHER', 'SIGNING_OFFICIAL']
const emails = roles.map((role) => {
  const name = `DUOS_AUTOMATION_${role}_SA`
  const raw = process.env[name]
  if (!raw) throw new Error(`Missing ${name}`)
  const parsed = JSON.parse(raw)
  return (parsed.key ?? parsed).client_email
})
console.log(emails.join(','))
