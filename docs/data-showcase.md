# Adding a Data Showcase

A Data Showcase is a public page for one program or partner: `/data` for the flagship and
`/showcase/<key>` for every other showcase. Each showcase is code in this repository. You add or
change one through a pull request (PR). CI checks the rules in this guide; where it cannot, the
guide says that the reviewer does.

This guide is for an engineer who did not build the first showcase. The design decisions are in
consent `docs/plans/data-showcase-delivery-plan.md` (section 3). The lookup that supplies dataset
cards is in [docs/data-showcase-lookup.md](data-showcase-lookup.md).

Before you start, set up a local checkout. [DEVNOTES.md](../DEVNOTES.md) gives the steps (see
"Local Setup"): install the modules and render the config files. The checks in Step 7 need the
modules. The preview in Step 6 needs the config files.

A showcase PR changes three things only:

| What | Where |
| ---- | ----- |
| Images | `src/images/showcase/<key>/` |
| Config | `src/showcases/<key>.ts`, registered in `src/showcases/index.ts` |
| Index entry | `src/showcases/registry.json` |

Do not add partner-specific code to the shared components. If a partner needs a new section type or
field, file a ticket for a product decision.

---

## Step 1: Confirm that the content is public

There is no other document to read for this step. The rule is this section.

DUOS sends its JavaScript to every browser that opens the site, with no sign-in. All showcase
content that you merge to `develop` is in that JavaScript. `status: "hidden"` keeps a route off. It
is **not** a privacy control: the title, copy and image names of a hidden showcase are in the
JavaScript for anyone to read.

Merge only content that is cleared for public disclosure. This includes the name of a partner that
is not yet announced. If content is not cleared, keep the PR open until it is.

---

## Step 2: Intake checklist

Get these from the program owner before you start. The program owner approves all copy and claims
in the PR (see [Review roles](#review-roles)).

- [ ] **Owners**: the program owner who approves content, and a contact for later changes
- [ ] **Key**: see the [key rules](#key-rules); it is permanent
- [ ] **Title**: the display title for the index entry; it can change later
- [ ] **Flagship or partner**: the flagship is at `/data`; a partner is at `/showcase/<key>`. The
      first showcase in an empty index must be the flagship (see [Step 5](#step-5-register-the-config-and-add-the-index-entry))
- [ ] **Logos**: the showcase's own logo and at most three partner logos, each with alt text
- [ ] **Colors**: a theme preset (`default`, `blue` or `teal`), and optional `#rrggbb` primary and
      accent overrides. Each override needs a contrast of 4.5:1 or more on white, or CI fails
- [ ] **Dataset identifiers**: production `DUOS-` identifiers, for example `DUOS-000123`
- [ ] **Tools and workspaces**: name, description, tags, launch URL and optional documentation URL
      (record them, but you can add them only after their section type is implemented; see the
      "Implemented sections only" rule in Step 4)
- [ ] **Copy**: subtitle, intro, calls to action (label and URL), announcements
- [ ] **Dates**: a `startDate` and an `endDate` (`YYYY-MM-DD`, UTC) for each announcement or event.
      A showcase has no dates of its own; skip this item if there is no announcement or event
- [ ] **Clearance**: confirmation that all of the above is cleared for public disclosure

`DUOS-` identifiers come from a sequence in each environment. A showcase config lists **production**
identifiers, so only production Consent resolves them.

---

## Step 3: Add the images

Put every image in `src/images/showcase/<key>/`. A config names an image by its path below
`src/images`, for example `showcase/example-partner/logo.svg`. CI checks that an image is below
`src/images/showcase/`. It does not check that the directory matches the key; the reviewer does.

Logos follow the standards in [adding-a-data-library.md](adding-a-data-library.md) (Step 1): SVG preferred,
transparent PNG as the fallback, a 256 × 256 canvas, optimized. Hero and card images do not need
the square canvas. CI does not check the canvas or the optimization; the reviewer does. CI enforces
these limits (`test/showcases/guard/assetBudget.ts`):

| Image | Limit |
| ----- | ----- |
| Masthead logo, SVG | 50 KB |
| Masthead logo, PNG | 100 KB |
| Masthead logo, any other format | Not allowed |
| Any other image | 300 KB each |
| All images in one config, together | 1024 KB |

Other rules:

- Allowed extensions: `svg`, `png`, `jpg`, `jpeg`, `webp`, `gif`, `avif`.
- The first masthead logo (`logos[0]`) is the showcase's own logo.
- A partner logo needs alt text. The showcase's own logo can have an empty `alt`; the
  page then uses the index title. Other images can use `alt: ''` only when they are decorative.
- A reviewer reads each SVG in the PR. The page shows an SVG through `<img>` and never inlines it.
- The image of a disabled section still counts toward the budget, because it still ships.

---

## Step 4: Create the config

Create `src/showcases/<key>.ts`. The config lists only what differs from `defaultShowcase`
(`src/showcases/defaults.ts`), where every one of the 23 sections is off.

```typescript
import type { ShowcasePartialInput } from 'src/types/showcase'

export const examplePartner: ShowcasePartialInput = {
  branding: { theme: 'teal' },
  sections: {
    'masthead': {
      enabled: true,
      logos: [
        { src: 'showcase/example-partner/logo.svg', alt: '' },
        { src: 'showcase/example-partner/funder.svg', alt: 'Example Funder', url: 'https://example.org' },
      ],
    },
    'hero': {
      enabled: true,
      subtitle: 'Genomic data from the Example Partner program',
      intro: 'Cohorts that researchers can request through DUOS.',
      stats: ['studies', 'datasets'],
      primaryCtas: [{ label: 'Browse the data library', url: '/datalibrary' }],
      onboarding: [],
      announcements: [
        { id: 'spring-release', text: 'Spring data release is available', url: 'https://example.org/release', startDate: '2027-03-01', endDate: '2027-04-30' },
      ],
    },
    'latest-data-releases': { enabled: true, ranking: 'newest', limit: 12 },
  },
}
```

How the merge works (`resolveShowcase`):

- A section that you list replaces the default section whole. An enabled section must have every
  required field of its type; `src/showcases/schema.ts` has each shape.
- `branding` takes `theme`, and optional `primary` and `accent` colors in `#rrggbb` form, for
  example `branding: { theme: 'teal', accent: '#0f766e' }`. It merges field by field, so you can
  override one color.
- A flagship config has the same shape as a partner config.
- You can list sections in any order. The merge puts all 23 keys in the fixed order.
- A misspelt section key is kept, so that CI reports it.

Rules that CI checks in the config (`test/showcases/guard/checkShowcase.ts`):

| Rule | Detail |
| ---- | ------ |
| Implemented sections only | You can enable only the keys in `IMPLEMENTED_SECTION_KEYS` (`src/types/showcase.ts`). When this guide was written they were `masthead`, `hero`, `latest-data-releases` and `open-access-datasets`; the code has the current list. |
| URLs | Each `url` or `...Url` field is an `https://` URL, a same-origin path that starts with one `/`, or `#<section key>` for a section that has an anchor (not `masthead` or `hero`). No bare `#`, `//host`, whitespace, backslash or credentials. |
| Logos | At most 4 masthead logos: the showcase's own and three partners. Partner logos need alt text. |
| Featured apps | At most 1 item in `featured-tools` has `featured: true`. CI counts it in a disabled section also. |
| Launch links | A `launchUrl` opens the resource. It cannot be a `#section` link. |
| Dates | `YYYY-MM-DD`, and `endDate` is not before `startDate`. A range includes both ends, in UTC. |
| Item IDs | Each `id` is unique in the whole showcase. IDs are analytics keys; do not change one later. |
| Identifiers | `DUOS-` and exactly six digits, or seven or more digits with no leading zero. For example `DUOS-000123`. |
| Contrast | Primary and accent colors need a contrast of 4.5:1 or more on the white background. |
| Images | See Step 3. |

Dated content appears and expires without a release. Every other change needs a merge and the
daily release.

### Lookup and config limits

Consent and the BFF proxy enforce these limits on the public lookup, and the config schema has the
same values (`LOOKUP_LIMITS` in `src/types/showcase.ts`). A config over a limit fails CI. A list
over its limit can fail with only `Invalid input` at the section, so check the list lengths against
this table.

| Field | Maximum |
| ----- | ------- |
| `items` in `open-access-datasets` (counted before deduplication) | 200 identifiers |
| `pin` in a computed shelf | 50 identifiers |
| `exclude` in a computed shelf | 200 identifiers |
| `scope.dac` values | 20 |
| `limit` in a computed shelf | 50 (the default is 12) |
| Identifier length | 32 characters |

The lookup also refuses a request body over 64 KiB and more than 120 requests a minute from one
client. See [docs/data-showcase-lookup.md](data-showcase-lookup.md).

---

## Step 5: Register the config and add the index entry

### 5.1 Register the config

In `src/showcases/index.ts`, add one import line and one line to the existing `showcaseConfigs`
object, under the key. Keep everything else in the file.

```typescript
import { examplePartner } from './example-partner'
```

```typescript
  'example-partner': examplePartner,
```

Import config files with a relative path here. Other code imports the index as `src/showcases`
only; a test fails any other path to it.

### 5.2 Add the index entry

Add an entry to `entries` in `src/showcases/registry.json`:

```json
{ "key": "example-partner", "title": "Example Partner Data", "status": "hidden", "flagship": false, "order": 1 }
```

| Field | Rule |
| ----- | ---- |
| `key` | See the key rules below. The route comes from the key; there is no `route` field. |
| `title` | The display title. Not empty. You can change it at any time. |
| `status` | `live` or `hidden`. A `hidden` entry renders the not-found page. Start with `hidden`. Change it to `live` for a preview (Step 6), or when the program owner clears the launch. |
| `flagship` | Exactly one entry is the flagship, served at `/data` only. Every other entry is `false`. |
| `order` | A whole number, 0 or more. Use 0 for the first entry, then one higher than the current highest. CI does not check that it is unique; the reviewer does. |

Every entry needs a config, and every config needs an entry. CI fails if one has no match.

**The flagship comes first.** CI fails an index that has entries but not exactly one flagship. A
partner showcase cannot merge before the flagship is in the index. A flagship entry differs only in
`flagship`:

```json
{ "key": "example-flagship", "title": "Example Data", "status": "hidden", "flagship": true, "order": 0 }
```

### Key rules

- Lowercase letters and digits, in words joined by single hyphens: `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Not `data` and not `flagship`.
- Unique, and not in `retiredKeys`.
- **Permanent.** The key identifies the showcase in routes, analytics and future subscriptions.
  Never rename a key and never reuse one. To change what visitors see, change `title`.
- A bad key fails three tests at once, and the message is the key pattern. Fix the key first.

---

## Step 6: Preview

1. Set the entry to `"status": "live"` on your branch. A `hidden` entry is not routable in any
   build today.
2. Make a local `public/config.json` with the rollout flag on. Only the boolean `true` works. Git
   ignores this file. `config/dev.json` has no `bffEnabled`, so choose the mode here:

   ```sh
   # Legacy mode
   jq '.showcaseEnabled = true' config/dev.json > public/config.json
   # BFF mode
   jq '.bffEnabled = true | .showcaseEnabled = true' config/dev.json > public/config.json
   ```
3. Start one server. Both use port 3000, so do not run them together.
   - Legacy mode: `pnpm start` (Vite only).
   - BFF mode: `pnpm run start:server` (the Fastify server with Vite embedded). It needs
     `.env.local`; see [DEVNOTES.md](../DEVNOTES.md).
4. Open `/showcase/<key>`, or `/data` for the flagship.

Dataset cards and hero counts come from the lookup. To see real cards, point the lookup at
production Consent: `DUOS_SHOWCASE_API_URL` in BFF mode, `showcaseApiUrl` in legacy mode. A preview
that reads production is read-only: the handoffs to search, dataset and request pages stay off. See
the configuration table in [docs/data-showcase-lookup.md](data-showcase-lookup.md).

A dataset shelf shows its unavailable state when the lookup fails. This is what you see until the
Consent that you point at has the public lookup on ("Not done yet" in that document). The masthead,
the hero copy and the links do not need the lookup.

If the showcase must not be public at merge, set `status` back to `"hidden"` before you ask for
review, and attach screenshots of the live preview to the PR.

The full preview procedure (staging, and hidden entries in non-production builds) is story S4.2 of
the delivery plan. This section changes when that story lands.

---

## Step 7: Run the checks

```sh
git fetch origin
pnpm exec vitest run test/showcases
pnpm run type-check
pnpm run lint
```

How to read the results:

- Each broken rule is one `+ "<path>: <message>"` line in the test failure output.
- If the test summary shows `1 skipped`, the key history check did not run. Run `git fetch origin`
  and run the tests again. A full run shows no skipped tests.
- `pnpm run lint` prints warnings from other files. It passes when it exits with code 0 and reports
  no errors.

`git fetch origin` matters. The key history check compares your `registry.json` with the one on the
PR's base branch. If your machine does not have that revision, the check is **skipped** locally. CI
fetches the base branch and sets `SHOWCASE_BASE_REF`; there, a missing base revision **fails**. To
compare with a different branch locally:

```sh
SHOWCASE_BASE_REF=origin/<branch> pnpm exec vitest run test/showcases/keyHistory.spec.ts
```

The `develop` branch requires a PR to be up to date before merge, so CI always compares with the
current index. If another showcase PR merges first, update your branch.

---

## Hiding, retiring and rolling back

| You want to | Do this | Reversible |
| ----------- | ------- | ---------- |
| Take a showcase offline for a time | Set `"status": "hidden"` | Yes: set it back to `live` |
| Remove a showcase for good | Retire its key (below) | **No** |
| Replace a showcase with a new identity | Retire the old key, then add a new entry with a new key | No |
| Turn every showcase off | Set `showcaseEnabled` off in the deployed `config.json` | Yes |

### Retire a key

1. Remove the entry from `entries` in `registry.json`.
2. Add the key to `retiredKeys` in the same file. This is the tombstone.
3. Remove the config from `showcaseConfigs`, and delete `src/showcases/<key>.ts` and
   `src/images/showcase/<key>/`.

A tombstone is permanent. CI fails a PR that removes an entry without a tombstone, deletes a
tombstone, or gives an entry a retired key. A replacement showcase gets a new key; it must not take
over the routes or analytics of the old one.

### Roll back or hotfix

Keep every tombstone. Do not deploy an old artifact or revert `registry.json` to a revision from
before a retirement: that brings a retired identity back. Rebuild the older content on top of the
current `registry.json`. If a revert PR touches `registry.json`, restore the current `retiredKeys`
before you merge; CI fails the PR until you do.

---

## Worked example

Add a partner with the key `example-partner` to an index that already has the flagship.

1. Intake: the program owner supplies the logo, the copy in Step 4 and the clearance.
2. Save `src/images/showcase/example-partner/logo.svg` and `funder.svg`, each below 50 KB.
3. Create `src/showcases/example-partner.ts` with the config in Step 4.
4. Register it in `src/showcases/index.ts` as in Step 5.1.
5. Add the entry in Step 5.2 to `registry.json`, with `order` one higher than the highest.
6. Preview `/showcase/example-partner` as in Step 6, and take screenshots.
7. Run the checks in Step 7.
8. Open the PR, fill in the showcase section of the PR template, and ask the program owner to
   approve.

The synthetic showcases in `test/e2e/showcase/index.ts` are a second example that passes every rule.
They are compiled only by `pnpm run build:e2e` and never reach a deployed build.

---

## Review roles

| Role | Who | Approves |
| ---- | --- | -------- |
| Engineer | `@DataBiosphere/dsp-data-team-eng`. The default rule in `.github/CODEOWNERS` makes this team the code owner of every path, which includes `src/showcases/` and `src/images/showcase/`. | Code, config, images and CI results. The branch protection of `develop` sets the number of approvals. |
| Program owner | The owner named at intake | Copy, claims, logos and public clearance, by a review or a comment in the PR. |

A showcase PR is ready to merge when both roles approve. The PR template has a section for this.

---

## Testing checklist

### Content

- [ ] The program owner confirmed that all content is cleared for public disclosure
- [ ] The key follows the key rules and is not in `retiredKeys`
- [ ] The index has exactly one flagship
- [ ] `order` is unique, and one higher than the previous highest
- [ ] The image directory name is the key
- [ ] Images are in `src/images/showcase/<key>/`, optimized, and within the limits
- [ ] Each partner logo has alt text
- [ ] Each link is `https://`, a `/path` or a `#section`
- [ ] Each identifier is a production `DUOS-` identifier
- [ ] Each dated item has a correct `startDate` and `endDate`
- [ ] Only implemented sections are enabled

### Checks

- [ ] `git fetch origin` ran before the tests, and the key history test was not skipped
- [ ] `pnpm exec vitest run test/showcases` passes
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes

### Preview

- [ ] The page renders at `/showcase/<key>` (or `/data`) with `showcaseEnabled: true`
- [ ] Logos, colors and copy match what the program owner supplied
- [ ] Each link and call to action opens the correct page
- [ ] The page works with a keyboard and at phone, tablet and desktop widths
- [ ] A hidden or unknown key shows the not-found page
- [ ] `status` in the PR is the value that must ship

### Pull request

- [ ] The showcase section of the PR template is complete
- [ ] The program owner approved in the PR
- [ ] No `public/config.json` change is in the PR

---

## Contact

For questions about showcases, contact the DUOS development team.
