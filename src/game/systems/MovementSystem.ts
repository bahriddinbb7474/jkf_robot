import Phaser from 'phaser';

export const PLAYER_SPEED = 220;

export interface MovementKeys {
  up: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}

export class MovementSystem {
  private readonly direction = new Phaser.Math.Vector2();

  constructor(
    private readonly target: Phaser.GameObjects.Container,
    private readonly keys: MovementKeys,
    private readonly bounds: Phaser.Geom.Rectangle,
    private readonly speed = PLAYER_SPEED,
  ) {}

  update(deltaMs: number): void {
    const horizontal =
      Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const vertical =
      Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    this.direction.set(horizontal, vertical);

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize().scale(this.speed * (deltaMs / 1000));
      this.target.x += this.direction.x;
      this.target.y += this.direction.y;
    }

    const halfWidth = this.target.width / 2;
    const halfHeight = this.target.height / 2;

    this.target.x = Phaser.Math.Clamp(
      this.target.x,
      this.bounds.left + halfWidth,
      this.bounds.right - halfWidth,
    );
    this.target.y = Phaser.Math.Clamp(
      this.target.y,
      this.bounds.top + halfHeight,
      this.bounds.bottom - halfHeight,
    );
  }
}
