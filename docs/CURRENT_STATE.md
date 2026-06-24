# Current State

- Project status: Stage 5 garage and robot stats flow is complete locally; push is not approved yet.
- Current stage: Stage 5 - Garage and Robot Stats.
- Available now: player creation, persisted player list, player selection, garage navigation, owned part selection, saved robot build, stat preview, selected-player battle launch, bounded WASD movement, mouse aim, three weapons, three sequential waves, config-driven chase/shooter enemies, a large ranged boss, enemy projectiles, multi-target damage, contact separation/damage, player/enemy/boss HP HUD, victory/defeat, and R restart.
- `GarageScene` loads the selected player through `PlayerService`, shows money/current build/current stats, lets the player choose owned parts, and saves `currentBuild`.
- `StatsSystem` calculates max HP, armor, speed, damage multiplier, available weapons, and robot color from `currentBuild` plus static part/weapon/balance config.
- `BattleScene` applies saved build stats to player HP, movement speed, armor, outgoing damage, robot color, and available weapons.
- Player saves use `localStorage` only through `LocalStorageService`; Phaser scenes use `PlayerService` instead of direct browser storage access.
- Shop, purchases, missions, rewards, bonus questions, backend, and SQLite are not implemented.
- Next approved stage should start from Stage 6 Shop unless the architect assigns a Stage 5 follow-up.
