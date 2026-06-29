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

## Stage 5

- Stage 5 keeps the existing save schema: no `ownedWeaponIds` and no player storage version migration.
- All three current weapons remain available through `currentBuild.weaponIds`; weapon purchases and weapon inventory are deferred.
- `data/static/parts.json` now carries simple MVP stat modifiers: `maxHpBonus`, `armorBonus`, `speedBonus`, `damageMultiplierBonus`, and `colorHex`.
- `StatsSystem` is the single calculation boundary for robot max HP, armor, speed, damage multiplier, weapons, and color.
- `GarageScene` is a functional MVP UI only: text lists, simple robot preview, no final assets, no layered robot assembly, and no animations.
- Existing players automatically receive zero-price parts in `ownedPartIds` during save normalization, without changing the save schema.
- Battle applies garage stats through narrow constructor/config parameters in `PlayerRobot`, `MovementSystem`, `WeaponSystem`, and `CombatSystem`.
- Armor is flat damage reduction with a minimum of 1 incoming damage; outgoing damage is rounded after applying the damage multiplier.

## Stage 6

- Stage 6 keeps purchases local and save-backed: no backend, SQLite, login, real-money shop, or complex economy.
- `PlayerService` owns purchase rules so Phaser scenes do not modify `localStorage` or player inventory directly.
- Part purchase states are explicit: owned, available, locked, not enough money, missing player, and missing part.
- Zero-price basic parts remain owned by default through existing save normalization; paid parts must be bought per player.
- Locked parts are represented with `locked: true` in `data/static/parts.json` and cannot be bought unless later unlocked by explicit future logic.
- Successful purchases subtract money once, add the part to `ownedPartIds`, and persist immediately.
- Garage inventory continues to be derived from `ownedPartIds`, so bought parts appear in Garage without a separate inventory schema or migration.
- Weapon purchases remain deferred; all three current weapons still come from `currentBuild.weaponIds`.

## Stage 7

- Stage 7 uses `data/static/missions.json` as the source of truth for mission order, rewards, waves, optional boss, and part unlocks.
- The existing save schema is retained: mission progress uses `completedMissionIds`, and part unlocks use `unlockedPartIds`.
- Mission status is derived from player progress: completed missions are completed, missions with unmet prerequisites are locked, and all others are unlocked.
- BattleScene receives `playerId` and `missionId`; it keeps the existing combat systems and swaps only the wave/boss source to mission config.
- Victory increments wins and completes the mission through `PlayerService`; defeat increments losses and grants no reward or unlocks.
- Mission rewards are idempotent: replaying an already completed mission can record a win but does not grant mission money or unlocks again.
- Mission unlocks do not grant ownership. Unlocked paid parts become purchasable in Shop and still require money.
- RewardScene is a simple post-battle navigation screen for Missions, Garage, Shop, and Retry.

## Stage 8

- Stage 8 uses a fixed static bank of 30 multiple-choice questions: 15 math and 15 English, evenly distributed across easy, medium, and hard difficulty.
- Every question has exactly four options and one indexed correct answer. Questions are selected randomly and may repeat in the MVP.
- Question rewards are configured only through `data/static/balance.json`; question data does not contain economy values.
- A correct answer grants the configured money reward. An incorrect answer grants no money and applies no penalty.
- `PlayerService` owns the atomic money/statistics update; scenes do not modify player saves directly.
- Player saves track total and per-subject answered/correct counters. `answeredQuestionIds` and anti-farming logic are intentionally deferred.
- Missing, malformed, negative, or internally inconsistent legacy question statistics normalize to the default zero statistics without invalidating the rest of the player save.
- BonusQuestionScene accepts one answer per displayed question, blocks repeat payout from additional clicks, and supports repeat standalone questions from StartScene.
- Victory RewardScene offers the bonus as an optional action. Existing Missions, Retry, Garage, and Shop navigation remains available, and defeat does not offer a post-mission bonus.
- Backend, SQLite, AI-generated runtime questions, admin tools, and complex learning systems remain outside Stage 8.
