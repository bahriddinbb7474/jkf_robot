import Phaser from 'phaser';
import { PlayerRobot } from '../entities/PlayerRobot';
import { Projectile } from '../entities/Projectile';

export interface LaserConfig {
  damage: number;
  cooldownMs: number;
  projectileSpeed: number;
  maxRange: number;
}

export const BASIC_LASER: LaserConfig = {
  damage: 10,
  cooldownMs: 300,
  projectileSpeed: 600,
  maxRange: 900,
};

const MUZZLE_OFFSET = 38;

export class WeaponSystem {
  private projectiles: Projectile[] = [];
  private nextShotAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly owner: PlayerRobot,
    private readonly arenaBounds: Phaser.Geom.Rectangle,
    readonly laserConfig = BASIC_LASER,
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
      projectile.update(deltaMs, this.arenaBounds);
    }

    if (canFire && pointer.leftButtonDown() && time >= this.nextShotAt) {
      this.fireAt(pointer.worldX, pointer.worldY, time);
    }
  }

  getActiveProjectiles(): readonly Projectile[] {
    return this.projectiles;
  }

  private fireAt(targetX: number, targetY: number, time: number): void {
    const direction = new Phaser.Math.Vector2(
      targetX - this.owner.x,
      targetY - this.owner.y,
    );

    if (direction.lengthSq() < 1) {
      return;
    }

    direction.normalize();
    const projectile = new Projectile(
      this.scene,
      this.owner.x + direction.x * MUZZLE_OFFSET,
      this.owner.y + direction.y * MUZZLE_OFFSET,
      direction,
      this.laserConfig.projectileSpeed,
      this.laserConfig.maxRange,
    );

    this.projectiles.push(projectile);
    this.nextShotAt = time + this.laserConfig.cooldownMs;
  }
}
