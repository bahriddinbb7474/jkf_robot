import Phaser from 'phaser';
import enemiesData from '../../../data/static/enemies.json';
import { EnemyBot } from '../entities/EnemyBot';
import { PlayerRobot } from '../entities/PlayerRobot';
import type { ExplosionEvent } from '../entities/Projectile';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { MovementSystem, type MovementKeys } from '../systems/MovementSystem';
import { WeaponSystem, type MeleeAttackEvent } from '../systems/WeaponSystem';
import type { Enemy } from '../types/Enemy';

const ARENA = new Phaser.Geom.Rectangle(40, 70, 880, 430);
const GRID_SIZE = 40;
const BATTLE_CONFIG = {
  playerMaxHealth: 100,
} as const;
const ENEMY_CONFIGS = enemiesData as Enemy[];
const ENEMY_SPAWNS = [
  { id: 'bot_basic', x: ARENA.right - 120, y: ARENA.top + 100 },
  { id: 'bot_fast', x: ARENA.right - 130, y: ARENA.bottom - 90 },
  { id: 'bot_shooter', x: ARENA.left + 120, y: ARENA.top + 100 },
] as const;

type BattleState = 'active' | 'victory' | 'defeat';
type WeaponSlot = 'laser_basic' | 'rocket_basic' | 'sword_basic';

export class BattleScene extends Phaser.Scene {
  private movementSystem?: MovementSystem;
  private enemyAISystem?: EnemyAISystem;
  private playerRobot?: PlayerRobot;
  private enemies: EnemyBot[] = [];
  private weaponSystem?: WeaponSystem;
  private combatSystem?: CombatSystem;
  private healthText?: Phaser.GameObjects.Text;
  private weaponText?: Phaser.GameObjects.Text;
  private enemyCountText?: Phaser.GameObjects.Text;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private weaponSlotKeys?: Record<WeaponSlot, Phaser.Input.Keyboard.Key>;
  private battleState: BattleState = 'active';

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.battleState = 'active';
    this.enemies = [];
    this.cameras.main.setBackgroundColor('#101820');
    this.drawArena();

    this.add
      .text(this.scale.width / 2, 30, 'Battle Prototype - Stage 3-A', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add.text(
      ARENA.x + 12,
      ARENA.y + 10,
      'Move: W A S D  |  Aim: Mouse  |  Fire: Left click  |  Weapons: 1 2 3',
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

    this.enemies = this.createEnemies();
    this.enemyAISystem = new EnemyAISystem(
      this,
      this.enemies,
      this.playerRobot,
      ARENA,
    );
    this.weaponSystem = new WeaponSystem(
      this,
      this.playerRobot,
      ARENA,
      (explosion) => this.showExplosion(explosion),
      (attack) => this.showSwordAttack(attack),
    );
    this.combatSystem = new CombatSystem(
      this.enemies,
      this.playerRobot,
      () => this.handleEnemyDestroyed(),
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
    this.weaponText = this.add
      .text(ARENA.x + 12, ARENA.bottom + 14, '', {
        color: '#f4d35e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.enemyCountText = this.add
      .text(ARENA.right - 12, ARENA.bottom + 14, '', {
        color: '#ffb4ba',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.updateHealthText();
    this.updateWeaponText();
    this.updateEnemyCountText();

    this.restartKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.R,
    );
    this.weaponSlotKeys = {
      laser_basic: this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.ONE,
      ),
      rocket_basic: this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.TWO,
      ),
      sword_basic: this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.THREE,
      ),
    };
  }

  update(time: number, delta: number): void {
    if (this.battleState !== 'active') {
      if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart();
      }

      return;
    }

    this.movementSystem?.update(delta);
    this.updateWeaponSelection();

    const pointer = this.input.activePointer;
    this.playerRobot?.aimAt(pointer.worldX, pointer.worldY);
    this.enemyAISystem?.update(time, delta);
    this.weaponSystem?.update(time, delta, pointer, true);

    if (this.weaponSystem) {
      this.combatSystem?.update(
        time,
        this.weaponSystem.getActiveProjectiles(),
        this.enemyAISystem?.getActiveProjectiles() ?? [],
        (projectile) =>
          this.weaponSystem?.explodeProjectile(projectile) ?? null,
      );
      for (const explosion of this.weaponSystem.consumeExplosionEvents()) {
        this.combatSystem?.applyExplosion(explosion);
      }
      for (const attack of this.weaponSystem.consumeMeleeAttackEvents()) {
        this.combatSystem?.applyMeleeAttack(attack);
      }
    }

    this.separatePlayerFromEnemies();
  }

  private separatePlayerFromEnemies(): void {
    if (!this.playerRobot) {
      return;
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) {
        continue;
      }

      const deltaX = this.playerRobot.x - enemy.x;
      const deltaY = this.playerRobot.y - enemy.y;
      const minimumDistance =
        this.playerRobot.collisionRadius + enemy.collisionRadius;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;

      if (distanceSquared >= minimumDistance * minimumDistance) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);
      const normalX = distance > 0 ? deltaX / distance : -1;
      const normalY = distance > 0 ? deltaY / distance : 0;
      const overlap = minimumDistance - distance;

      this.playerRobot.x += normalX * overlap;
      this.playerRobot.y += normalY * overlap;
      this.movementSystem?.clampToBounds();
    }
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
    this.enemyAISystem?.destroyProjectiles();

    const message =
      result === 'victory'
        ? 'Victory - all enemies destroyed - press R to restart'
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

  private updateWeaponSelection(): void {
    if (!this.weaponSystem || !this.weaponSlotKeys) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.weaponSlotKeys.laser_basic)) {
      this.weaponSystem.selectWeapon('laser_basic');
      this.updateWeaponText();
    } else if (
      Phaser.Input.Keyboard.JustDown(this.weaponSlotKeys.rocket_basic)
    ) {
      this.weaponSystem.selectWeapon('rocket_basic');
      this.updateWeaponText();
    } else if (
      Phaser.Input.Keyboard.JustDown(this.weaponSlotKeys.sword_basic)
    ) {
      this.weaponSystem.selectWeapon('sword_basic');
      this.updateWeaponText();
    }
  }

  private updateWeaponText(): void {
    const weapon = this.weaponSystem?.getActiveWeapon();

    if (!weapon || !this.weaponText) {
      return;
    }

    const label = weapon.name.replace(/^Basic\s+/, '');
    this.weaponText.setText(`Weapon: ${label}`);
  }

  private updateEnemyCountText(): void {
    const enemiesLeft = this.enemies.filter((enemy) => enemy.active).length;
    this.enemyCountText?.setText(`Enemies: ${enemiesLeft}`);
  }

  private handleEnemyDestroyed(): void {
    this.updateEnemyCountText();

    if (this.enemies.every((enemy) => !enemy.active)) {
      this.endBattle('victory');
    }
  }

  private showExplosion(explosion: ExplosionEvent): void {
    const blast = this.add.circle(
      explosion.x,
      explosion.y,
      explosion.radius,
      0xffb347,
      0.28,
    );
    blast.setStrokeStyle(2, 0xffe0b2, 0.85);

    this.tweens.add({
      targets: blast,
      alpha: 0,
      scale: 1.2,
      duration: 180,
      onComplete: () => blast.destroy(),
    });
  }

  private showSwordAttack(attack: MeleeAttackEvent): void {
    const offset = attack.range * 0.6;
    const centerX = attack.x + Math.cos(attack.angle) * offset;
    const centerY = attack.y + Math.sin(attack.angle) * offset;
    const slash = this.add.rectangle(
      centerX,
      centerY,
      attack.range,
      attack.range * 0.55,
      0xfff1a6,
      0.3,
    );
    slash.rotation = attack.angle;
    slash.setStrokeStyle(2, 0xf4d35e, 0.9);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 140,
      onComplete: () => slash.destroy(),
    });
  }

  private createEnemies(): EnemyBot[] {
    return ENEMY_SPAWNS.map((spawn) => {
      const config = ENEMY_CONFIGS.find((enemy) => enemy.id === spawn.id);

      if (!config) {
        throw new Error(`Missing enemy config: ${spawn.id}`);
      }

      return new EnemyBot(this, spawn.x, spawn.y, config);
    });
  }

  private createMovementKeys(): MovementKeys {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error(
        'Keyboard input is required for the Stage 3-A prototype.',
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
