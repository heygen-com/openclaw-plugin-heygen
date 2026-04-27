# openclaw-plugin-heygen — Installation Guide for AI Agents

Read this entire file, then follow the steps. Ask the user for the HeyGen API
key when needed. Target: ~3 minutes to a working integration.

This plugin is for **OpenClaw users only**. If the user is on Claude Code,
Codex, Cursor, or another agent host, install
[heygen-skills](https://github.com/heygen-com/skills) instead — it covers
every host.

This file is the agent-facing companion to [`README.md`](./README.md). Where
they overlap, this file is canonical for agent-driven installs.

## Step 0: If you are not Claude Code

Read [`README.md`](./README.md) at the repo root first. It describes the
plugin's surface, provider options, and the runtime contract for
`video_generate`. Claude Code reads project context automatically; other
agents should fetch it explicitly.

If you fetched this file by URL without cloning yet, the companion files live
at:

- `https://raw.githubusercontent.com/heygen-com/openclaw-plugin-heygen/main/README.md` — full reference
- `https://raw.githubusercontent.com/heygen-com/openclaw-plugin-heygen/main/SKILL.md` — ClawHub manifest

## Step 1: Confirm the user is on OpenClaw

Run:

```bash
openclaw --version
```

If the command is not found, the user is not on OpenClaw. Stop here and
recommend they install [heygen-skills](https://github.com/heygen-com/skills)
instead, which works across Claude Code, Codex, Cursor, Hermes, and OpenClaw.

The plugin requires OpenClaw `>=2026.3.24-beta.2` (per `package.json`
`peerDependencies`). If the user is on an older version, upgrade them first.

## Step 2: Get the user's HeyGen API key

Ask the user for their HeyGen API key. They get it from
[app.heygen.com/settings/api](https://app.heygen.com/settings/api) (Settings →
API → New Key). Tell them: *the key is shown once, copy it before closing
the modal.*

The HeyGen API is currently pay-as-you-go in credits — no free tier. Avatar V
costs roughly 6 credits per minute of generated video. Make sure the user has
credits or is on a paid plan before proceeding. Pricing changes; if the user
asks for current rates, point them at
[help.heygen.com/api-pricing](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained).

## Step 2.5: Does the user have an avatar already?

Ask the user: **"Have you already created a HeyGen avatar (do you have an
`avatar_id` and `voice_id`)?"**

- **If yes** → continue to Step 3. The verify step in Step 4 will use those
  ids.
- **If no** → install the [heygen-skills](https://github.com/heygen-com/skills)
  skill *first*. The `heygen-avatar` sub-skill walks the user through the
  Avatar V flow (15-second webcam recording → digital twin → returns the
  `avatar_id` and `voice_id`). Without that, the verify step in Step 4 has
  nothing to point at. Then come back here and resume from Step 3.

This plugin handles the `video_generate` call surface. It does not handle
avatar / voice discovery or creation. That's the skill's job.

## Step 3: Install the plugin

```bash
openclaw plugins install openclaw-plugin-heygen
```

Set the API key. The plugin reads `HEYGEN_API_KEY` from the environment, or
from `openclaw onboard --auth-choice heygen-api-key` (which writes it to
config). Use whichever fits the user's preference:

```bash
# Env-var path (faster, agent-friendly):
export HEYGEN_API_KEY=hg_...

# Or config-file path:
openclaw onboard --auth-choice heygen-api-key
```

Restart the gateway to pick up the new provider registration:

```bash
openclaw gateway restart
```

Verify the plugin loaded. Use the JSON output if available — easier for the
agent to parse:

```bash
openclaw plugins list --json
```

Expected: an entry with `id: "heygen"` and the plugin version. If `--json`
is not available on the user's OpenClaw build, fall back to:

```bash
openclaw plugins list | grep heygen
```

## Step 4: Verify with a real video generation (opt-in)

Ask the user: **"Want to run a 5-second smoke test? It generates a real
video, costs roughly half a credit, and confirms the integration works
end-to-end."**

If yes, run the test. Use the `avatar_id` and `voice_id` from Step 2.5:

```
Use video_generate({
  model: "heygen/video_agent_v3",
  prompt: "HeyGen plugin install working, ready to ship.",
  aspectRatio: "16:9",
  providerOptions: {
    avatar_id: "<the user's avatar_id>",
    voice_id: "<the user's voice_id>"
  }
}) and return the saved file path.
```

Expected outcome: a `.mp4` file roughly 1-3 MB, ~5 seconds long, with the
avatar speaking the test line.

If the user declines, skip to Step 5. The plugin works either way; the smoke
test just removes uncertainty about wiring.

## Step 5: Set defaults so the user does not repeat ids (optional)

If the user always uses the same presenter, save the avatar / voice / style
ids as plugin config so per-request `providerOptions` become optional:

```bash
openclaw config set plugins.entries.heygen.config.defaultAvatarId "<avatar_id>"
openclaw config set plugins.entries.heygen.config.defaultVoiceId  "<voice_id>"
openclaw config set plugins.entries.heygen.config.defaultStyleId  "<style_id>"
```

After this, `video_generate` calls without explicit avatar / voice ids fall
back to these. Per-request `providerOptions.avatar_id` / `voice_id` /
`style_id` override the config defaults when set.

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
> - "Generate a video and POST the result to my webhook when done" — pass
>   `providerOptions.callback_url` (the webhook URL) and `providerOptions.callback_id`
>   (a correlation id of your choosing). The plugin will return immediately
>   with the session id; HeyGen calls your webhook when the video is ready.

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

**`heygen` not in `openclaw plugins list` after install.** The gateway did
not restart cleanly. Run `openclaw gateway restart` again and wait 5-10
seconds for the registration to propagate.

**`HeyGen API key not configured` from the plugin.** Either `HEYGEN_API_KEY`
is not in the env the gateway inherited, or the `openclaw onboard` step did
not save the key. Check `~/.openclaw/openclaw.json` for
`plugins.entries.heygen.auth.apiKey`, or `echo $HEYGEN_API_KEY` in the same
shell that started the gateway. Re-run the onboard or re-export the env var
in the gateway's shell, then restart the gateway.

**`waiting_for_input` from the Video Agent.** The plugin always passes
`mode: "generate"` for one-shot generation. If you see this error, the
plugin is misconfigured upstream — file an issue at
https://github.com/heygen-com/openclaw-plugin-heygen/issues with the session
id from the error message.

**402 Payment Required.** The user is out of HeyGen credits. Tell them, then
point them at [app.heygen.com/billing](https://app.heygen.com/billing).

**404 from the create call mentioning avatar or voice.** The `avatar_id` or
`voice_id` in the request does not exist on the user's account. Ask the user
to confirm which avatars they own, or use the `heygen-avatar` sub-skill to
list / create one.

## What this plugin does NOT do

- **Avatar / voice creation.** Use [heygen-skills](https://github.com/heygen-com/skills)
  for the Avatar V record-yourself flow.
- **Account creation.** The user must already have a HeyGen account with
  API access.
- **Plan / billing management.** The plugin reads credits, never tops them
  up. Send the user to [app.heygen.com/billing](https://app.heygen.com/billing).

## Canonical install sources

- **OpenClaw plugin (this repo)** — `openclaw plugins install openclaw-plugin-heygen`
- **Skill (companion)** — `clawhub install heygen-skills` *or* clone from
  [github.com/heygen-com/skills](https://github.com/heygen-com/skills). The
  ClawHub install is the canonical install path; the GitHub repo is the
  source of truth.
