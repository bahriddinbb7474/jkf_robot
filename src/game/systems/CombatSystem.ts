import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { Projectile } from '../entities/Projectile';

export class CombatSystem {
  constructor(
    private readonly enemy: EnemyBot,
    private readonly projectileDamage: number,
    private readonly onEnemyDestroyed: () => void,
  ) {}

  update(projectiles: readonly Projectile[]): void {
    if (!this.enemy.active) {
      return;
    }

    const enemyBounds = this.enemy.getHitBounds();

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

      projectile.destroy();
      this.enemy.takeDamage(this.projectileDamage);

      if (this.enemy.health <= 0) {
        this.enemy.destroy(true);
        this.onEnemyDestroyed();
        return;
      }
    }
  }
}
