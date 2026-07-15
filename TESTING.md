# Testing

## Unit & Component Tests (Vitest + RTL)

Run all tests:
```
pnpm test
```

Run in watch mode:
```
pnpm test:watch
```

Run with coverage:
```
pnpm test:coverage
```

## Browser Component Tests (Vitest + Playwright)

```
pnpm test:browser
```

## E2E Tests (Playwright)

Requires a built app served locally. Build first:
```
CI=false pnpm run build
```

Then run e2e tests (starts the preview server automatically):
```
pnpm run test:e2e
```

The preview server runs at `https://local.dsde-dev.broadinstitute.org:3000`.
You will need local SSL certificates (`server.key`, `server.crt`) for HTTPS.
