import Phaser from 'phaser';

const PROJECTILE_LENGTH = 18;
const PROJECTILE_WIDTH = 5;

export class Projectile extends Phaser.GameObjects.Rectangle {
  private readonly velocity: Phaser.Math.Vector2;
  private distanceTravelled = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    readonly damage: number,
    private readonly speed: number,
    private readonly range: number,
  ) {
    super(scene, x, y, PROJECTILE_LENGTH, PROJECTILE_WIDTH, 0x76efff);

    this.velocity = direction.clone().normalize();
    this.rotation = this.velocity.angle();
    this.setStrokeStyle(1, 0xe4fbff);
    scene.add.existing(this);
  }

  update(deltaMs: number, arenaBounds: Phaser.Geom.Rectangle): void {
    const distanceThisFrame = this.speed * (deltaMs / 1000);

    this.x += this.velocity.x * distanceThisFrame;
    this.y += this.velocity.y * distanceThisFrame;
    this.distanceTravelled += distanceThisFrame;

    if (
      !arenaBounds.contains(this.x, this.y) ||
      this.distanceTravelled >= this.range
    ) {
      this.destroy();
    }
  }
}
