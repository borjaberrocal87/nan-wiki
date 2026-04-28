# Plan: Update Wiki Dashboard Table + Metrics

## Goal
Update the Wiki Dashboard table to match the Stitch "Wiki Dashboard" design with 7 columns (ID, URL, Domain, Source, Author, Channel, Message) and add metrics cards at the bottom showing Total Entries and user contribution percentage.

## Changes

### 1. LinkTable (`packages/web/src/components/links/LinkTable.tsx`)
Replace the 5-column layout with 7 columns:
- **ID** (`#WK-XXXX`) - random monospace ID generated per row
- **URL** - full URL with `open_in_new` icon, clickable link to external site
- **Domain** - extracted from URL (hostname), monospace font
- **Source** - colored badge with label (GitHub, Twitter, etc.)
- **Author** - avatar circle with initial + username
- **Channel** - `#channel-name` format, monospace
- **Message** - truncated `description` field (2 lines), shows "—" if empty

Helpers:
- `generateId(index)` - creates random `#WK-XXXX` IDs
- `extractDomain(url)` - extracts hostname from URL, strips `www.`

### 2. LinkTableRowSkeleton (`packages/web/src/components/links/LinkTableRowSkeleton.tsx`)
Update skeleton to match 7-column layout with appropriate widths per column.

### 3. LinkGrid inline skeleton (`packages/web/src/components/links/LinkGrid.tsx`)
Update the inline skeleton table headers (loading state, lines ~174-178) to match the 7 new columns.

### 4. New MetricsCards component (`packages/web/src/components/links/MetricsCards.tsx`)
Create new component with 3 metric cards:
- **Total Entries** - shows `total` from useLinks hook
- **My Contributions** - shows percentage of links created by logged-in user vs total
- Layout: 3 cards in a row with icons, title, value, and subtle styling

Props:
```typescript
interface MetricsCardsProps {
  totalEntries: number;
  userLinkCount: number;
}
```

### 5. Update LinkGrid layout (`packages/web/src/components/links/LinkGrid.tsx`)
- Remove Export CSV button (user requested removal)
- Keep Filter button
- Add MetricsCards below the table/grid and above pagination
- Pass `total` from useLinks to MetricsCards
- Need to fetch user's link count (either via separate API call or calculate from current page data)

### 6. Auth context for user contribution %
Need to determine how to count user's links. Options:
- Add API endpoint to get user's link count
- Use client-side calculation from fetched data
- Store user ID in context and filter
