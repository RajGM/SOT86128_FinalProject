# Climate Diplomacy — SOT86128 Final Project

Multiplayer environmental politics simulation (POL23200). Playable app lives in [`climate-diplomacy/`](climate-diplomacy/).

## Documentation

| File | Purpose |
|------|---------|
| [v1_complete.md](v1_complete.md) | Game mechanics as implemented (source of truth) |
| [report_full_draft.md](report_full_draft.md) | Full academic report |
| [report_5page.md](report_5page.md) | Short report version |
| [READING_SCRIPT.md](READING_SCRIPT.md) | Presentation walkthrough script |
| [Module.md](Module.md) | Course module details (POL23200) |

## Run locally

```bash
cd climate-diplomacy
npm install
npm run dev
```

- **Multiplayer:** landing page → host or join (Firebase required, see `climate-diplomacy/.env.example`)
- **Single-player test:** [/test](http://localhost:5173/test) — cycle-15 scenario
