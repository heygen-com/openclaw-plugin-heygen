# openclaw-plugin-heygen — Installation Guide for AI Agents

Read this entire file, then follow the steps. Ask the user for the HeyGen API
key when needed. Target: ~3 minutes to a working integration.

This plugin is for **OpenClaw users only**. If the user is on Claude Code,
Codex, Cursor, or another agent host, install
[heygen-skills](https://github.com/heygen-com/skills) instead — it covers
every host.

## Step 0: If you are not Claude Code

Read `README.md` at the repo root first. It describes the plugin's surface,
provider options, and the runtime contract for `video_generate`.

If you fetched this file by URL without cloning yet, the companion files live at:

- `https://raw.githubusercontent.com/heygen-com/openclaw-plugin-heygen/main/README.md` — full reference
- `https://raw.githubusercontent.com/heygen-com/openclaw-plugin-heygen/main/SKILL.md` — ClawHub manifest

## Step 1: Confirm the user is on OpenClaw

Run:

```bash
openclaw --version
```

If the command is not found, the user is not on OpenClaw. Stop here and
recommend they install [heygen-skills](https://github.com/heygen-com/skills)
instead, which works across Claude Code / Codex / Cursor / Hermes / OpenClaw.

If OpenClaw is installed but on an old version, recommend they upgrade — the
plugin requires OpenClaw 2026.4.0 or later (for the
`api.registerVideoGenerationProvider` plugin SDK surface).

## Step 2: Get the user's HeyGen API key

Ask the user for their HeyGen API key. They get it from
[app.heygen.com/api](https://app.heygen.com/api) (Settings → API → New Key).
Tell them: *the key is shown once, copy it before closing the modal.*

There is no free tier for the API as of 2026. Pricing is pay-as-you-go in
credits. Avatar V costs ~6 credits per minute of generated video. Make sure
the user has credits or is on a paid plan before proceeding.

## Step 3: Install the plugin

```bash
openclaw plugins install openclaw-plugin-heygen
openclaw onboard --auth-choice heygen-api-key
openclaw gateway restart
```

The `onboard` step prompts for the key (paste from Step 2). The gateway
restart picks up the new provider registration.

Verify:

```bash
openclaw plugins list | grep heygen
```

Expected output: a single line with `heygen` and the plugin version.

## Step 4: Verify with a real video generation

Generate a 5-second test clip end-to-end. This confirms auth, provider
registration, and `video_generate` routing all work.

In the agent chat, run:

```
Use video_generate({
  model: "heygen/video_agent_v3",
  prompt: "HeyGen plugin install working, ready to ship.",
  aspectRatio: "16:9",
  providerOptions: {
    avatar_id: "<a stock or user avatar id>",
    voice_id: "<a stock or user voice id>"
  }
}) and return the saved file path.
```

Expected outcome: a `.mp4` file roughly 1-3 MB, ~5 seconds long, with the
avatar speaking the test line.

If the user does not have an `avatar_id` or `voice_id` yet, install the
[heygen-skills](https://github.com/heygen-com/skills) skill on top of this
plugin. The `heygen-avatar` sub-skill walks them through creating one via the
Avatar V flow (15-second webcam recording → digital twin).

## Step 5: Set defaults so the user does not repeat ids (optional)

If the user always uses the same presenter, save the avatar / voice / style
ids as plugin config so per-request providerOptions become optional:

```bash
openclaw config set plugins.entries.heygen.config.defaultAvatarId "<avatar_id>"
openclaw config set plugins.entries.heygen.config.defaultVoiceId  "<voice_id>"
openclaw config set plugins.entries.heygen.config.defaultStyleId  "<style_id>"
```

After this, `video_generate` calls without explicit avatar/voice ids fall
back to these.

## Step 6: Make HeyGen the default video provider (optional)

If the user wants `video_generate(...)` to default to HeyGen when no model is
specified:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "heygen/video_agent_v3"
```

Now any agent in this OpenClaw instance that calls `video_generate(...)`
without specifying a model lands on HeyGen.

## Step 7: Done

The plugin is installed and verified. Tell the user:

> openclaw-plugin-heygen is installed. Try:
> - "Generate a 30-second video of me explaining what I'm working on this week"
> - "Make a 60-second product walkthrough of feature X"
> - "Send a video update via webhook when this finishes"
>   (uses providerOptions.callback_url + callback_id)

The plugin handles auth, session creation, three-tier polling backoff, and
error surfacing. Avatar / voice discovery is not in this plugin — install
[heygen-skills](https://github.com/heygen-com/skills) for that flow.

## Upgrade

```bash
openclaw plugins update openclaw-plugin-heygen
openclaw gateway restart
```

The gateway restart re-registers the provider with whatever surface changed.

## Troubleshooting

**`heygen` not in `openclaw plugins list` after install.**
The gateway did not restart cleanly. Run `openclaw gateway restart` again
and wait 5-10 seconds for the registration to propagate.

**`HeyGen API key not configured` from the plugin.**
The `openclaw onboard` step did not save the key. Check
`~/.openclaw/openclaw.json` for `plugins.entries.heygen.auth.apiKey` and
re-run the onboard if missing.

**`waiting_for_input` from the Video Agent.**
The plugin always passes `mode: "generate"` for one-shot generation. If you
see this error, the plugin version is older than 0.1.1 — upgrade.

**402 Payment Required.**
The user is out of HeyGen credits. Tell them, then point them at
[app.heygen.com/billing](https://app.heygen.com/billing).

**404 from the create call mentioning avatar or voice.**
The `avatar_id` or `voice_id` in the request does not exist on the user's
account. Ask the user to confirm which avatars they own, or use a stock
avatar from `heygen avatar list`.

## What this plugin does NOT do

- **Avatar / voice creation.** Use `heygen-skills` (the SKILL.md repo) for
  the Avatar V record-yourself flow.
- **Account creation.** The user must already have a HeyGen account with
  API access.
- **Plan / billing management.** The plugin reads credits, never tops them
  up. Send the user to [app.heygen.com/billing](https://app.heygen.com/billing).
