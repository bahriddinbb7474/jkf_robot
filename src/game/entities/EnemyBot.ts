import Phaser from 'phaser';
import type { Enemy, EnemyKind } from '../types/Enemy';

const DEFAULT_ENEMY_RADIUS = 26;
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
    const radius = this.collisionRadius;

    const body = scene.add.circle(0, 0, radius, colors.fill);
    body.setStrokeStyle(config.kind === 'boss' ? 5 : 3, colors.stroke);
    const bodyParts: Phaser.GameObjects.GameObject[] = [body];

    if (config.kind === 'boss') {
      const core = scene.add.circle(0, 0, radius * 0.38, 0xffc857);
      core.setStrokeStyle(3, 0xffeda3);
      bodyParts.push(core);
    }

    this.healthText = scene.add
      .text(0, -radius - 18, '', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: config.kind === 'boss' ? '17px' : '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add([...bodyParts, this.healthText]);
    this.setSize(radius * 2, radius * 2);
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
    return this.config.kind === 'boss'
      ? this.config.radius
      : DEFAULT_ENEMY_RADIUS;
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
    const diameter = this.collisionRadius * 2;

    return new Phaser.Geom.Rectangle(
      this.x - this.collisionRadius,
      this.y - this.collisionRadius,
      diameter,
      diameter,
    );
  }

  private updateHealthText(): void {
    this.healthText.setText(
      `${this.config.name}: ${this.currentHealth}/${this.config.health}`,
    );
  }
}
