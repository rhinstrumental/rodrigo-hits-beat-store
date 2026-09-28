# Rodrigo Hits Beat Store — Catalog Management

## Add a new beat
1. Upload the demo to `audio/RH009.mp3`
2. Upload the cover to `covers/RH009.jpg`
3. Open `beats.json`
4. Add one object with `id`, `name`, `genre`, `bpm`, `mood`, and `description`.
5. Commit/push to GitHub. Cloudflare will publish the update.

The ID is internal only and is never displayed to customers. It links the beat name to `audio/RHxxx.mp3` and `covers/RHxxx.jpg`.

Example:
```json
{
  "id": "RH009",
  "name": "MY NEW BEAT",
  "genre": "Trap",
  "bpm": 98,
  "mood": "Dark",
  "description": "Short internal catalog description."
}
```

Do not remove existing entries unless you also remove their audio/cover files.
