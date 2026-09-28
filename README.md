# Rodrigo Hits Beat Store — GitHub upload package

## Add a new beat
1. Upload the demo to `audio/RH009.mp3`
2. Upload the cover to `covers/RH009.jpg`
3. Open `beats.json`
4. Add one object with `id`, `name`, `genre`, `bpm`, and `mood`.
5. Commit to GitHub. Cloudflare will publish the update.

Example:
```json
{
  "id": "RH009",
  "name": "MY NEW BEAT",
  "genre": "Trap",
  "bpm": 98,
  "mood": "Dark"
}
```

### Languages
The site supports Italian, English, Spanish, French, German, Portuguese, Chinese, Japanese, Korean and Arabic.

Genre and mood values are translated automatically when a matching translation exists. You only enter each value once in `beats.json`. If you introduce a completely new genre or mood that is not in the built-in translation dictionary, the site safely displays the original value until that value is added to the dictionary.

The IDs are internal only and are not displayed to customers. They connect the beat to `audio/RHxxx.mp3` and `covers/RHxxx.jpg`.
