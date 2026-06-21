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
