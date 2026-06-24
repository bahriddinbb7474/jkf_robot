# Current State

- Project status: Stage 4 players and local save flow is complete locally; push is not approved yet.
- Current stage: Stage 4 - Players and Save.
- Available now: player creation, persisted player list, player selection, selected-player battle launch, bounded WASD movement, mouse aim, three weapons, three sequential waves, config-driven chase/shooter enemies, a large ranged boss, enemy projectiles, multi-target damage, contact separation/damage, player/enemy/boss HP HUD, victory/defeat, and R restart.
- `BattleScene` now requires a selected `playerId`, loads the player through `PlayerService`, shows the player name in HUD, and records wins/losses on final victory/defeat.
- Player saves use `localStorage` only through `LocalStorageService`; Phaser scenes use `PlayerService` instead of direct browser storage access.
- Weapon behavior and balance are driven by `data/static/weapons.json`; code-level weapon fallbacks were removed.
- Rocket has a lightweight launch curve and limited turn-rate homing toward the mouse position captured at fire time.
- Complex boss phases, shop, garage, missions, rewards, bonus questions, backend, and SQLite are not implemented.
- Next approved stage should start from Stage 5 Garage unless the architect assigns a Stage 4 follow-up.
