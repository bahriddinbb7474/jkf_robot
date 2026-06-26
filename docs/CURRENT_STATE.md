# Current State

- Project status: Stage 6 shop and inventory flow is complete locally; push is not approved yet.
- Current stage: Stage 6 - Shop and Inventory.
- Available now: player creation, persisted player list, player selection, shop navigation, permanent part purchases, garage navigation, owned part selection, saved robot build, stat preview, selected-player battle launch, bounded WASD movement, mouse aim, three weapons, three sequential waves, config-driven chase/shooter enemies, a large ranged boss, enemy projectiles, multi-target damage, contact separation/damage, player/enemy/boss HP HUD, victory/defeat, and R restart.
- `ShopScene` loads the selected player through `PlayerService`, shows money and the parts catalog, blocks locked/duplicate/unaffordable purchases, and saves successful purchases into the player's `ownedPartIds`.
- `GarageScene` loads the selected player through `PlayerService`, shows money/current build/current stats, lets the player choose owned parts, and saves `currentBuild`.
- `StatsSystem` calculates max HP, armor, speed, damage multiplier, available weapons, and robot color from `currentBuild` plus static part/weapon/balance config.
- `BattleScene` applies saved build stats to player HP, movement speed, armor, outgoing damage, robot color, and available weapons.
- Player saves use `localStorage` only through `LocalStorageService`; Phaser scenes use `PlayerService` instead of direct browser storage access.
- Missions, rewards scene flow, bonus questions, backend, and SQLite are not implemented.
- Next approved stage should start from Stage 7 Missions unless the architect assigns a Stage 6 follow-up.
