import Phaser from 'phaser';
import type { WeaponType } from '../types/Weapon';

export interface ProjectileConfig {
  weaponType: Extract<WeaponType, 'laser' | 'rocket'>;
  damage: number;
  speed: number;
  range: number;
  explosionRadius?: number;
}

export interface ExplosionEvent {
  x: number;
  y: number;
  radius: number;
  damage: number;
}

export class Projectile extends Phaser.GameObjects.Rectangle {
  private readonly velocity: Phaser.Math.Vector2;
  private distanceTravelled = 0;
  readonly damage: number;
  readonly weaponType: ProjectileConfig['weaponType'];
  readonly explosionRadius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    private readonly config: ProjectileConfig,
  ) {
    const isRocket = config.weaponType === 'rocket';
    super(
      scene,
      x,
      y,
      isRocket ? 14 : 18,
      isRocket ? 14 : 5,
      isRocket ? 0xff8c42 : 0x76efff,
    );

    this.damage = config.damage;
    this.weaponType = config.weaponType;
    this.explosionRadius = config.explosionRadius ?? 0;

    this.velocity = direction.clone().normalize();
    this.rotation = this.velocity.angle();
    this.setStrokeStyle(1, isRocket ? 0xffd6a5 : 0xe4fbff);
    scene.add.existing(this);
  }

  update(
    deltaMs: number,
    arenaBounds: Phaser.Geom.Rectangle,
  ): ExplosionEvent | null {
    const distanceThisFrame = this.config.speed * (deltaMs / 1000);

    this.x += this.velocity.x * distanceThisFrame;
    this.y += this.velocity.y * distanceThisFrame;
    this.distanceTravelled += distanceThisFrame;

    if (!arenaBounds.contains(this.x, this.y)) {
      return this.explode();
    }

    if (this.distanceTravelled >= this.config.range) {
      return this.explode();
    }

    return null;
  }

  explode(): ExplosionEvent | null {
    if (!this.active) {
      return null;
    }

    const explosion =
      this.weaponType === 'rocket'
        ? {
            x: this.x,
            y: this.y,
            radius: this.explosionRadius,
            damage: this.damage,
          }
        : null;

    this.destroy();
    return explosion;
  }
}
