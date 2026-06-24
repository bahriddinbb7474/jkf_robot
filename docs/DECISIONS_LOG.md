# Decisions Log

## Stage 0-A

- The MVP runs locally only.
- The client stack is Phaser 3 + Vite + TypeScript.
- Versioned JSON is the first source for balance and content.
- Stage 0-A has no backend or database.
- The MVP has no admin panel.
- Repair and energy systems are excluded.
- Bought parts are permanent.
- Bonus questions use multiple choice only.
- Only boot and start scenes are active in Stage 0-A; other scene classes are placeholders.

## Stage 1-A

- `BattleScene` owns arena setup and coordinates the prototype only.
- A primitive `PlayerRobot` contains the temporary robot visuals.
- `MovementSystem` owns normalized frame-rate-independent movement and arena clamping.
- Player speed is a single exported constant: `220` pixels per second.
- No Phaser physics engine is needed for this movement-only substage.

## Stage 1-B

- Mouse aim rotates a child indicator; the player body and movement bounds remain stable.
- Laser projectiles use explicit velocity, range, and arena cleanup without enabling a physics engine.
- `WeaponSystem` owns fire cooldown and projectile lifetime; `CombatSystem` owns hit damage and dummy death.
- The prototype uses `laser_basic` values: 10 damage, 300 ms cooldown, 600 px/s projectile speed, and 900 px range.
- The only enemy is a stationary 40 HP dummy; no enemy AI or player damage is introduced.

## Stage 1-C

- The player has 100 HP; the BattleScene HUD is the only HP presentation.
- The single enemy uses direct normalized movement toward the player at 70 px/s; no pathfinding or other AI is introduced.
- Contact deals 10 damage with an 800 ms cooldown managed by `CombatSystem`.
- Battle state is explicitly `active`, `victory`, or `defeat`; all movement and combat updates stop outside `active`.
- End-state projectiles are removed, and R restarts the same scene with fresh state.

## Stage 2-D

- `data/static/weapons.json` is the source of truth for weapon damage, cooldown, speed, range, explosion radius, and sword arc.
- Discriminated weapon types require every behavior-specific config field; runtime combat code no longer substitutes hidden balance defaults.
- Closeout balance is laser 10/300/600/600, rocket 25/900/350/500/70, and sword 15/450/80/90 (damage/cooldown/speed/range/radius-or-arc).
- Projectile dimensions, muzzle offset, and brief effect durations remain code-level presentation constants rather than balance values.
- The current single-enemy combat API is retained for Stage 2 stability; multi-enemy generalization belongs to the explicitly approved Stage 3 scope.

## Stage 3-A

- `data/static/enemies.json` drives health, movement, contact damage, and shooter projectile values for enemy prototypes.
- One `EnemyAISystem` updates the active enemy collection with only two behaviors: direct chase and preferred-distance shooter.
- Enemy shots use a separate minimal `EnemyProjectile` because player projectiles carry weapon/explosion semantics that do not apply to enemy fire.
- `CombatSystem` owns damage across the enemy collection: direct hits select one target, while rocket explosions and sword arcs can affect multiple targets.
- Contact cooldowns are tracked per enemy, and victory occurs only when every spawned enemy is inactive.
- The existing boss config remains a future data stub and is not spawned or implemented in Stage 3-A.

## Stage 3-B

- Three typed wave definitions remain local to `BattleScene`; no mission or reward system is introduced.
- Wave composition is 2 basic, then 1 basic + 2 fast, then 1 basic + 1 fast + 1 shooter.
- AI and combat retain one shared mutable enemy array, replaced in place when a wave spawns so systems do not need reconstruction.
- A 750 ms non-combat transition separates waves and clears both player and enemy projectiles.
- Player HP and selected weapon persist between waves; R restarts the scene at Wave 1 with fresh state.
- Victory is emitted only after the final wave has no active enemies. Boss flow remains reserved for Stage 3-C.

## Stage 3-C

- `boss_basic` uses the same `EnemyBot`, AI, projectile, collision, and combat paths as other enemies, with a config-driven 42 px radius and distinct primitive core/outline.
- Boss behavior is a single preferred-distance ranged pattern with no phases: 35 px/s movement, 1400 ms shots, and 15 contact damage per 1000 ms.
- Clearing Wave 3 enters the existing 750 ms transition, clears projectiles, and then replaces the shared enemy array with one boss.
- Boss HUD is text-only and visible only while the boss is active; the normal wave/enemy HUD changes to `Wave: Boss` and `Enemies: 1`.
- Victory is reserved for boss death. R restarts the entire prototype at Wave 1 and clears boss state/projectiles.

## Stage 3-D

- User-verified Stage 3 balance is retained without code changes: basic 40/70/10, fast 25/115/8, shooter 35/55/8/1200, and boss 180/35/15/12/1400 (HP/speed/contact/projectile/cooldown as applicable).
- Enemy and boss behavior values remain sourced from `data/static/enemies.json`; AI code keeps only presentation/steering constants.
- Stage 3 closes with the direct `StartScene` to `BattleScene` prototype flow. Player creation and local persistence are deferred to an explicitly approved Stage 4.
- Existing wave, boss, projectile, victory/defeat, and restart cleanup paths are accepted as the Stage 3 baseline.

## Stage 3-E

- Rocket polish keeps the fire-time mouse position as the homing target, preserving manual aim instead of adding enemy auto-targeting.
- Rocket launch curve and turn rate are config-driven in `data/static/weapons.json`; damage, cooldown, speed, range, and explosion radius remain unchanged.
- Homing is intentionally lightweight: no pathfinding, obstacle avoidance, wall logic, new weapons, wave changes, or boss changes are introduced.

## Stage 4

- Player persistence is stored in one versioned local browser document under `jkf_robot.players.v1`.
- `LocalStorageService` is the only code path that accesses `localStorage`; Phaser scenes use `PlayerService`.
- `PlayerService` owns player creation, current player selection, profile listing, save loading, and battle result counters.
- New players start with configured starting money, the basic static parts, and the existing laser/rocket/sword weapon ids.
- `StartScene` keeps player creation and selection in the existing scene instead of adding a dedicated player-select scene.
- `BattleScene` receives only `playerId`, reloads the save through `PlayerService`, and returns to `StartScene` if the id is missing or invalid.
- Battle victory/defeat increments wins/losses once on the final state transition; R restart keeps the same selected player context.
