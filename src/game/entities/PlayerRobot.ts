import Phaser from 'phaser';

const ROBOT_SIZE = 44;
const ROBOT_BOUNDS_SIZE = 64;

export class PlayerRobot extends Phaser.GameObjects.Container {
  private readonly aimIndicator: Phaser.GameObjects.Container;
  private currentHealth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly maxHealth: number,
    color = 0x32b8d9,
  ) {
    super(scene, x, y);
    this.currentHealth = maxHealth;

    const body = scene.add.rectangle(0, 0, ROBOT_SIZE, ROBOT_SIZE, color);
    body.setStrokeStyle(3, 0xbcefff);

    this.aimIndicator = scene.add.container(0, 0);
    const barrel = scene.add.rectangle(17, 0, 28, 6, 0xf4d35e);
    const muzzle = scene.add.circle(31, 0, 5, 0xfff0a6);
    this.aimIndicator.add([barrel, muzzle]);

    this.add([body, this.aimIndicator]);
    this.setSize(ROBOT_BOUNDS_SIZE, ROBOT_BOUNDS_SIZE);
    scene.add.existing(this);
  }

  aimAt(worldX: number, worldY: number): void {
    this.aimIndicator.rotation = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      worldX,
      worldY,
    );
  }

  getAimAngle(): number {
    return this.aimIndicator.rotation;
  }

  get health(): number {
    return this.currentHealth;
  }

  get collisionRadius(): number {
    return ROBOT_SIZE / 2;
  }

  takeDamage(amount: number): void {
    this.currentHealth = Phaser.Math.Clamp(
      this.currentHealth - amount,
      0,
      this.maxHealth,
    );
  }

  getHitBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - ROBOT_SIZE / 2,
      this.y - ROBOT_SIZE / 2,
      ROBOT_SIZE,
      ROBOT_SIZE,
    );
  }
}
