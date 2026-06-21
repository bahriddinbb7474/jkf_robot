import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { PlayerRobot } from '../entities/PlayerRobot';
import type { ShooterEnemy } from '../types/Enemy';

const SHOOTER_DISTANCE_TOLERANCE = 30;
const PROJECTILE_SPAWN_OFFSET = 36;

export class EnemyAISystem {
  private readonly direction = new Phaser.Math.Vector2();
  private readonly nextShotAt = new Map<EnemyBot, number>();
  private projectiles: EnemyProjectile[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: readonly EnemyBot[],
    private readonly target: PlayerRobot,
    private readonly arenaBounds: Phaser.Geom.Rectangle,
  ) {}

  update(time: number, deltaMs: number): void {
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.active,
    );

    for (const projectile of this.projectiles) {
      projectile.update(deltaMs, this.arenaBounds);
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) {
        continue;
      }

      if (enemy.config.behavior === 'shooter') {
        this.updateShooter(enemy, enemy.config, time, deltaMs);
      } else {
        this.updateChaser(enemy, deltaMs);
      }
    }
  }

  getActiveProjectiles(): readonly EnemyProjectile[] {
    return this.projectiles;
  }

  destroyProjectiles(): void {
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }

    this.projectiles = [];
  }

  private updateChaser(enemy: EnemyBot, deltaMs: number): void {
    if (this.touchesPlayer(enemy)) {
      return;
    }

    this.moveEnemy(
      enemy,
      this.target.x - enemy.x,
      this.target.y - enemy.y,
      deltaMs,
    );
  }

  private updateShooter(
    enemy: EnemyBot,
    config: ShooterEnemy,
    time: number,
    deltaMs: number,
  ): void {
    const toPlayerX = this.target.x - enemy.x;
    const toPlayerY = this.target.y - enemy.y;
    const distance = Math.hypot(toPlayerX, toPlayerY);

    if (distance > config.preferredDistance + SHOOTER_DISTANCE_TOLERANCE) {
      this.moveEnemy(enemy, toPlayerX, toPlayerY, deltaMs);
    } else if (
      distance <
      config.preferredDistance - SHOOTER_DISTANCE_TOLERANCE
    ) {
      this.moveEnemy(enemy, -toPlayerX, -toPlayerY, deltaMs);
    }

    const nextShot = this.nextShotAt.get(enemy);

    if (nextShot === undefined) {
      this.nextShotAt.set(enemy, time + config.shootCooldownMs);
      return;
    }

    if (time < nextShot || distance < 1) {
      return;
    }

    const direction = new Phaser.Math.Vector2(toPlayerX, toPlayerY).normalize();
    const projectile = new EnemyProjectile(
      this.scene,
      enemy.x + direction.x * PROJECTILE_SPAWN_OFFSET,
      enemy.y + direction.y * PROJECTILE_SPAWN_OFFSET,
      direction,
      {
        damage: config.projectileDamage,
        speed: config.projectileSpeed,
        range: config.projectileRange,
      },
    );

    this.projectiles.push(projectile);
    this.nextShotAt.set(enemy, time + config.shootCooldownMs);
  }

  private moveEnemy(
    enemy: EnemyBot,
    directionX: number,
    directionY: number,
    deltaMs: number,
  ): void {
    this.direction.set(directionX, directionY);

    if (this.direction.lengthSq() < 1) {
      return;
    }

    this.direction.normalize().scale(enemy.config.speed * (deltaMs / 1000));
    enemy.x += this.direction.x;
    enemy.y += this.direction.y;

    const halfWidth = enemy.width / 2;
    const halfHeight = enemy.height / 2;
    enemy.x = Phaser.Math.Clamp(
      enemy.x,
      this.arenaBounds.left + halfWidth,
      this.arenaBounds.right - halfWidth,
    );
    enemy.y = Phaser.Math.Clamp(
      enemy.y,
      this.arenaBounds.top + halfHeight,
      this.arenaBounds.bottom - halfHeight,
    );
  }

  private touchesPlayer(enemy: EnemyBot): boolean {
    return Phaser.Geom.Intersects.RectangleToRectangle(
      enemy.getHitBounds(),
      this.target.getHitBounds(),
    );
  }
}
