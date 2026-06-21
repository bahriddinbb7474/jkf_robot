import Phaser from 'phaser';

const ROBOT_SIZE = 44;

export class PlayerRobot extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const body = scene.add.rectangle(0, 0, ROBOT_SIZE, ROBOT_SIZE, 0x32b8d9);
    body.setStrokeStyle(3, 0xbcefff);

    const directionMarker = scene.add.triangle(
      0,
      -ROBOT_SIZE / 2 + 7,
      -7,
      7,
      7,
      7,
      0,
      -5,
      0xf4d35e,
    );

    this.add([body, directionMarker]);
    this.setSize(ROBOT_SIZE, ROBOT_SIZE);
    scene.add.existing(this);
  }
}
