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
      .text(centerX, centerY + 70, 'Stage 1-A', {
        color: '#91a4bd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(centerX, centerY + 135, 'Start Battle Prototype', {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const startBattle = (): void => {
      this.scene.start('BattleScene');
    };

    startButton.on('pointerover', () =>
      startButton.setBackgroundColor('#1d547d'),
    );
    startButton.on('pointerout', () =>
      startButton.setBackgroundColor('#143652'),
    );
    startButton.on('pointerup', startBattle);
    this.input.keyboard?.once('keydown-ENTER', startBattle);
  }
}
