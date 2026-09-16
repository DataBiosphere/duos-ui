# System Notification Banners

Ops-controlled announcement banners are served from a GCS bucket, not from the API. DUOS reads them
in `src/libs/notificationService.ts` and renders them in the site header on every page, plus inline
on the DAR application and user profile pages for the `eRACommonsOutage` banner.

## Where the banners live

Each environment reads one public object in a bucket owned by that environment's Terra project, so
anyone with a developer role in the project can update it:

| Environment | Project | Object |
| ----------- | ------- | ------ |
| dev (and a local dev server) | `broad-dsde-dev` | `gs://duos-banners-dev/dev_notifications.json` |
| staging | `broad-dsde-staging` | `gs://duos-banners-staging/staging_notifications.json` |
| prod | `broad-dsde-prod` | `gs://duos-banners-prod/prod_notifications.json` |

The browser fetches `https://storage.googleapis.com/<bucket>/<object>`. The URL is `bannersUrl` in
`config.json`: when the deployed config leaves it unset (or blank, as `config/base_config.json`
ships), the server fills in the row above for `env` (`server/src/config.ts`), and the Content
Security Policy admits that same bucket and nothing else on the shared GCS host (ADR-013). Setting
`bannersUrl` explicitly in an environment's config moves the feed without a code change. With no
`env` and no `bannersUrl`, the environment simply has no banners.

The buckets replaced `gs://broad-duos-banners` in the `broad-duos-prod` project (DT-4063), which held
every environment's file and needed project-specific access to edit.

The file is an array of banner objects:

```json
[
  {
    "id": "eRACommonsOutage",
    "active": true,
    "message": "eRA Commons is undergoing maintenance and may be unavailable.",
    "level": "warning"
  }
]
```

| Field | Notes |
| ----- | ----- |
| `id` | Unique, stable identifier. See the rule below before reusing one. |
| `active` | Only `true` entries are rendered. Flipping to `false` retires a banner. |
| `message` | Markdown; links are supported and rendered underlined. |
| `level` | `info`, `warning`, `danger` or `success`. Anything else falls back to `info`. |

One id is referenced by name in the UI and must not be renamed: `eRACommonsOutage`, which the DAR
application and user profile pages render inline in addition to the header. Every other banner is
generic header content.

## Changing banner text requires a new id

Users can dismiss a banner, and a dismissal is stored per user under `dismissedBanner_<id>` in
localStorage (via `Storage.setCurrentUserSettings`, keyed by user id — signed-out browsers share one
anonymous bucket).

**The dismissal is keyed by id alone, not by the message.** Editing the `message` of an id someone has
already dismissed means those users never see the new text — the banner stays hidden for them.

So when you edit a live banner:

- **New text everyone must see** → publish it under a **new, previously unused id**. Retire the old
  entry by setting `active: false`, or delete it.
- **Typo fix or rewording nobody needs to re-read** → editing in place under the same id is fine.

This applies to retired ids too: reusing one that was active months ago stays suppressed for anyone
who dismissed it back then. A dated suffix (`eraOutage-2026-09`) keeps ids unique without inventing
new names.

Dismissals also clear when a user signs out (`Storage.clearStorage()` calls `localStorage.clear()`),
so a dismissed banner can reappear for a returning user. That is expected; it does not change the
rule above.

## Publishing a change (ops)

Cloud Shell is the easiest place to do this; the bucket is reachable from any project, but you need
a role in the environment's Terra project (`broad-dsde-<env>`) that can write objects, which every
developer has. Replace `dev` with `staging` or `prod` as needed.

```sh
gcloud storage cp gs://duos-banners-dev/dev_notifications.json .
# edit dev_notifications.json (Cloud Shell's "Open Editor" works well), then:
gcloud storage cp --cache-control="no-cache,max-age=0" dev_notifications.json gs://duos-banners-dev/
```

Keep the `no-cache` header: without it GCS serves the object with an hour of public caching and the
change takes that long to reach users. Check what is live with

```sh
curl -s https://storage.googleapis.com/duos-banners-dev/dev_notifications.json
```

Do not copy a file from one environment's bucket to another without reading it first; the prod file
links to `duos.org` where the staging file links to the staging host.

## Standing up a bucket for an environment

Each bucket was created once as below. Repeat only for a new environment, or to recreate one. The
object must be world-readable, since the browser fetches it anonymously, and the bucket needs CORS
for the same reason; uniform bucket-level access keeps the grant on the bucket rather than per object.

```sh
ENV=dev  # dev | staging | prod
gcloud storage buckets create gs://duos-banners-$ENV --project=broad-dsde-$ENV --location=US --uniform-bucket-level-access
cat > cors.json <<'JSON'
[{"origin": ["*"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 300}]
JSON
gcloud storage buckets update gs://duos-banners-$ENV --cors-file=cors.json
gcloud storage buckets add-iam-policy-binding gs://duos-banners-$ENV --member=allUsers --role=roles/storage.objectViewer
gcloud storage cp --cache-control="no-cache,max-age=0" ${ENV}_notifications.json gs://duos-banners-$ENV/
```

If the bucket-level `allUsers` grant is refused, the project has public access prevention enforced
and an exception is needed from DevOps; the Terra `firecloud-alerts-<env>` buckets in the same
projects are public the same way.
