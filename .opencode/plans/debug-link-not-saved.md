# Plan: Debugging links that are detected but not saved

## Problem

Some messages with URLs are detected but not saved to the database. Example:
- `"cómo mola: https://nan.builders/"` → URL detected, never saved
- `"https://huggingface.co/datasets/..."` → works fine
- `"https://github.com/..."` → works fine

The key difference: `nan.builders` has `sourceId: 'other'` (not in `DOMAIN_SOURCE_MAP`), while `huggingface.co` and `github.com` are known sources.

## Current logs

```
[LINK] Message received from borja87_gb ...: "cómo mola: https://nan.builders/"
[LINK] Message received from borja87_gb ...: "No me lo añades? https://nan.builders/"
```

No `[LINK] Saved X` log follows the `nan.builders` messages. This means either:
1. `detected.length === 0` (regex didn't match) — but the user says the bot detects it
2. The save loop runs but `savedCount === 0` and `DISABLE_LINK_REPLY === 'true'`
3. Something throws before the loop

## Plan

Add detailed logging in `saveLink` and the save loop in `packages/bot/src/events/messageCreate.ts`:

### 1. In `saveLink` function (line 146-188)
- Log at entry: `url`, `domain`, `sourceId`, author tag
- Log after `ensureSource`: sourceId used
- Log after `ensureUser`: result boolean
- Log after `ensureChannel`: channel name + result
- Log before `prisma.link.create`: the URL
- On P2002 duplicate: log it explicitly with `[LINK] Duplicate link (P2002): {url}`
- On other errors: log the error type and message

### 2. In the save loop (line 219-230)
- Log each iteration: URL being processed and whether it was saved or duplicate
- Log `hasDuplicate` flag at the end

### 3. Expected outcome
After rebuild + redeploy, the logs will show exactly where `nan.builders` fails:
- If it says "Duplicate link (P2002)" → it's already in DB (maybe with different format)
- If it says "Link created successfully" → it IS being saved, the issue is elsewhere
- If it throws an unexpected error → we'll see the error details

## Files to modify

- `packages/bot/src/events/messageCreate.ts` — add logging to `saveLink` and the save loop
