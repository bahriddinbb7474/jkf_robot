import Phaser from 'phaser';
import weaponsData from '../../../data/static/weapons.json';
import { PlayerRobot } from '../entities/PlayerRobot';
import {
  Projectile,
  type ExplosionEvent,
  type ProjectileConfig,
} from '../entities/Projectile';
import type { Weapon } from '../types/Weapon';

const WEAPONS = weaponsData as Weapon[];
const DEFAULT_WEAPON_ID = 'laser_basic';
const MUZZLE_OFFSET = 38;

export interface MeleeAttackEvent {
  x: number;
  y: number;
  angle: number;
  range: number;
  arcDegrees: number;
  damage: number;
}

export class WeaponSystem {
  private projectiles: Projectile[] = [];
  private pendingExplosions: ExplosionEvent[] = [];
  private pendingMeleeAttacks: MeleeAttackEvent[] = [];
  private nextShotAt = 0;
  private wasPointerDown = false;
  private activeWeaponId = DEFAULT_WEAPON_ID;
  private readonly weaponsById = new Map(
    WEAPONS.map((weapon) => [weapon.id, weapon]),
  );

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly owner: PlayerRobot,
    private readonly arenaBounds: Phaser.Geom.Rectangle,
    private readonly onExplosionCreated?: (explosion: ExplosionEvent) => void,
    private readonly onMeleeAttackCreated?: (attack: MeleeAttackEvent) => void,
  ) {}

  update(
    time: number,
    deltaMs: number,
    pointer: Phaser.Input.Pointer,
    canFire: boolean,
  ): void {
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.active,
    );

    for (const projectile of this.projectiles) {
      const explosion = projectile.update(deltaMs, this.arenaBounds);

      if (explosion) {
        this.registerExplosion(explosion);
      }
    }

    const isPointerDown = pointer.leftButtonDown();
    const justPressed = isPointerDown && !this.wasPointerDown;
    this.wasPointerDown = isPointerDown;

    if (canFire && justPressed && time >= this.nextShotAt) {
      this.fireAt(pointer.worldX, pointer.worldY, time);
    }
  }

  selectWeapon(weaponId: string): void {
    if (!this.weaponsById.has(weaponId)) {
      return;
    }

    this.activeWeaponId = weaponId;
  }

  getActiveWeapon(): Weapon {
    return this.getWeaponById(this.activeWeaponId);
  }

  getActiveProjectiles(): readonly Projectile[] {
    return this.projectiles;
  }

  consumeExplosionEvents(): ExplosionEvent[] {
    const explosions = [...this.pendingExplosions];
    this.pendingExplosions = [];
    return explosions;
  }

  consumeMeleeAttackEvents(): MeleeAttackEvent[] {
    const attacks = [...this.pendingMeleeAttacks];
    this.pendingMeleeAttacks = [];
    return attacks;
  }

  explodeProjectile(projectile: Projectile): ExplosionEvent | null {
    const explosion = projectile.explode();

    if (explosion) {
      this.onExplosionCreated?.(explosion);
    }

    return explosion;
  }

  private fireAt(targetX: number, targetY: number, time: number): void {
    const weapon = this.getActiveWeapon();

    if (weapon.type === 'sword') {
      const attack: MeleeAttackEvent = {
        x: this.owner.x,
        y: this.owner.y,
        angle: this.owner.getAimAngle(),
        range: weapon.range ?? 80,
        arcDegrees: weapon.arcDegrees ?? 90,
        damage: weapon.damage,
      };

      this.pendingMeleeAttacks.push(attack);
      this.onMeleeAttackCreated?.(attack);
      this.nextShotAt = time + weapon.cooldownMs;
      return;
    }

    const direction = new Phaser.Math.Vector2(
      targetX - this.owner.x,
      targetY - this.owner.y,
    );

    if (direction.lengthSq() < 1) {
      return;
    }

    direction.normalize();
    const projectileConfig: ProjectileConfig = {
      weaponType: weapon.type,
      damage: weapon.damage,
      speed: weapon.projectileSpeed ?? 600,
      range: weapon.range ?? 900,
      explosionRadius: weapon.explosionRadius,
    };
    const projectile = new Projectile(
      this.scene,
      this.owner.x + direction.x * MUZZLE_OFFSET,
      this.owner.y + direction.y * MUZZLE_OFFSET,
      direction,
      projectileConfig,
    );

    this.projectiles.push(projectile);
    this.nextShotAt = time + weapon.cooldownMs;
  }

  private registerExplosion(explosion: ExplosionEvent): void {
    this.pendingExplosions.push(explosion);
    this.onExplosionCreated?.(explosion);
  }

  private getWeaponById(weaponId: string): Weapon {
    const weapon = this.weaponsById.get(weaponId);

    if (!weapon) {
      throw new Error(`Unknown weapon id: ${weaponId}`);
    }

    return weapon;
  }
}
