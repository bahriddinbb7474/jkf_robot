# Current State

- Project status: Stage 7 mission progression loop is complete locally; push is not approved yet.
- Current stage: Stage 7 - Missions and Progression Loop.
- Available now: player creation, persisted player list, player selection, mission selection, mission-gated battles, victory/defeat reward screen, mission completion, next mission unlocks, part unlocks, shop navigation, permanent part purchases, garage navigation, owned part selection, saved robot build, stat preview, bounded WASD movement, mouse aim, three weapons, mission-driven waves, mission boss, enemy projectiles, multi-target damage, contact separation/damage, player/enemy/boss HP HUD, victory/defeat, and R restart.
- `MissionSelectScene` loads the selected player through `PlayerService`, shows mission locked/unlocked/completed states, rewards, unlocks, and starts BattleScene with a selected `missionId`.
- `BattleScene` accepts `playerId` and `missionId`, loads waves/boss from `data/static/missions.json`, and preserves the existing combat flow and R retry behavior.
- `RewardScene` shows victory/defeat results, earned money, unlocked parts, and navigation back to Missions/Garage/Shop/Retry.
- `ShopScene` loads the selected player through `PlayerService`, shows money and the parts catalog, blocks locked/duplicate/unaffordable purchases, and saves successful purchases into the player's `ownedPartIds`.
- `GarageScene` loads the selected player through `PlayerService`, shows money/current build/current stats, lets the player choose owned parts, and saves `currentBuild`.
- `StatsSystem` calculates max HP, armor, speed, damage multiplier, available weapons, and robot color from `currentBuild` plus static part/weapon/balance config.
- Player saves use `localStorage` only through `LocalStorageService`; Phaser scenes use `PlayerService` instead of direct browser storage access.
- Bonus questions, backend, and SQLite are not implemented.
- Next approved stage should start from Stage 8 Bonus Questions unless the architect assigns a Stage 7 follow-up.
