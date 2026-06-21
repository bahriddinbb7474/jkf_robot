# Technical Specification Summary

- Client: TypeScript, Phaser 3, and Vite.
- `src/game/scenes`: navigation and gameplay screens; only boot/start are active in Stage 0-A.
- `src/game/systems`: future stateful game mechanics.
- `src/game/services`: future data and storage boundaries.
- `src/game/entities`: future game objects.
- `src/game/types`: shared domain contracts.
- `data/static`: versioned JSON configuration for balance and content.
- `data/players`: reserved for ignored local player data.

Persistence must later sit behind a storage abstraction. No backend or database is part of Stage 0-A.
