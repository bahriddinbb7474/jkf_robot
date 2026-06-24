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

export interface WeaponSystemOptions {
  availableWeaponIds?: string[];
  damageMultiplier?: number;
}

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
  private activeWeaponId: string;
  private readonly weaponsById: Map<string, Weapon>;
  private readonly damageMultiplier: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly owner: PlayerRobot,
    private readonly arenaBounds: Phaser.Geom.Rectangle,
    private readonly onExplosionCreated?: (explosion: ExplosionEvent) => void,
    private readonly onMeleeAttackCreated?: (attack: MeleeAttackEvent) => void,
    options: WeaponSystemOptions = {},
  ) {
    const availableWeaponIds =
      options.availableWeaponIds ?? WEAPONS.map((weapon) => weapon.id);
    const allowedWeapons = WEAPONS.filter((weapon) =>
      availableWeaponIds.includes(weapon.id),
    );
    const fallbackWeapons =
      allowedWeapons.length > 0
        ? allowedWeapons
        : [this.getStaticDefaultWeapon()];

    this.weaponsById = new Map(
      fallbackWeapons.map((weapon) => [weapon.id, weapon]),
    );
    this.activeWeaponId = this.weaponsById.has(DEFAULT_WEAPON_ID)
      ? DEFAULT_WEAPON_ID
      : fallbackWeapons[0].id;
    this.damageMultiplier = options.damageMultiplier ?? 1;
  }

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
        range: weapon.range,
        arcDegrees: weapon.arcDegrees,
        damage: this.getEffectiveDamage(weapon.damage),
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
      damage: this.getEffectiveDamage(weapon.damage),
      speed: weapon.projectileSpeed,
      range: weapon.range,
      explosionRadius:
        weapon.type === 'rocket' ? weapon.explosionRadius : undefined,
      homingTarget:
        weapon.type === 'rocket'
          ? new Phaser.Math.Vector2(targetX, targetY)
          : undefined,
      homingDelayMs:
        weapon.type === 'rocket' ? weapon.homingDelayMs : undefined,
      maxTurnRateDeg:
        weapon.type === 'rocket' ? weapon.maxTurnRateDeg : undefined,
      launchCurveDurationMs:
        weapon.type === 'rocket' ? weapon.launchCurveDurationMs : undefined,
      launchCurveDeg:
        weapon.type === 'rocket' ? weapon.launchCurveDeg : undefined,
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

  private getEffectiveDamage(baseDamage: number): number {
    return Math.max(1, Math.round(baseDamage * this.damageMultiplier));
  }

  private getStaticDefaultWeapon(): Weapon {
    const defaultWeapon = WEAPONS.find(
      (weapon) => weapon.id === DEFAULT_WEAPON_ID,
    );

    if (!defaultWeapon) {
      throw new Error(`Missing default weapon: ${DEFAULT_WEAPON_ID}`);
    }

    return defaultWeapon;
  }
}
