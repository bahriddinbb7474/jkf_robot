import Phaser from 'phaser';

const ROBOT_SIZE = 44;
const ROBOT_BOUNDS_SIZE = 64;

export class PlayerRobot extends Phaser.GameObjects.Container {
  private readonly aimIndicator: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const body = scene.add.rectangle(0, 0, ROBOT_SIZE, ROBOT_SIZE, 0x32b8d9);
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
}
