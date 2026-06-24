import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { PlayerRobot } from '../entities/PlayerRobot';
import { Projectile, type ExplosionEvent } from '../entities/Projectile';
import type { MeleeAttackEvent } from './WeaponSystem';

export class CombatSystem {
  private readonly nextContactDamageAt = new Map<EnemyBot, number>();

  constructor(
    private readonly enemies: readonly EnemyBot[],
    private readonly player: PlayerRobot,
    private readonly onEnemyDestroyed: (enemy: EnemyBot) => void,
    private readonly onPlayerHealthChanged: () => void,
    private readonly onPlayerDestroyed: () => void,
    private readonly playerArmor = 0,
  ) {}

  update(
    time: number,
    playerProjectiles: readonly Projectile[],
    enemyProjectiles: readonly EnemyProjectile[],
    explodeProjectile?: (projectile: Projectile) => ExplosionEvent | null,
  ): void {
    this.applyPlayerProjectiles(playerProjectiles, explodeProjectile);

    if (this.applyEnemyProjectiles(enemyProjectiles)) {
      return;
    }

    this.applyContactDamage(time);
  }

  applyExplosion(explosion: ExplosionEvent): void {
    for (const enemy of this.getActiveEnemies()) {
      const distance = Phaser.Math.Distance.Between(
        explosion.x,
        explosion.y,
        enemy.x,
        enemy.y,
      );

      if (distance <= explosion.radius + enemy.collisionRadius) {
        this.damageEnemy(enemy, explosion.damage);
      }
    }
  }

  applyMeleeAttack(attack: MeleeAttackEvent): void {
    const attackDirection = new Phaser.Math.Vector2(
      Math.cos(attack.angle),
      Math.sin(attack.angle),
    );
    const maxDelta = Phaser.Math.DegToRad(attack.arcDegrees / 2);

    for (const enemy of this.getActiveEnemies()) {
      const toEnemy = new Phaser.Math.Vector2(
        enemy.x - attack.x,
        enemy.y - attack.y,
      );
      const distance = toEnemy.length();

      if (distance > attack.range + enemy.collisionRadius) {
        continue;
      }

      const enemyDirection =
        distance > 0 ? toEnemy.normalize() : attackDirection.clone();
      const angleDelta = Phaser.Math.Angle.Wrap(
        enemyDirection.angle() - attackDirection.angle(),
      );

      if (Math.abs(angleDelta) <= maxDelta) {
        this.damageEnemy(enemy, attack.damage);
      }
    }
  }

  private applyPlayerProjectiles(
    projectiles: readonly Projectile[],
    explodeProjectile?: (projectile: Projectile) => ExplosionEvent | null,
  ): void {
    for (const projectile of projectiles) {
      if (!projectile.active) {
        continue;
      }

      const hitEnemy = this.getActiveEnemies().find((enemy) =>
        Phaser.Geom.Intersects.RectangleToRectangle(
          projectile.getBounds(),
          enemy.getHitBounds(),
        ),
      );

      if (!hitEnemy) {
        continue;
      }

      if (projectile.weaponType === 'rocket') {
        const explosion =
          explodeProjectile?.(projectile) ?? projectile.explode();

        if (explosion) {
          this.applyExplosion(explosion);
        }
      } else {
        projectile.destroy();
        this.damageEnemy(hitEnemy, projectile.damage);
      }
    }
  }

  private applyEnemyProjectiles(
    projectiles: readonly EnemyProjectile[],
  ): boolean {
    for (const projectile of projectiles) {
      if (
        !projectile.active ||
        !Phaser.Geom.Intersects.RectangleToRectangle(
          projectile.getBounds(),
          this.player.getHitBounds(),
        )
      ) {
        continue;
      }

      projectile.destroy();

      if (this.damagePlayer(projectile.damage)) {
        return true;
      }
    }

    return false;
  }

  private applyContactDamage(time: number): void {
    for (const enemy of this.getActiveEnemies()) {
      const nextDamageAt = this.nextContactDamageAt.get(enemy) ?? 0;

      if (
        time < nextDamageAt ||
        !Phaser.Geom.Intersects.RectangleToRectangle(
          enemy.getHitBounds(),
          this.player.getHitBounds(),
        )
      ) {
        continue;
      }

      this.nextContactDamageAt.set(
        enemy,
        time + enemy.config.contactDamageCooldownMs,
      );

      if (this.damagePlayer(enemy.config.contactDamage)) {
        return;
      }
    }
  }

  private damageEnemy(enemy: EnemyBot, damage: number): void {
    if (!enemy.active) {
      return;
    }

    enemy.takeDamage(damage);

    if (enemy.health <= 0) {
      enemy.destroy(true);
      this.onEnemyDestroyed(enemy);
    }
  }

  private damagePlayer(damage: number): boolean {
    this.player.takeDamage(this.applyArmor(damage));
    this.onPlayerHealthChanged();

    if (this.player.health <= 0) {
      this.onPlayerDestroyed();
      return true;
    }

    return false;
  }

  private applyArmor(damage: number): number {
    return Math.max(1, damage - this.playerArmor);
  }

  private getActiveEnemies(): EnemyBot[] {
    return this.enemies.filter((enemy) => enemy.active);
  }
}
