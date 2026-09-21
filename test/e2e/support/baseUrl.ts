// The E2E suite runs against the Fastify server, which speaks HTTPS in every
// environment the suite uses: local runs read the dev certificate from the
// project root, and CI generates a self-signed pair (integration-tests.yml).
// The session cookie is `Secure`, so plain HTTP would carry no session.
export const BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3000'
