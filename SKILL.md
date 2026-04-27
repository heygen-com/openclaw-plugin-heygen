---
name: openclaw-plugin-heygen
display_name: HeyGen Video Agent
description: |
  Official HeyGen plugin for OpenClaw — adds HeyGen as a first-class provider for the
  built-in video_generate tool. Identity-first avatar videos: pick an avatar_id, a voice,
  a script, and get an on-brand presenter video back.
  Use when: (1) generating a video where a specific avatar/person speaks specific lines,
  (2) "make a video of me / our brand presenter", (3) outreach, announcements, pitch decks,
  product walkthroughs, or any presenter-led video, (4) needing landscape or portrait output
  with deterministic aspect ratios, (5) integrating HeyGen into an OpenClaw agent through the
  standard provider interface (no bespoke REST glue required).
  Covers: HeyGen v3 Video Agent (api.heygen.com), avatar-presenter video, identity-preserving
  video, talking-head AI video, scripted avatar narration, brand spokesperson video.
  NOT for: cinematic b-roll (use Veo / Runway / Kling), video translation, TTS-only,
  streaming avatars, or photo-to-talking-head v2 pipelines.
version: 0.1.2
homepage: https://github.com/heygen-com/openclaw-plugin-heygen
license: MIT
metadata:
  openclaw:
    type: plugin
    requires:
      env:
        - HEYGEN_API_KEY
    primaryEnv: HEYGEN_API_KEY
    registers:
      - videoGenerationProvider: heygen
    models:
      - heygen/video_agent_v3
  hermes:
    tags: [heygen, avatar, video, presenter, identity, video-agent, openclaw-plugin]
    category: media
---

# HeyGen Video Agent — OpenClaw Plugin

Adds [HeyGen](https://www.heygen.com) as a first-class provider for OpenClaw's built-in `video_generate` tool. Same interface every other video provider in OpenClaw uses (Google Veo, Runway, Kling, Wan, MiniMax, Dashscope) — now with identity-preserving avatar/presenter video.

## Install

```bash
openclaw plugin install heygen
```

Set `HEYGEN_API_KEY` in your environment (get one at <https://app.heygen.com/settings/api>).

## Quick start

```ts
const result = await video_generate({
  model: "heygen/video_agent_v3",
  prompt: "Hi team, here's the product update for this week.",
  providerOptions: {
    avatar_id: "<your-avatar-id>",
    voice_id: "<your-voice-id>",
    orientation: "landscape", // or "portrait"
  },
});
// result.url → downloadable .mp4
```

Avatar / voice ids: list from the HeyGen dashboard or the [`heygen-skills`](https://clawhub.ai/eve-builds/heygen-skills) companion skill (which composes opinionated avatar/voice picking on top of this plugin).

## When HeyGen vs other video providers

- **Avatar-presenter / talking-head video** → HeyGen.
- **Cinematic / scene generation** → Veo, Runway, Kling.
- **Translation / dubbing** → use HeyGen's translate APIs (separate skill).
- **Real-time interactive avatar** → HeyGen Streaming Avatar (separate surface, not this plugin).

## Provider options

| Field | Type | Notes |
|-------|------|-------|
| `avatar_id` | string | HeyGen avatar id; falls back to `models.providers.heygen.defaultAvatarId`. |
| `voice_id` | string | HeyGen voice id; falls back to `models.providers.heygen.defaultVoiceId`. |
| `style_id` | string | Optional style template. |
| `orientation` | `"landscape" \| "portrait"` | Maps from aspect ratio. `1:1` rejected. |
| `mode` | `"generate" \| "chat"` | Default `generate`. `chat` keeps full poll budget for interactive flows. |
| `callback_url` | string | Async webhook completion. |
| `callback_id` | string | Caller-supplied correlation id for the webhook. |
| `incognito_mode` | boolean | Skip retention on HeyGen side where supported. |

## Errors surfaced cleanly

- `401` → `HeyGen API key missing or invalid`
- `402` / quota → `HeyGen credit limit reached`
- Generate-mode + 8 consecutive `thinking` polls → fast-fail with a hint pointing at `avatar_id` / `voice_id`.
- `failed` status surfaces HeyGen's `failure_message` rather than a generic error.

## Polling

Three-tier backoff: 5s × 6 → 15s × 12 → 30s until `MAX_POLL_ATTEMPTS`. Long renders (20–45 min) stay under typical HeyGen per-key rate limits.

## Source + tests

- Repo: <https://github.com/heygen-com/openclaw-plugin-heygen>
- 19 unit tests, live smoke verified end-to-end against `api.heygen.com`.
- Extracted from [openclaw/openclaw#69578](https://github.com/openclaw/openclaw/pull/69578) (closed in favor of external/ClawHub publication per [VISION.md](https://github.com/openclaw/openclaw/blob/main/VISION.md)).

## License

MIT. See [LICENSE](./LICENSE).
