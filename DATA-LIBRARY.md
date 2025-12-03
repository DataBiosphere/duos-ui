## Adding the "Example" Data Library

Let's walk through adding a new featured data library for the "Example" organization.

### Step 1: Prepare and Add Logo File

First, obtain the logo file and optimize it:
- Original file: `example-logo.svg`
- Optimized to < 100KB
- Verified logo looks good on white background
- File placed in: `src/images/example-logo.svg`

### Step 2: Update libraryVersions.ts

Open `src/libs/libraryVersions.ts` and make the following changes:

**Add import at the top (alphabetically with other imports):**
```typescript
import exampleIcon from 'src/images/example-logo.svg'
```

**Add configuration entry (after line 532, before 'ncpi-duo'):**
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
  order: 22,  // Next sequential number after current max (21)
},
```

### Step 3: Verify the Configuration

The complete entry in context:

```typescript
// ... existing imports ...
import exampleIcon from 'src/images/example-logo.svg'

export const getLibraryVersions = (
  institutionId: number | null,
  institutionName: string | null,
  customQuery: string | null,
): LibraryVersions => {
  return {
    // ... existing libraries ...
    'example': {
      query: {
        match_phrase: {
          'study.description': 'Example',
        },
      },
      icon: exampleIcon,
      title: 'Example Data Library',
      featured: true,
      order: 22,
    },
    'ncpi-duo': {
      query: {
        match_phrase: {
          'study.description': 'NCPI DUO',
        },
      },
      icon: ncpiIcon,
      title: 'NCPI DUO Data Library',
      featured: false,
      order: 999,
    },
    // ... rest of configuration ...
  }
}
```

### Step 4: How It Works on the Homepage

Once deployed, the library will automatically appear on the homepage:

1. **Card Display**: 
   - Logo displays in a 320px × 160px card
   - Library name "Example" appears below (without "Data Library")
   
2. **User Interaction**:
   - Authenticated users: Click to go to `/datalibrary/example`
   - Unauthenticated users: See tooltip "Please login to access Example Data Library"
   
3. **Responsive Behavior**:
   - Desktop: Full size with other libraries in grid
   - Tablet: Resizes to 280px × 140px
   - Mobile: Full width, max 320px × 160px

### Step 5: Alternative Query Patterns

Depending on your needs, you can use different query patterns:

**Search by Institution Name:**
```typescript
'example': {
  query: {
    match_phrase: {
      'submitter.institution.name': 'Example',
    },
  },
  icon: exampleIcon,
  title: 'Example Data Library',
  featured: true,
  order: 22,
},
```

**Search by Multiple Criteria:**
```typescript
'example': {
  query: {
    bool: {
      should: [
        {
          match_phrase: {
            'study.description': 'Example',
          },
        },
        {
          match_phrase: {
            'study.description': 'EX',
          },
        },
        {
          match_phrase: {
            'submitter.institution.name': 'Example Organization',
          },
        },
      ],
    },
  },
  icon: exampleIcon,
  title: 'Example Data Library',
  featured: true,
  order: 22,
},
```

### Step 6: Special Styling (If Needed)

If your logo needs a dark background like the Broad Institute:

1. Update `Home.jsx` around line 106:
```javascript
// Special styling for Broad Institute and Example (dark background)
const cardStyle = library.key === 'broad' || library.key === 'example'
  ? { ...baseCard, background: '#1F3B50', padding: '15px' }
  : baseCard
```

2. Import a white version of the logo in `Home.jsx`:
```javascript
import exampleLogo from '../images/example-logo-white.svg'
```

3. Update the logoSrc logic:
```javascript
const logoSrc = library.key === 'broad'
  ? broadLogo
  : library.key === 'example'
  ? exampleLogo
  : library.icon
```

## Testing Checklist

After adding a library icon:

- [ ] Logo displays correctly in homepage grid
- [ ] Logo maintains aspect ratio in card
- [ ] Library name appears below logo without "Data Library"
- [ ] Tooltip shows correct text on hover
- [ ] Link works for authenticated users
- [ ] Login redirect works for unauthenticated users
- [ ] Logo displays properly on mobile devices
- [ ] Logo appears in correct sort order

## Notes

- No changes needed in `Home.jsx` when adding new library icons
- The component automatically reads icons from `libraryVersions.ts`
- Logo cards are automatically generated from the configuration
- The grid layout is responsive and adjusts to screen size

## Contact

For questions about adding data library icons, contact the DUOS development team.