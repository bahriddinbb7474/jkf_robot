import Phaser from 'phaser';
import type { WeaponType } from '../types/Weapon';

export interface ProjectileConfig {
  weaponType: Extract<WeaponType, 'laser' | 'rocket'>;
  damage: number;
  speed: number;
  range: number;
  explosionRadius?: number;
  homingTarget?: Phaser.Math.Vector2;
  homingDelayMs?: number;
  maxTurnRateDeg?: number;
  launchCurveDurationMs?: number;
  launchCurveDeg?: number;
}

export interface ExplosionEvent {
  x: number;
  y: number;
  radius: number;
  damage: number;
}

export class Projectile extends Phaser.GameObjects.Rectangle {
  private readonly homingTarget?: Phaser.Math.Vector2;
  private readonly launchCurveDirection: 1 | -1;
  private velocity: Phaser.Math.Vector2;
  private distanceTravelled = 0;
  private ageMs = 0;
  readonly damage: number;
  readonly weaponType: ProjectileConfig['weaponType'];
  readonly explosionRadius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    private readonly config: ProjectileConfig,
  ) {
    const isRocket = config.weaponType === 'rocket';
    super(
      scene,
      x,
      y,
      isRocket ? 14 : 18,
      isRocket ? 14 : 5,
      isRocket ? 0xff8c42 : 0x76efff,
    );

    this.damage = config.damage;
    this.weaponType = config.weaponType;
    this.explosionRadius = config.explosionRadius ?? 0;
    this.homingTarget = config.homingTarget?.clone();

    this.velocity = direction.clone().normalize();
    this.launchCurveDirection = this.velocity.y >= 0 ? 1 : -1;
    this.rotation = this.velocity.angle();
    this.setStrokeStyle(1, isRocket ? 0xffd6a5 : 0xe4fbff);
    scene.add.existing(this);
  }

  update(
    deltaMs: number,
    arenaBounds: Phaser.Geom.Rectangle,
  ): ExplosionEvent | null {
    this.ageMs += deltaMs;
    this.updateHoming(deltaMs);

    const distanceThisFrame = this.config.speed * (deltaMs / 1000);

    this.x += this.velocity.x * distanceThisFrame;
    this.y += this.velocity.y * distanceThisFrame;
    this.distanceTravelled += distanceThisFrame;

    if (!arenaBounds.contains(this.x, this.y)) {
      return this.explode();
    }

    if (this.distanceTravelled >= this.config.range) {
      return this.explode();
    }

    return null;
  }

  private updateHoming(deltaMs: number): void {
    if (this.weaponType !== 'rocket') {
      return;
    }

    const launchCurveDurationMs = this.config.launchCurveDurationMs ?? 0;

    if (launchCurveDurationMs > 0 && this.ageMs <= launchCurveDurationMs) {
      const launchCurveDeg = this.config.launchCurveDeg ?? 0;
      const turnRadians =
        Phaser.Math.DegToRad(launchCurveDeg) *
        (deltaMs / launchCurveDurationMs) *
        this.launchCurveDirection;

      this.rotateVelocity(turnRadians);
      return;
    }

    if (!this.homingTarget || this.ageMs < (this.config.homingDelayMs ?? 0)) {
      return;
    }

    const toTarget = new Phaser.Math.Vector2(
      this.homingTarget.x - this.x,
      this.homingTarget.y - this.y,
    );

    if (toTarget.lengthSq() < 1) {
      return;
    }

    const targetAngle = toTarget.angle();
    const currentAngle = this.velocity.angle();
    const angleDelta = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
    const maxTurnRadians =
      Phaser.Math.DegToRad(this.config.maxTurnRateDeg ?? 0) * (deltaMs / 1000);

    if (maxTurnRadians <= 0) {
      return;
    }

    const clampedTurn = Phaser.Math.Clamp(
      angleDelta,
      -maxTurnRadians,
      maxTurnRadians,
    );

    this.rotateVelocity(clampedTurn);
  }

  private rotateVelocity(deltaRadians: number): void {
    const nextAngle = this.velocity.angle() + deltaRadians;

    this.velocity.setTo(Math.cos(nextAngle), Math.sin(nextAngle));
    this.rotation = this.velocity.angle();
  }

  explode(): ExplosionEvent | null {
    if (!this.active) {
      return null;
    }

    const explosion =
      this.weaponType === 'rocket'
        ? {
            x: this.x,
            y: this.y,
            radius: this.explosionRadius,
            damage: this.damage,
          }
        : null;

    this.destroy();
    return explosion;
  }
}
