import Phaser from 'phaser';
import type { Enemy, EnemyKind } from '../types/Enemy';

const ENEMY_SIZE = 52;
const ENEMY_COLORS: Record<EnemyKind, { fill: number; stroke: number }> = {
  basic: { fill: 0xd95763, stroke: 0xffb4ba },
  fast: { fill: 0xf08a4b, stroke: 0xffd0a8 },
  shooter: { fill: 0x9b6ad6, stroke: 0xd9b8ff },
  boss: { fill: 0x6f263d, stroke: 0xd95763 },
};

export class EnemyBot extends Phaser.GameObjects.Container {
  private readonly healthText: Phaser.GameObjects.Text;
  private currentHealth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly config: Enemy,
  ) {
    super(scene, x, y);
    this.currentHealth = config.health;
    const colors = ENEMY_COLORS[config.kind];

    const body = scene.add.circle(0, 0, ENEMY_SIZE / 2, colors.fill);
    body.setStrokeStyle(3, colors.stroke);

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

  get maxHealth(): number {
    return this.config.health;
  }

  get collisionRadius(): number {
    return ENEMY_SIZE / 2;
  }

  takeDamage(amount: number): void {
    this.currentHealth = Phaser.Math.Clamp(
      this.currentHealth - amount,
      0,
      this.config.health,
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
      `${this.config.name}: ${this.currentHealth}/${this.config.health}`,
    );
  }
}
