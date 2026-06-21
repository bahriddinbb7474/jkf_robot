import Phaser from 'phaser';
import weaponsData from '../../../data/static/weapons.json';
import { PlayerRobot } from '../entities/PlayerRobot';
import { Projectile } from '../entities/Projectile';
import type { Weapon } from '../types/Weapon';

const WEAPONS = weaponsData as Weapon[];
const DEFAULT_WEAPON_ID = 'laser_basic';
const PLACEHOLDER_MESSAGES: Record<string, string> = {
  rocket_basic: 'Rocket not implemented yet - Stage 2-B',
  sword_basic: 'Sword not implemented yet - Stage 2-C',
};

const MUZZLE_OFFSET = 38;

export class WeaponSystem {
  private projectiles: Projectile[] = [];
  private nextShotAt = 0;
  private wasPointerDown = false;
  private activeWeaponId = DEFAULT_WEAPON_ID;
  private readonly weaponsById = new Map(
    WEAPONS.map((weapon) => [weapon.id, weapon]),
  );

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly owner: PlayerRobot,
    private readonly arenaBounds: Phaser.Geom.Rectangle,
    private readonly onPlaceholderMessage?: (message: string) => void,
  ) {}

  update(
    time: number,
    deltaMs: number,
    pointer: Phaser.Input.Pointer,
    canFire: boolean,
  ): void {
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.active,
    );

    for (const projectile of this.projectiles) {
      projectile.update(deltaMs, this.arenaBounds);
    }

    const isPointerDown = pointer.leftButtonDown();
    const justPressed = isPointerDown && !this.wasPointerDown;
    this.wasPointerDown = isPointerDown;

    if (canFire && justPressed && time >= this.nextShotAt) {
      this.fireAt(pointer.worldX, pointer.worldY, time);
    }
  }

  selectWeapon(weaponId: string): void {
    if (!this.weaponsById.has(weaponId)) {
      return;
    }

    this.activeWeaponId = weaponId;
  }

  getActiveWeapon(): Weapon {
    return this.getWeaponById(this.activeWeaponId);
  }

  getActiveProjectiles(): readonly Projectile[] {
    return this.projectiles;
  }

  private fireAt(targetX: number, targetY: number, time: number): void {
    const weapon = this.getActiveWeapon();

    if (weapon.type !== 'laser') {
      this.nextShotAt = time + weapon.cooldownMs;
      this.onPlaceholderMessage?.(PLACEHOLDER_MESSAGES[weapon.id] ?? '');
      return;
    }

    const direction = new Phaser.Math.Vector2(
      targetX - this.owner.x,
      targetY - this.owner.y,
    );

    if (direction.lengthSq() < 1) {
      return;
    }

    direction.normalize();
    const projectile = new Projectile(
      this.scene,
      this.owner.x + direction.x * MUZZLE_OFFSET,
      this.owner.y + direction.y * MUZZLE_OFFSET,
      direction,
      weapon.damage,
      weapon.projectileSpeed ?? 600,
      weapon.range ?? 900,
    );

    this.projectiles.push(projectile);
    this.nextShotAt = time + weapon.cooldownMs;
  }

  private getWeaponById(weaponId: string): Weapon {
    const weapon = this.weaponsById.get(weaponId);

    if (!weapon) {
      throw new Error(`Unknown weapon id: ${weaponId}`);
    }

    return weapon;
  }
}
