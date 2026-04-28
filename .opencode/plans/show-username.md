# Plan

## Goal
Show the Discord username instead of the user UUID in the links display.

## Problem
In `LinkCard.tsx:14`, the author is displayed as `User {author_id}` which shows the numeric ID instead of the username.

## Changes

### 1. API Schema (`packages/api/src/schemas.py`)
Add `author_username: str | None = None` field to `LinkRead` schema.

### 2. API Service (`packages/api/src/services/link_service.py`)
- In `list()` method, add an outer join with `User` table to fetch the `username`
- Change query to select both `Link` and `User.username`
- Apply same join to `total_query`

### 3. Frontend API Interface (`packages/web/src/lib/api.ts`)
Add `author_username: string | null;` to `LinkItem` interface.

### 4. Frontend LinkCard (`packages/web/src/components/links/LinkCard.tsx`)
Change line 14 from:
```
const authorName = link.author_id ? `User ${link.author_id}` : null;
```
to:
```
const authorName = link.author_username || (link.author_id ? `User ${link.author_id}` : null);
```
