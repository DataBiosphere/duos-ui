# GitHub Copilot Instructions

## Project Overview

DUOS UI is a React/TypeScript single-page application for the Data Use Oversight System. It uses Vite for
bundling, ESLint for linting, TypeScript strict mode, and Cypress for component and e2e testing.

## Download Links — Use `DownloadLink` for All File Downloads

The shared `DownloadLink` component (`src/components/DownloadLink.jsx`) is the single canonical way to render
file download actions in this UI. It renders a link-style control with a download icon and consistent
`Theme.palette.link` colour.

**Do not use `<button className="button button-white">` or `<a className="button button-white">` for file
downloads.** Replace any such pattern with `DownloadLink`.

```jsx
import { DownloadLink } from 'src/components/DownloadLink'

// For static PDF assets — open in new tab
<DownloadLink
  label="Broad Library Card Agreement"
  onDownload={() => window.open(BroadLibraryCardAgreementLink, '_blank', 'noopener,noreferrer')}
/>

// For API-fetched blobs — trigger download via AJAX call
<DownloadLink
  label={fileName}
  onDownload={() => DAA.getDaaFileById(daaId, fileName)}
/>
```

When `DownloadLink` is embedded inside a clickable parent (e.g. a selectable row card), the `onDownload`
handler must call `event.preventDefault()` and `event.stopPropagation()` before performing the download so
the parent click handler is not also triggered.

## DAA (Data Access Agreement) File Handling

The `DAA` ajax module (`src/libs/ajax/DAA.ts`) contains all server interactions for DAA files:

- `DAA.getDaaFileById(daaId, fileName)` — fetches and triggers a browser download.
- `DAA.getDaaFileBlob(daaId)` — returns the raw `Blob` for cases where the caller needs to open the file
  in a new tab or pipe it elsewhere.
- `DAA.getDaas()` — returns the full list of DAAs with their associated DACs.

When mapping datasets to their DAA for display (e.g. in `SelectableDatasets`), build a `dacId → daa` lookup
map using the `dacs` array on each DAA object. The helper pattern used in the codebase:

```js
const daaByDacId = {}
for (const daa of daaList) {
  for (const dac of daa.dacs ?? []) {
    if (!daaByDacId[dac.dacId]) {
      daaByDacId[dac.dacId] = { daaId: daa.daaId, fileName: daa.file?.fileName || `daa-${daa.daaId}` }
    }
  }
}
```

## DAR (Data Access Request) Snapshot API

`DAR.getDatasetDaaSnapshots(referenceId)` (`src/libs/ajax/DAR.js`) fetches the dataset–DAA relationship
snapshot for a submitted DAR. The response is an array; each element may use either a flat shape
(`datasetId`, `daaId`, `daaFileName` as top-level fields) or a nested shape (`dataset.datasetId`,
`daa.daaId`, `daa.file.fileName`). The `DatasetDaaSnapshotRelationships` component
(`src/pages/dar_application/DatasetDaaSnapshotRelationships.tsx`) normalises both shapes.

## `DAAUtils.isEnabled()` Feature Flag

`DAAUtils.isEnabled()` (`src/utils/DAAUtils.ts`) gates all DAA-related UI. Wrap any new DAA-specific JSX in
this guard:

```tsx
{DAAUtils.isEnabled() && <DAASpecificComponent />}
```

## Component Test Conventions (Cypress)

- **Never use `new Date()` directly as a fixture value** in component tests where the formatted date is
  later asserted. Use a fixed `Date` object (e.g. `new Date('2026-04-30T12:00:00.000Z')`) so the assertion
  is deterministic and does not become flaky when the test runs around midnight or across timezones.
- All new component test files go under `cypress/component/<feature-area>/`.
- Stub all AJAX calls (`DAA`, `DAR`, `Collections`, etc.) using `cy.stub(Module, 'method').resolves(...)`.
- Use `cy.initApplicationConfig()` in `beforeEach` for all component specs.

## Pre-PR Checklist

Before raising a pull request, ensure:

1. `npm run lint` exits with **0 errors**.
2. `npm run type-check` exits with **0 errors**.
3. All new code is covered by component tests with meaningful assertions.
4. Using SonarQube for IDE, verify no new SonarQube bugs, issues, or vulnerabilities are introduced.
5. `npm run cypress:run:component` exits with **0 failing specs**.


### Common Lint / TypeScript Pitfalls to Avoid

| Issue | Fix |
|---|---|
| `Ambiguous spacing after previous element` in JSX | Collapse multi-line anchor text to a single line or wrap the trailing punctuation in `{'.'}` |
| `Curly braces are unnecessary here` | Remove the `{' '}` wrapper from plain text adjacent to elements where the spacing rule allows a bare string |
| Unused variable flagged by `@typescript-eslint/no-unused-vars` | Prefix with `_` or remove the variable entirely |
| `Property X does not exist on type` for dynamic records | Cast the sub-object to a typed record (`as SomeRecordType`) before accessing properties |
| Passing props that don't exist in a component's `Props` interface | Remove the extra props; do not add them to the interface unless the component actively uses them |

## Styling Conventions

- Use `className="button button-blue"` for primary CTA buttons.
- Use `className="button button-white"` only for **non-download** secondary actions (e.g. Save Draft, Cancel).
  Do **not** use this class for download actions — use `DownloadLink` instead.
- Inline download-as-link controls inside tables use `className="button-link"` (defined in
  `src/pages/dar_application/dar_application.css`) with the corresponding `:disabled` state.
