import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { PlayerRobot } from '../entities/PlayerRobot';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { MovementSystem, type MovementKeys } from '../systems/MovementSystem';
import { BASIC_LASER, WeaponSystem } from '../systems/WeaponSystem';

const ARENA = new Phaser.Geom.Rectangle(40, 70, 880, 430);
const GRID_SIZE = 40;
const BATTLE_CONFIG = {
  playerMaxHealth: 100,
  enemyHealth: 40,
  enemySpeed: 70,
  enemyContactDamage: 10,
  enemyContactCooldownMs: 800,
} as const;

type BattleState = 'active' | 'victory' | 'defeat';

export class BattleScene extends Phaser.Scene {
  private movementSystem?: MovementSystem;
  private enemyAISystem?: EnemyAISystem;
  private playerRobot?: PlayerRobot;
  private enemy?: EnemyBot;
  private weaponSystem?: WeaponSystem;
  private combatSystem?: CombatSystem;
  private healthText?: Phaser.GameObjects.Text;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private battleState: BattleState = 'active';

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.battleState = 'active';
    this.cameras.main.setBackgroundColor('#101820');
    this.drawArena();

    this.add
      .text(this.scale.width / 2, 30, 'Battle Prototype - Stage 1-C', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add.text(
      ARENA.x + 12,
      ARENA.y + 10,
      'Move: W A S D  |  Aim: Mouse  |  Fire: Left click',
      {
        color: '#8296a8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
      },
    );

    this.playerRobot = new PlayerRobot(
      this,
      ARENA.centerX,
      ARENA.centerY,
      BATTLE_CONFIG.playerMaxHealth,
    );
    this.movementSystem = new MovementSystem(
      this.playerRobot,
      this.createMovementKeys(),
      ARENA,
    );

    this.enemy = new EnemyBot(
      this,
      ARENA.right - 150,
      ARENA.centerY,
      BATTLE_CONFIG.enemyHealth,
    );
    this.enemyAISystem = new EnemyAISystem(
      this.enemy,
      this.playerRobot,
      ARENA,
      BATTLE_CONFIG.enemySpeed,
    );
    this.weaponSystem = new WeaponSystem(
      this,
      this.playerRobot,
      ARENA,
      BASIC_LASER,
    );
    this.combatSystem = new CombatSystem(
      this.enemy,
      this.playerRobot,
      BASIC_LASER.damage,
      {
        damage: BATTLE_CONFIG.enemyContactDamage,
        cooldownMs: BATTLE_CONFIG.enemyContactCooldownMs,
      },
      () => this.endBattle('victory'),
      () => this.updateHealthText(),
      () => this.endBattle('defeat'),
    );

    this.healthText = this.add
      .text(ARENA.right - 12, ARENA.top + 10, '', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.updateHealthText();

    this.restartKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.R,
    );
  }

  update(time: number, delta: number): void {
    if (this.battleState !== 'active') {
      if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart();
      }

      return;
    }

    this.movementSystem?.update(delta);

    const pointer = this.input.activePointer;
    this.playerRobot?.aimAt(pointer.worldX, pointer.worldY);
    this.enemyAISystem?.update(delta);
    this.weaponSystem?.update(time, delta, pointer, true);

    if (this.weaponSystem) {
      this.combatSystem?.update(time, this.weaponSystem.getActiveProjectiles());
    }

    this.separatePlayerFromEnemy();
  }

  private separatePlayerFromEnemy(): void {
    if (!this.playerRobot || !this.enemy?.active) {
      return;
    }

    const deltaX = this.playerRobot.x - this.enemy.x;
    const deltaY = this.playerRobot.y - this.enemy.y;
    const minimumDistance =
      this.playerRobot.collisionRadius + this.enemy.collisionRadius;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

    if (distanceSquared >= minimumDistance * minimumDistance) {
      return;
    }

    const distance = Math.sqrt(distanceSquared);
    const normalX = distance > 0 ? deltaX / distance : -1;
    const normalY = distance > 0 ? deltaY / distance : 0;
    const overlap = minimumDistance - distance;

    this.playerRobot.x += normalX * overlap;
    this.playerRobot.y += normalY * overlap;
    this.movementSystem?.clampToBounds();
  }

  private updateHealthText(): void {
    if (this.playerRobot && this.healthText) {
      this.healthText.setText(
        `HP: ${this.playerRobot.health} / ${this.playerRobot.maxHealth}`,
      );
    }
  }

  private endBattle(result: Exclude<BattleState, 'active'>): void {
    if (this.battleState !== 'active') {
      return;
    }

    this.battleState = result;

    for (const projectile of this.weaponSystem?.getActiveProjectiles() ?? []) {
      projectile.destroy();
    }

    const message =
      result === 'victory'
        ? 'Victory - press R to restart'
        : 'Defeat - press R to restart';
    const color = result === 'victory' ? '#8effb6' : '#ff9ca5';
    const backgroundColor = result === 'victory' ? '#102b20' : '#35161b';

    this.add
      .text(this.scale.width / 2, ARENA.centerY, message, {
        backgroundColor,
        color,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5);
  }

  private createMovementKeys(): MovementKeys {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error(
        'Keyboard input is required for the Stage 1-C prototype.',
      );
    }

    return {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private drawArena(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x16232d, 1);
    graphics.fillRectShape(ARENA);
    graphics.lineStyle(1, 0x263c4c, 0.7);

    for (let x = ARENA.left + GRID_SIZE; x < ARENA.right; x += GRID_SIZE) {
      graphics.lineBetween(x, ARENA.top, x, ARENA.bottom);
    }

    for (let y = ARENA.top + GRID_SIZE; y < ARENA.bottom; y += GRID_SIZE) {
      graphics.lineBetween(ARENA.left, y, ARENA.right, y);
    }

    graphics.lineStyle(4, 0x4c7087, 1);
    graphics.strokeRectShape(ARENA);
  }
}
