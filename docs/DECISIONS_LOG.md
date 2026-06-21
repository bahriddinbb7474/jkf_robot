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
