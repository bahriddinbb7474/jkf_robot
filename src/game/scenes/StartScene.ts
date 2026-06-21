import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add
      .text(centerX, centerY - 70, 'JKF_robot', {
        color: '#57d4ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 15, 'MVP Foundation Ready', {
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 70, 'Stage 0-A', {
        color: '#91a4bd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
      })
      .setOrigin(0.5);
  }
}
