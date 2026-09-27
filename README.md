# Make a music video with Katagami

An agent skill that turns any song into a lyric music video: word-timed lyrics, one code-drawn scene per line in Katagami looks, rendered with HyperFrames at 16:9 and native 9:16.

<video src="https://github.com/arni-labs/katagami-music-video/raw/main/media/clanker-im-fine.mp4" controls muted playsinline width="100%"></video>

Tap the film to restyle it live: https://arnilabs.ai/clanker-im-fine/

## Install

```sh
git clone https://github.com/arni-labs/katagami-music-video ~/.claude/skills/katagami-music-video
claude mcp add --transport http katagami https://katagami.ai/mcp
```

The Katagami MCP asks you to sign in with Google once. For other clients, see https://katagami.ai/connect.

Then ask your agent for a music video.

Made while making Clanker, I'm Fine by arni × Claude Opus 5.5 × Suno.
