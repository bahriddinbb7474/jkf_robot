# Current State

- Project status: Stage 3 enemy/wave/boss prototype is complete and pushed; Stage 3-E rocket polish is implemented locally and pending approved push.
- Current stage: Stage 3-E — rocket homing-lite polish.
- Available now: bounded WASD movement, mouse aim, three weapons, three sequential waves, config-driven chase/shooter enemies, a large ranged boss, enemy projectiles, multi-target damage, contact separation/damage, player/enemy/boss HP HUD, victory/defeat, and R restart.
- Sword attacks are front-only and short-range, using a simple melee swing visual with cooldown.
- Weapon behavior and balance are driven by `data/static/weapons.json`; code-level weapon fallbacks were removed.
- Rocket has a lightweight launch curve and limited turn-rate homing toward the mouse position captured at fire time.
- Complex boss phases, missions, rewards, progression, persistence, shop, and garage are not implemented.
- Stage 4 will add player creation and local save flow; `BattleScene` remains the direct prototype battle entry until that work is explicitly approved.
- Do not begin Stage 4 or push local commits without explicit approval.
