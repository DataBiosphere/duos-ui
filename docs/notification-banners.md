# System Notification Banners

Ops-controlled announcement banners are served from a GCS bucket, not from the API. DUOS reads them
in `src/libs/notificationService.ts` and renders them in the site header on every page, plus inline
on the DAR application and user profile pages for the `eRACommonsOutage` banner.

## Where the banners live

```
https://storage.googleapis.com/broad-duos-banners/{env}_notifications.json
```

`{env}` comes from `Config.getEnv()`; a local dev server reads the `dev_` file.

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
