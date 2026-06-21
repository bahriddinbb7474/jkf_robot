import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { PlayerRobot } from '../entities/PlayerRobot';
import { Projectile, type ExplosionEvent } from '../entities/Projectile';

export interface ContactDamageConfig {
  damage: number;
  cooldownMs: number;
}

export class CombatSystem {
  private nextContactDamageAt = 0;

  constructor(
    private readonly enemy: EnemyBot,
    private readonly player: PlayerRobot,
    private readonly contactDamage: ContactDamageConfig,
    private readonly onEnemyDestroyed: () => void,
    private readonly onPlayerHealthChanged: () => void,
    private readonly onPlayerDestroyed: () => void,
  ) {}

  update(
    time: number,
    projectiles: readonly Projectile[],
    explodeProjectile?: (projectile: Projectile) => ExplosionEvent | null,
  ): void {
    if (!this.enemy.active) {
      return;
    }

    const enemyBounds = this.enemy.getHitBounds();
    const pendingExplosions: ExplosionEvent[] = [];

    for (const projectile of projectiles) {
      if (
        !projectile.active ||
        !Phaser.Geom.Intersects.RectangleToRectangle(
          projectile.getBounds(),
          enemyBounds,
        )
      ) {
        continue;
      }

      if (projectile.weaponType === 'rocket') {
        const explosion =
          explodeProjectile?.(projectile) ?? projectile.explode();

        if (explosion) {
          pendingExplosions.push(explosion);
        }
      } else {
        projectile.destroy();
        this.enemy.takeDamage(projectile.damage);

        if (this.enemy.health <= 0) {
          this.enemy.destroy(true);
          this.onEnemyDestroyed();
          return;
        }
      }
    }

    for (const explosion of pendingExplosions) {
      if (!this.enemy.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        explosion.x,
        explosion.y,
        this.enemy.x,
        this.enemy.y,
      );

      if (distance > explosion.radius + this.enemy.collisionRadius) {
        continue;
      }

      this.enemy.takeDamage(explosion.damage);

      if (this.enemy.health <= 0) {
        this.enemy.destroy(true);
        this.onEnemyDestroyed();
        return;
      }
    }

    if (
      time < this.nextContactDamageAt ||
      !Phaser.Geom.Intersects.RectangleToRectangle(
        this.enemy.getHitBounds(),
        this.player.getHitBounds(),
      )
    ) {
      return;
    }

    this.player.takeDamage(this.contactDamage.damage);
    this.nextContactDamageAt = time + this.contactDamage.cooldownMs;
    this.onPlayerHealthChanged();

    if (this.player.health <= 0) {
      this.onPlayerDestroyed();
    }
  }
}
