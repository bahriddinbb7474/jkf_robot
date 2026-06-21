import Phaser from 'phaser';

const PROJECTILE_RADIUS = 7;

export interface EnemyProjectileConfig {
  damage: number;
  speed: number;
  range: number;
}

export class EnemyProjectile extends Phaser.GameObjects.Arc {
  private readonly velocity: Phaser.Math.Vector2;
  private distanceTravelled = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    private readonly config: EnemyProjectileConfig,
  ) {
    super(scene, x, y, PROJECTILE_RADIUS, 0, 360, false, 0xff5ca8);
    this.velocity = direction.clone().normalize();
    this.setStrokeStyle(2, 0xffb8da);
    scene.add.existing(this);
  }

  get damage(): number {
    return this.config.damage;
  }

  update(deltaMs: number, arenaBounds: Phaser.Geom.Rectangle): void {
    const distanceThisFrame = this.config.speed * (deltaMs / 1000);

    this.x += this.velocity.x * distanceThisFrame;
    this.y += this.velocity.y * distanceThisFrame;
    this.distanceTravelled += distanceThisFrame;

    if (
      !arenaBounds.contains(this.x, this.y) ||
      this.distanceTravelled >= this.config.range
    ) {
      this.destroy();
    }
  }
}
