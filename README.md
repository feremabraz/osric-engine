# OSRIC Rules Engine

Buit on top of a custom **fixed stage pipeline engine** (see [Q&A](docs/engine-and-domain-qna.md)).

OSRIC, short for Old School Reference and Index Compilation, is a fantasy role-playing game system and a remake of the 1st edition of Advanced Dungeons & Dragons (AD&D).

![Preview](README.webp)

---

## Usage Minimal Example

```ts
import { Engine } from '@osric';

const config = {
  seed: 12345,
  logging: { level: 'info' },
  features: { morale: true },
  adapters: { rng: 'default', persistence: null },
};

const engine = new Engine(config);

const heroRes = await engine.command.createCharacter({ name: 'Hero', level: 1, hp: 12 });
const foeRes  = await engine.command.createCharacter({ name: 'Foe', level: 1, hp: 10 });

const atk = await engine.command.attackRoll({ attacker: heroRes.data.characterId, target: foeRes.data.characterId });
await engine.command.dealDamage({ source: heroRes.data.characterId, target: foeRes.data.characterId, attackContext: atk.data });
```
