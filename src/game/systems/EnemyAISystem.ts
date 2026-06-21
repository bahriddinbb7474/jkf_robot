import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { PlayerRobot } from '../entities/PlayerRobot';

export class EnemyAISystem {
  private readonly direction = new Phaser.Math.Vector2();

  constructor(
    private readonly enemy: EnemyBot,
    private readonly target: PlayerRobot,
    private readonly arenaBounds: Phaser.Geom.Rectangle,
    private readonly speed: number,
  ) {}

  update(deltaMs: number): void {
    if (
      !this.enemy.active ||
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.enemy.getHitBounds(),
        this.target.getHitBounds(),
      )
    ) {
      return;
    }

    this.direction
      .set(this.target.x - this.enemy.x, this.target.y - this.enemy.y)
      .normalize()
      .scale(this.speed * (deltaMs / 1000));

    this.enemy.x += this.direction.x;
    this.enemy.y += this.direction.y;

    const halfWidth = this.enemy.width / 2;
    const halfHeight = this.enemy.height / 2;

    this.enemy.x = Phaser.Math.Clamp(
      this.enemy.x,
      this.arenaBounds.left + halfWidth,
      this.arenaBounds.right - halfWidth,
    );
    this.enemy.y = Phaser.Math.Clamp(
      this.enemy.y,
      this.arenaBounds.top + halfHeight,
      this.arenaBounds.bottom - halfHeight,
    );
  }
}
