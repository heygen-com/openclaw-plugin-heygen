# openclaw-plugin-heygen

[![ClawHub](https://img.shields.io/badge/ClawHub-openclaw--plugin--heygen-blue)](https://clawhub.ai/kenchung/openclaw-plugin-heygen)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Adds [HeyGen](https://www.heygen.com) to OpenClaw in two places:

- **Video:** a first-class provider for the built-in `video_generate` tool. Every agent that already uses `video_generate` (Google Veo, Runway, Kling, Wan, MiniMax, etc.) can now generate identity-preserving avatar videos through the same interface.
- **Voice:** [HeyGen Voice](./docs/heygen-voice.md) as a text-to-speech provider (`tts.provider: "heygen"`), including your workspace's own voice clones.

Requires OpenClaw 2026.9.2 or later.

This is the official HeyGen plugin, maintained by HeyGen. It is published as an external OpenClaw plugin per the [OpenClaw VISION.md](https://github.com/openclaw/openclaw/blob/main/VISION.md) guidance ("If you build a plugin, host and maintain it in your own repository").

## What this plugin does

Unlike cinematic video providers (Veo, Runway, Kling) that excel at open-ended scene generation, HeyGen is built for **identity-first avatar videos**: a specific avatar, a specific voice, scripted narration, and full control over orientation and style. This plugin wires the HeyGen v3 Video Agent surface into OpenClaw so agents can:

- Drop an `avatar_id` / `voice_id` / `style_id` and get a consistent on-brand presenter.
- Pass scene context via file attachments (images) to ground the narration.
- Generate landscape or portrait videos for any channel.
- Receive async completion via webhook (`callback_url` + `callback_id`) or poll to completion.

## When to use HeyGen vs other video providers

Pick HeyGen when the video needs a **recognizable human presenter**: explainer videos, internal training, sales enablement, localized announcements, talking-head content. Pick Veo / Runway / Kling when the video needs **imagined scenes without a fixed identity**: cinematic b-roll, scene generation, non-presenter content.

## Install

**Paste this into your OpenClaw agent.** It does the rest — installs the plugin, asks for your HeyGen API key, runs a verify test, and ends with a working video.

```
Read https://raw.githubusercontent.com/heygen-com/openclaw-plugin-heygen/main/INSTALL_FOR_AGENTS.md and follow it. Ask me for any API keys you need.
```

That's it. The agent fetches [INSTALL_FOR_AGENTS.md](./INSTALL_FOR_AGENTS.md) and walks the rest of the install. Same prompt forever — the install spec lives in the repo, not in your clipboard.

Want to install manually? The short version:

```bash
openclaw plugins install openclaw-plugin-heygen
openclaw gateway restart
```

## Authenticate

Set your HeyGen API key via either:

- Environment variable: `HEYGEN_API_KEY=hg_...`
- CLI: `openclaw onboard --auth-choice heygen-api-key`

Get a key from the [HeyGen API settings page](https://app.heygen.com/settings/api).

## Make it the default video provider

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "heygen/video_agent_v3"
```

## Set a default avatar / voice (optional)

Skip the per-request `avatar_id` / `voice_id` when you always use the same presenter:

```bash
openclaw config set plugins.entries.heygen.config.defaultAvatarId "1e8adb28118944a3a7a8042656f275ed"
openclaw config set plugins.entries.heygen.config.defaultVoiceId  "JB4iKi8Nm2bJl2rrG8ht"
openclaw config set plugins.entries.heygen.config.defaultStyleId  "style_corporate_brief"
```

Per-request `providerOptions.avatar_id` / `voice_id` / `style_id` override the config defaults when set. If neither is set, the field is omitted and HeyGen falls back to the workspace default presenter (or errors).

Need an avatar id? The companion [`heygen-skills`](https://clawhub.ai/eve-builds/heygen-skills) skill on ClawHub uploads a photo, creates a HeyGen avatar via the Avatar V pipeline, and captures the `avatar_id` + `voice_id` pair. Paste into the config block above.

## Usage

```ts
await video_generate({
  model: "heygen/video_agent_v3",
  prompt: "Welcome new agents to HeyGen. Explain the v3 Video Agent API in under 45 seconds.",
  aspectRatio: "16:9",
  providerOptions: {
    avatar_id: "avatar_demo_123",
    voice_id: "voice_demo_456",
    style_id: "style_corporate_brief",
    callback_url: "https://my.app/webhooks/heygen",
    callback_id: "onboarding-welcome-001",
  },
});
```

## Capabilities

- Modes: `generate`, `imageToVideo` (reference image attached as scene context)
- Aspect ratios: `16:9` (landscape), `9:16` (portrait). `1:1` is not supported. HeyGen Video Agent orientation enum is `landscape | portrait` only.
- Max duration: 300 seconds (5 minutes). This is a plugin-side cap, not an API cap. HeyGen will accept longer prompts; bump `MAX_DURATION_SECONDS` in `video-generation-provider.ts` if you need longer renders.
- Reference files: up to 20 input images forwarded as HeyGen file attachments

## Avatar and voice discovery

Use `GET /v3/avatars` to list available avatar groups and looks, and `GET /v3/voices` for voices. The HeyGen CLI is a convenient alternative:

```bash
heygen avatar list
heygen voice list
heygen voice create --prompt "warm confident male narrator" --gender male
```

The `heygen voice create --prompt` command returns up to 3 designed voices matching a natural language description.

## Provider options

HeyGen-specific options passed via `providerOptions`:

| Key              | Type    | Description                                                       |
| ---------------- | ------- | ----------------------------------------------------------------- |
| `avatar_id`      | string  | HeyGen avatar look id (from `GET /v3/avatars`).                   |
| `voice_id`       | string  | HeyGen voice id (from `GET /v3/voices`).                          |
| `style_id`       | string  | Optional curated visual style template id.                        |
| `orientation`    | enum    | `landscape` or `portrait`. Derived from `aspectRatio` if omitted. |
| `callback_url`   | string  | Webhook URL for async completion notifications.                   |
| `callback_id`    | string  | Caller-defined correlation id echoed back in the webhook payload. |
| `incognito_mode` | boolean | Opt out of server-side logging.                                   |

## API reference

- Create session: `POST https://api.heygen.com/v3/video-agents`
- Session poll (when `video_id` is null on create): `GET https://api.heygen.com/v3/video-agents/{session_id}`
- Video poll: `GET https://api.heygen.com/v3/videos/{video_id}`
- Auth header: `X-Api-Key`

See the [HeyGen Video Agent API docs](https://developers.heygen.com/reference/list-video-agent-sessions.md) for full parameter coverage and the bundled [`docs/heygen.md`](./docs/heygen.md) for additional setup notes.

## HeyGen Voice (text-to-speech)

Make HeyGen Voice the speech provider:

```bash
openclaw config set tts.provider heygen
openclaw config set tts.providers.heygen.speakerVoiceId "83548de556df48ba8c09c42a57c51d85"
openclaw infer tts convert --local --provider heygen --text "Hello from OpenClaw." --output hello.mp3
```

`openclaw infer tts voices --provider heygen` lists your workspace voices (including instant and professional clones) and the public voices. Models, directives, output formats and cloning are in [`docs/heygen-voice.md`](./docs/heygen-voice.md).

## Testing

```bash
npm install
npm test
npm run build   # dist/ is what OpenClaw loads from an installed package
```

`speech-provider.test.ts` runs against the real OpenClaw plugin SDK with HTTP mocked, and needs Node 24 (the SDK's own engine floor).

To check the package the way users install it:

```bash
npm pack --pack-destination /tmp
openclaw plugins install npm-pack:/tmp/openclaw-plugin-heygen-<version>.tgz --force --accept-capabilities
openclaw plugins inspect heygen --runtime --json
```

> Note: `video-generation-provider.test.ts` and `plugin-registration.contract.test.ts` came from the OpenClaw monorepo. They depend on its test harnesses (`test/helpers/...`), so `vitest.config.ts` excludes them here.

## Support

- HeyGen API docs: <https://docs.heygen.com>
- HeyGen v3 Video Agent reference: <https://developers.heygen.com/reference/list-video-agent-sessions.md>
- OpenClaw plugin docs: <https://docs.openclaw.com/plugins>
- Issues: <https://github.com/heygen-com/openclaw-plugin-heygen/issues>

## License

MIT — see [LICENSE](./LICENSE).
