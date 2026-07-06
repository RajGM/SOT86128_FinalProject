# Audio Spec — Climate Diplomacy Game

Minimal, clean UI sounds with subtle strategic-game atmosphere. All assets CC0 or royalty-free (no attribution required). Academic project — zero licensing risk.

---

## Audio Manager

Single `AudioManager` class. Singleton. Lazy-loads sounds on first use. All volumes configurable. Master mute toggle in settings.

```typescript
// src/audio/AudioManager.ts

interface AudioConfig {
  masterVolume: number;    // 0.0–1.0, default 0.6
  musicVolume: number;     // 0.0–1.0, default 0.3
  sfxVolume: number;       // 0.0–1.0, default 0.5
  muted: boolean;
}

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: HTMLAudioElement | null = null;
  private config: AudioConfig;

  play(soundId: string): void;        // fire-and-forget SFX
  playMusic(trackId: string): void;   // loop background music
  stopMusic(): void;
  fadeMusic(targetVolume: number, durationMs: number): void;
  setVolume(category: 'master' | 'music' | 'sfx', value: number): void;
  mute(): void;
  unmute(): void;
}
```

---

## File Naming Convention

```
src/assets/audio/
├── music/
│   ├── ambient-main.mp3          # main gameplay loop
│   ├── ambient-tension.mp3       # crisis/high-temp state
│   └── ambient-summit.mp3        # summit voting phase
├── ui/
│   ├── click.mp3                 # generic button click
│   ├── tab-switch.mp3            # panel/tab change
│   ├── hover.mp3                 # optional hover feedback
│   ├── open-panel.mp3            # panel opens (slide sound)
│   ├── close-panel.mp3           # panel closes
│   └── toggle.mp3               # checkbox/switch toggle
├── game/
│   ├── build-place.mp3           # building placed on hex
│   ├── build-upgrade.mp3         # building upgraded
│   ├── build-demolish.mp3        # building demolished
│   ├── cycle-tick.mp3            # countdown tick (last 10 sec)
│   ├── cycle-complete.mp3        # cycle finished chime
│   ├── trade-propose.mp3         # trade proposal sent
│   ├── trade-accept.mp3          # trade accepted
│   ├── trade-reject.mp3          # trade rejected/cancelled
│   ├── coin.mp3                  # money transaction feedback
│   └── slider-tick.mp3           # carbon tax slider adjustment
├── alerts/
│   ├── warning.mp3               # resource shortage, low happiness
│   ├── crisis.mp3                # happiness below 30
│   ├── temp-milestone.mp3        # temperature crosses threshold
│   └── summit-gavel.mp3          # summit resolution vote called
└── summit/
    ├── vote-cast.mp3             # player casts vote
    ├── resolution-pass.mp3       # resolution passes
    └── resolution-fail.mp3       # resolution fails
```

All files: MP3, 44.1kHz, mono, < 100KB each (music < 2MB).

---

## Sound Events & Triggers

### UI Sounds

| Event | Sound File | Volume | Trigger |
|-------|-----------|--------|---------|
| Button click | `ui/click.mp3` | 0.4 | Any button `onClick` |
| Tab switch | `ui/tab-switch.mp3` | 0.3 | Tab/panel navigation |
| Panel open | `ui/open-panel.mp3` | 0.3 | Trade panel, country panel, dashboard opens |
| Panel close | `ui/close-panel.mp3` | 0.25 | Any panel closes |
| Toggle | `ui/toggle.mp3` | 0.3 | Checkbox, switch toggle |

### Building Sounds

| Event | Sound File | Volume | Trigger |
|-------|-----------|--------|---------|
| Place building | `game/build-place.mp3` | 0.5 | `buildOnTile()` success |
| Upgrade building | `game/build-upgrade.mp3` | 0.5 | `upgradeBuilding()` success |
| Demolish building | `game/build-demolish.mp3` | 0.45 | `demolishBuilding()` success |

### Trade Sounds

| Event | Sound File | Volume | Trigger |
|-------|-----------|--------|---------|
| Proposal sent | `game/trade-propose.mp3` | 0.4 | Trade proposal created |
| Trade accepted | `game/trade-accept.mp3` | 0.5 | Counter-party accepts |
| Trade rejected | `game/trade-reject.mp3` | 0.4 | Counter-party rejects or cancels |
| Money transfer | `game/coin.mp3` | 0.3 | Visual feedback on money movement |

### Cycle Sounds

| Event | Sound File | Volume | Trigger |
|-------|-----------|--------|---------|
| Countdown tick | `game/cycle-tick.mp3` | 0.25 | Last 10 seconds of turn timer, every second |
| Cycle complete | `game/cycle-complete.mp3` | 0.5 | `processCycle()` finishes |
| Carbon tax adjust | `game/slider-tick.mp3` | 0.15 | Carbon tax slider moves by 5 |

### Alert Sounds

| Event | Sound File | Volume | Trigger |
|-------|-----------|--------|---------|
| Resource warning | `alerts/warning.mp3` | 0.5 | Food < 10 OR energy < 10 OR money < 10 |
| Happiness crisis | `alerts/crisis.mp3` | 0.6 | Happiness drops below 30 |
| Temperature milestone | `alerts/temp-milestone.mp3` | 0.55 | Global temp crosses +1.5, +2.0, +2.5, +3.0 |
| Summit called | `alerts/summit-gavel.mp3` | 0.5 | Summit resolution triggered |

### Summit Sounds

| Event | Sound File | Volume | Trigger |
|-------|-----------|--------|---------|
| Vote cast | `summit/vote-cast.mp3` | 0.4 | Player clicks YES/NO/ABSTAIN |
| Resolution passed | `summit/resolution-pass.mp3` | 0.5 | Majority YES after timer |
| Resolution failed | `summit/resolution-fail.mp3` | 0.45 | Majority NO after timer |

### Background Music

| State | Track | Volume | Loop |
|-------|-------|--------|------|
| Default gameplay | `music/ambient-main.mp3` | 0.25 | Yes |
| Crisis (any country happiness < 30) | `music/ambient-tension.mp3` | 0.3 | Yes, crossfade 2s |
| Summit voting phase | `music/ambient-summit.mp3` | 0.3 | Yes, crossfade 1.5s |

Music crossfades: fade current track out over duration, fade new track in simultaneously. Never abrupt cuts.

---

## Asset Sources (all CC0 / royalty-free, no attribution required)

### UI Sounds

| Sound | Source | Link | Notes |
|-------|--------|------|-------|
| Button click | OpenGameArt — "51 UI sound effects" by Kenney | [opengameart.org/content/51-ui-sound-effects-buttons-switches-and-clicks](https://opengameart.org/content/51-ui-sound-effects-buttons-switches-and-clicks) | CC0. Pick from 5 clicks + 38 switches. Clean, minimal. Use `click1.wav` for buttons. |
| Tab/panel sounds | OpenGameArt — "UI Sound Effects Library" | [opengameart.org/content/ui-sound-effects-library](https://opengameart.org/content/ui-sound-effects-library) | CC0. 105 sounds. Use electronic clicks for tabs, slide sounds for panels. |
| Hover/toggle | OpenGameArt — "Interface Sounds" | [opengameart.org/content/interface-sounds](https://opengameart.org/content/interface-sounds) | CC0. Button clicks, snaps, confirmation sounds. |
| Alternative pack | ObsydianX — "Interface SFX Pack 1" | [obsydianx.itch.io/interface-sfx-pack-1](https://obsydianx.itch.io/interface-sfx-pack-1) | CC0. Clean modern UI sounds. |
| Alternative pack | OpenGameArt — "GUI Sound Effects" by Lokif | [opengameart.org/content/gui-sound-effects](https://opengameart.org/content/gui-sound-effects) | CC0. Click, OK, button sounds. |

### Building / Construction Sounds

| Sound | Source | Link | Notes |
|-------|--------|------|-------|
| Build place | Freesound — CC0 pack by RokZRooM | [freesound.org/people/RokZRooM/packs/12161/](https://freesound.org/people/RokZRooM/packs/12161/) | CC0. Browse for a short "place" or "stamp" sound. |
| Build/upgrade | OpenGameArt — "CC0 Sound Effects" | [opengameart.org/content/cc0-sound-effects](https://opengameart.org/content/cc0-sound-effects) | CC0. Large collection — find construction/craft sounds. |
| Demolish | Pixabay — "Building" sounds | [pixabay.com/sound-effects/search/building/](https://pixabay.com/sound-effects/search/building/) | Pixabay license (free, no attribution). Short crumble/demolish clips. |

### Trade / Money Sounds

| Sound | Source | Link | Notes |
|-------|--------|------|-------|
| Coin / money | OpenGameArt — "12 Coin Sound Effects" | [opengameart.org/content/12-coin-sound-effects](https://opengameart.org/content/12-coin-sound-effects) | CC0. Pick a subtle single-coin clink for trade confirmation. |
| Trade accept/reject | Freesound — "Coin Sounds" by SpaceJoe | [freesound.org/people/SpaceJoe/packs/27440/](https://freesound.org/people/SpaceJoe/packs/27440/) | Check license per sound. Use coin-drop for accept, use UI "error" beep for reject. |
| Trade propose | Use UI notification sound from UI pack above | — | Reuse a clean "ping" from the UI packs. |

### Alert / Notification Sounds

| Sound | Source | Link | Notes |
|-------|--------|------|-------|
| Warning chime | Freesound — "Notification Sound 1" by deadrobotmusic | [freesound.org/people/deadrobotmusic/sounds/750607/](https://freesound.org/people/deadrobotmusic/sounds/750607/) | CC0. Clean notification tone. |
| Crisis alert | OpenGameArt — "CC0 Sound Effects" | [opengameart.org/content/cc0-sound-effects](https://opengameart.org/content/cc0-sound-effects) | CC0. Find an alarm/siren clip, keep it short (< 1s). |
| Temperature milestone | Freesound — "Alert Chime 2" by FoolBoyMedia | [freesound.org/people/FoolBoyMedia/sounds/352658/](https://freesound.org/people/FoolBoyMedia/sounds/352658/) | Check license (CC-BY — attribution in credits if used). Distinctive rising chime. |
| Summit gavel | Pixabay — search "gavel" | [pixabay.com/sound-effects/search/gavel/](https://pixabay.com/sound-effects/search/gavel/) | Pixabay license. Short gavel hit for summit start. |

### Summit Sounds

| Sound | Source | Link | Notes |
|-------|--------|------|-------|
| Vote cast | Reuse UI click (heavier variant) | — | From "51 UI sound effects" pack — use a switch sound. |
| Resolution pass | OpenGameArt — "UI Sound Effects (Button Clicks, User Feedback, Notifications)" | [opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications](https://opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications) | CC0. Use a "success" or "confirmation" sound. |
| Resolution fail | Same pack | — | Use a "negative" or "deny" feedback sound. |

### Background Music

| Track | Source | Link | Notes |
|-------|--------|------|-------|
| Main ambient loop | Freesound — "Simple Game Music Loop" by Seth_Makes_Sounds | [freesound.org/people/Seth_Makes_Sounds/sounds/684511/](https://freesound.org/people/Seth_Makes_Sounds/sounds/684511/) | CC0. Calm, loopable game music. |
| Alternative main | Pixabay — "Relaxing Game Music" | [pixabay.com/music/search/relaxing%20game%20music/](https://pixabay.com/music/search/relaxing%20game%20music/) | Pixabay license. Browse for a calm strategic feel, 1–3 min loops. |
| Tension track | Freesound — "Some Game Background Music" by Seth_Makes_Sounds | [freesound.org/people/Seth_Makes_Sounds/sounds/684184/](https://freesound.org/people/Seth_Makes_Sounds/sounds/684184/) | CC0. Slightly more intense variant. |
| Summit track | OpenGameArt — "Ambient/loading screen game music Pack" | [opengameart.org/content/ambientloading-screen-game-music-pack](https://opengameart.org/content/ambientloading-screen-game-music-pack) | Check license. Atmospheric, works for deliberation scenes. |
| Fallback collection | OpenGameArt — "CC0 Music" | [opengameart.org/content/cc0-music-0](https://opengameart.org/content/cc0-music-0) | CC0. Large collection — browse for ambient/calm tracks. |

---

## Implementation Notes

### React Integration

```typescript
// src/hooks/useSound.ts
import { useCallback } from 'react';
import { AudioManager } from '../audio/AudioManager';

export function useSound() {
  const play = useCallback((soundId: string) => {
    AudioManager.getInstance().play(soundId);
  }, []);

  return { play };
}

// Usage in component:
const { play } = useSound();
<button onClick={() => { play('click'); doAction(); }}>Build</button>
```

### Music State Transitions

```typescript
// In GameContext or cycle processing:
useEffect(() => {
  const audio = AudioManager.getInstance();
  
  if (gameState.summitActive) {
    audio.playMusic('ambient-summit');
  } else if (anyCountryInCrisis(gameState)) {
    audio.playMusic('ambient-tension');
  } else {
    audio.playMusic('ambient-main');
  }
}, [gameState.cycle, gameState.summitActive]);
```

### Volume Defaults

Keep everything quiet. This is a strategy game, not an action game. Players will be reading text, negotiating trades, analyzing dashboards. Audio is subtle feedback, not the focus.

| Category | Default | Range |
|----------|---------|-------|
| Master | 0.6 | 0–1 |
| Music | 0.25 | 0–1 |
| SFX | 0.5 | 0–1 |

### Settings UI

Add to existing settings panel:
- Master volume slider
- Music volume slider
- SFX volume slider
- Mute all toggle

Store in `localStorage` under `climateDiplomacy_audio`.

---

## Download Checklist

Priority order for sourcing:

1. **[51 UI sound effects by Kenney](https://opengameart.org/content/51-ui-sound-effects-buttons-switches-and-clicks)** — covers ALL UI sounds (clicks, tabs, toggles, switches). CC0. Download this first.
2. **[UI Sound Effects Library](https://opengameart.org/content/ui-sound-effects-library)** — 105 sounds, fill any gaps from #1. CC0.
3. **[12 Coin Sound Effects](https://opengameart.org/content/12-coin-sound-effects)** — trade/money sounds. CC0.
4. **[CC0 Sound Effects](https://opengameart.org/content/cc0-sound-effects)** — large grab-bag, pick construction, alert, and demolish sounds. CC0.
5. **[Simple Game Music Loop](https://freesound.org/people/Seth_Makes_Sounds/sounds/684511/)** — main ambient music. CC0.
6. **[Notification Sound 1](https://freesound.org/people/deadrobotmusic/sounds/750607/)** — warning/alert chime. CC0.
7. **Browse [Pixabay sound effects](https://pixabay.com/sound-effects/)** — fill remaining gaps (gavel, crisis alarm, building place). Pixabay license.

Total estimated download: ~15–20 files, < 5MB combined.
