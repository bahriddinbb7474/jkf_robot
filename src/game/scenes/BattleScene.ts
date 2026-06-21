import Phaser from 'phaser';
import { EnemyBot } from '../entities/EnemyBot';
import { PlayerRobot } from '../entities/PlayerRobot';
import { CombatSystem } from '../systems/CombatSystem';
import { MovementSystem, type MovementKeys } from '../systems/MovementSystem';
import { BASIC_LASER, WeaponSystem } from '../systems/WeaponSystem';

const ARENA = new Phaser.Geom.Rectangle(40, 70, 880, 430);
const GRID_SIZE = 40;
const DUMMY_HEALTH = 40;

export class BattleScene extends Phaser.Scene {
  private movementSystem?: MovementSystem;
  private playerRobot?: PlayerRobot;
  private weaponSystem?: WeaponSystem;
  private combatSystem?: CombatSystem;
  private battleComplete = false;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#101820');
    this.drawArena();

    this.add
      .text(this.scale.width / 2, 30, 'Battle Prototype - Stage 1-B', {
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

    this.playerRobot = new PlayerRobot(this, ARENA.centerX, ARENA.centerY);
    this.movementSystem = new MovementSystem(
      this.playerRobot,
      this.createMovementKeys(),
      ARENA,
    );

    const enemy = new EnemyBot(
      this,
      ARENA.right - 150,
      ARENA.centerY,
      DUMMY_HEALTH,
    );
    this.weaponSystem = new WeaponSystem(
      this,
      this.playerRobot,
      ARENA,
      BASIC_LASER,
    );
    this.combatSystem = new CombatSystem(enemy, BASIC_LASER.damage, () =>
      this.showVictory(),
    );
  }

  update(time: number, delta: number): void {
    this.movementSystem?.update(delta);

    const pointer = this.input.activePointer;
    this.playerRobot?.aimAt(pointer.worldX, pointer.worldY);
    this.weaponSystem?.update(time, delta, pointer, !this.battleComplete);

    if (this.weaponSystem) {
      this.combatSystem?.update(this.weaponSystem.getActiveProjectiles());
    }
  }

  private showVictory(): void {
    this.battleComplete = true;
    this.add
      .text(
        this.scale.width / 2,
        ARENA.centerY,
        'Enemy destroyed - Stage 1-B complete',
        {
          backgroundColor: '#102b20',
          color: '#8effb6',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '26px',
          fontStyle: 'bold',
          padding: { x: 18, y: 12 },
        },
      )
      .setOrigin(0.5);
  }

  private createMovementKeys(): MovementKeys {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error(
        'Keyboard input is required for the Stage 1-A prototype.',
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
