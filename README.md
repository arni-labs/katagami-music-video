# Make a music video with Katagami

An agent skill that turns any song (or an idea for one) into a music video with word-timed lyrics and looks from the Katagami library. It works in two modes:

- **The code film:** every frame drawn in JavaScript (generated images are only references, never shown), at 16:9 and native 9:16, with an optional page where viewers restyle the film live.
- **The cinematic cut:** generated video shots cut on the beat, with every lyric set in code on top, at 16:9.

Both come with a release kit: versions for each platform, covers, a Katagami recipe draft and post drafts.

https://github.com/user-attachments/assets/11b08858-6a57-4e33-bf58-fd67a676ee9d

The first 60 seconds of Clanker, I'm Fine, a code film. Watch the full video, and tap it to restyle it live: https://arnilabs.ai/clanker-im-fine/

Yesterday's Taste, a code film that switches design languages on the beat: https://arnilabs.ai/yesterdays-taste/ and its recipe on Katagami: https://katagami.ai/recipes/yesterdays-taste

## Install

```sh
git clone https://github.com/arni-labs/katagami-music-video ~/.claude/skills/katagami-music-video
claude mcp add --transport http katagami https://katagami.ai/mcp
```

The Katagami MCP asks you to sign in with Google once. For other clients, see https://katagami.ai/connect.

Then ask your agent for a music video.

Made while making Clanker, I'm Fine by arni × Claude Opus 5.5 × Suno, and Yesterday's Taste.
