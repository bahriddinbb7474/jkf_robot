# Current State

- Project status: Stage 2 weapon prototype is complete locally and pending approved push.
- Current stage: Stage 2-D closeout — weapon regression, config consistency, and balance cleanup.
- Available now: bounded WASD movement, mouse aim, weapon slot switching on keys 1/2/3, active weapon HUD, laser combat, rocket projectiles with explosion radius, sword melee attack, one chasing solid enemy, contact separation/damage, player/enemy HP, victory/defeat, and R restart.
- Sword attacks are front-only and short-range, using a simple melee swing visual with cooldown.
- Weapon behavior and balance are driven by `data/static/weapons.json`; code-level weapon fallbacks were removed.
- Additional enemies, missions, rewards, progression, persistence, shop, and garage are not implemented.
- Do not begin Stage 3 or push the local commits without explicit approval.
