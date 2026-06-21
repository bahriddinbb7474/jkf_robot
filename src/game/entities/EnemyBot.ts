import Phaser from 'phaser';

const ENEMY_SIZE = 52;

export class EnemyBot extends Phaser.GameObjects.Container {
  private readonly healthText: Phaser.GameObjects.Text;
  private currentHealth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly maxHealth: number,
  ) {
    super(scene, x, y);
    this.currentHealth = maxHealth;

    const body = scene.add.circle(0, 0, ENEMY_SIZE / 2, 0xd95763);
    body.setStrokeStyle(3, 0xffb4ba);

    this.healthText = scene.add
      .text(0, -ENEMY_SIZE / 2 - 18, '', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add([body, this.healthText]);
    this.setSize(ENEMY_SIZE, ENEMY_SIZE);
    this.updateHealthText();
    scene.add.existing(this);
  }

  get health(): number {
    return this.currentHealth;
  }

  takeDamage(amount: number): void {
    this.currentHealth = Phaser.Math.Clamp(
      this.currentHealth - amount,
      0,
      this.maxHealth,
    );
    this.updateHealthText();
  }

  getHitBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - ENEMY_SIZE / 2,
      this.y - ENEMY_SIZE / 2,
      ENEMY_SIZE,
      ENEMY_SIZE,
    );
  }

  private updateHealthText(): void {
    this.healthText.setText(
      `Dummy HP: ${this.currentHealth}/${this.maxHealth}`,
    );
  }
}
