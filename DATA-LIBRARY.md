
# Adding a New Data Library

This document describes the standardized process for adding a new featured data library to DUOS. It includes required steps for obtaining and standardizing partner logos, asset requirements, configuration updates, optional styling, and testing guidelines.

---

## Step 1: Obtain and Standardize the Logo File

Because partner institutions may provide assets in many different formats and quality levels, DUOS must standardize each logo before adding it.

### 1.1 Request assets from the partner

Request the following, in order of preference:

1. **SVG (preferred)**
2. **High-resolution transparent PNG**

If possible, also request:
- Branding guidelines
- Brand resource folders
- Press/media kits

### 1.2 If suitable assets are not provided

Search for publicly available branding assets:

- Partner’s official website (press kit, media page)
- GitHub organization profile
- Publications, slide decks, conference materials
- Verified Google Images or social media sources

### 1.3 Standardize the asset (fallback workflow)

If no high-quality vector is available:

1. Place the raster logo into a **256 × 256 transparent canvas**.
2. Center it with consistent whitespace.
3. Remove backgrounds if necessary.
4. Export as PNG.
5. Optimize the file for performance.

### 1.4 Logo asset requirements

| Requirement | Value |
|------------|-------|
| **Preferred format** | SVG |
| **Fallback format** | Transparent PNG |
| **Canvas or viewport size** | 256 × 256 |
| **Max SVG file size** | ≤ 50 KB (hard limit 100 KB) |
| **Max PNG file size** | ≤ 100 KB (hard limit 150 KB) |
| **Optimization** | Required (SVGO, pngquant, Squoosh, ImageOptim, etc.) |

Once the asset is finalized, save it to:

```
src/images/<partner>-logo.svg
```

Example:

```
src/images/example-logo.svg
```

---

## Step 2: Update `libraryVersions.ts`

Add a new configuration entry for the data library.

### Add import (alphabetically):

```typescript
import exampleIcon from 'src/images/example-logo.svg'
```

### Add the configuration entry

> **Ordering rule:**  
> Assign `order` to **one higher than the current highest order** in the file.

```typescript
'example': {
  query: {
    match_phrase: {
      'study.description': 'Example',
    },
  },
  icon: exampleIcon,
  title: 'Example Data Library',
  featured: true,
  order: <next_available_order>,
},
```

---

## Step 3: Special Styling (If Needed)

Some logos require a dark background (e.g., Broad Institute style). This is optional and should be used only when the branding requires it.

### Add conditional dark card styling (in `Home.jsx`)

```javascript
// Dark card background for Broad and Example
const cardStyle = library.key === 'broad' || library.key === 'example'
  ? { ...baseCard, background: '#1F3B50', padding: '15px' }
  : baseCard
```

### Import a white logo variant (optional)

```javascript
import exampleLogo from '../images/example-logo-white.svg'
```

### Update logo selection logic

```javascript
const logoSrc = library.key === 'broad'
  ? broadLogo
  : library.key === 'example'
  ? exampleLogo
  : library.icon
```

---

# Testing Checklist

### Implementation

- [ ] Logo is SVG or high-resolution transparent PNG
- [ ] Logo meets file size limits
- [ ] Logo normalized to a 256 × 256 canvas if needed
- [ ] Logo optimized using SVGO/pngquant/etc.
- [ ] Logo placed in `src/images`
- [ ] Alphabetical import added to `libraryVersions.ts`
- [ ] Configuration entry added with correct query pattern
- [ ] `order` assigned as highest existing + 1

---

### Homepage Testing

- [ ] Logo displays correctly in the homepage grid
- [ ] Logo maintains correct aspect ratio
- [ ] Label shows correctly below the logo
- [ ] Tooltip appears for unauthenticated users
- [ ] Navigation works when authenticated
- [ ] Logo renders properly on phones, tablets, and desktops
- [ ] Logo appears in correct sort order
- [ ] Logo does not significantly increase homepage load weight

---

## Notes

- No updates to UI components are required unless applying special dark-background styling
- The grid layout reads automatically from `libraryVersions.ts`
- Responsive behavior is handled entirely by the homepage grid styles

---

## Contact

For questions about adding or standardizing data library icons, contact the DUOS development team.
