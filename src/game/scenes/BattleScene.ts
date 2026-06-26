import Phaser from 'phaser';
import enemiesData from '../../../data/static/enemies.json';
import missionsData from '../../../data/static/missions.json';
import { EnemyBot } from '../entities/EnemyBot';
import { PlayerRobot } from '../entities/PlayerRobot';
import type { ExplosionEvent } from '../entities/Projectile';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { MovementSystem, type MovementKeys } from '../systems/MovementSystem';
import { StatsSystem } from '../systems/StatsSystem';
import { WeaponSystem, type MeleeAttackEvent } from '../systems/WeaponSystem';
import { playerService } from '../services/PlayerService';
import type { Enemy } from '../types/Enemy';
import type { Mission } from '../types/Mission';
import type { PlayerSave } from '../types/PlayerSave';
import type { RobotStats } from '../types/RobotStats';

const ARENA = new Phaser.Geom.Rectangle(40, 70, 880, 430);
const GRID_SIZE = 40;
const ENEMY_CONFIGS = enemiesData as Enemy[];
const MISSION_CONFIGS = missionsData as Mission[];
const DEFAULT_MISSION_ID = 'mission_1';
const WAVE_TRANSITION_DELAY_MS = 750;
const ENEMY_SPAWN_POSITIONS = [
  { x: ARENA.right - 120, y: ARENA.top + 100 },
  { x: ARENA.right - 130, y: ARENA.bottom - 90 },
  { x: ARENA.left + 120, y: ARENA.top + 100 },
] as const;
const BOSS_SPAWN_POSITION = {
  x: ARENA.right - 140,
  y: ARENA.centerY,
} as const;

type BattleState = 'active' | 'waveTransition' | 'victory' | 'defeat';
type BattleResult = Extract<BattleState, 'victory' | 'defeat'>;
type WeaponSlot = 'laser_basic' | 'rocket_basic' | 'sword_basic';
type BattleSceneData = {
  playerId?: string;
  missionId?: string;
};

export class BattleScene extends Phaser.Scene {
  private movementSystem?: MovementSystem;
  private enemyAISystem?: EnemyAISystem;
  private playerRobot?: PlayerRobot;
  private enemies: EnemyBot[] = [];
  private weaponSystem?: WeaponSystem;
  private combatSystem?: CombatSystem;
  private healthText?: Phaser.GameObjects.Text;
  private weaponText?: Phaser.GameObjects.Text;
  private waveText?: Phaser.GameObjects.Text;
  private enemyCountText?: Phaser.GameObjects.Text;
  private bossHealthText?: Phaser.GameObjects.Text;
  private waveTransitionText?: Phaser.GameObjects.Text;
  private playerNameText?: Phaser.GameObjects.Text;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private weaponSlotKeys?: Record<WeaponSlot, Phaser.Input.Keyboard.Key>;
  private currentWaveIndex = 0;
  private boss?: EnemyBot;
  private bossPhase = false;
  private battleState: BattleState = 'active';
  private playerId: string | null = null;
  private playerSave: PlayerSave | null = null;
  private robotStats?: RobotStats;
  private battleResultSaved = false;
  private missionId: string = DEFAULT_MISSION_ID;
  private activeMission?: Mission;

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.playerId = data.playerId ?? null;
    this.missionId = data.missionId ?? DEFAULT_MISSION_ID;
  }

  create(): void {
    this.playerSave = this.playerId
      ? playerService.loadPlayer(this.playerId)
      : null;

    if (!this.playerSave) {
      this.scene.start('StartScene');
      return;
    }

    this.activeMission = this.getMissionById(this.missionId);

    if (
      !this.activeMission ||
      playerService.getMissionStatus(
        this.playerSave.id,
        this.activeMission.id,
        this.activeMission.requiredCompletedMissionId,
      ) === 'locked'
    ) {
      this.scene.start('MissionSelectScene', { playerId: this.playerId });
      return;
    }

    this.robotStats = StatsSystem.calculate(this.playerSave.currentBuild);
    this.battleState = 'active';
    this.battleResultSaved = false;
    this.currentWaveIndex = 0;
    this.boss = undefined;
    this.bossPhase = false;
    this.enemies = [];
    this.healthText = undefined;
    this.weaponText = undefined;
    this.waveText = undefined;
    this.enemyCountText = undefined;
    this.bossHealthText = undefined;
    this.waveTransitionText = undefined;
    this.playerNameText = undefined;
    this.cameras.main.setBackgroundColor('#101820');
    this.drawArena();

    this.add
      .text(this.scale.width / 2, 30, `Mission: ${this.activeMission.name}`, {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.playerNameText = this.add.text(
      ARENA.x + 12,
      50,
      `Pilot: ${this.playerSave.name} | ARM ${this.robotStats.armor} | DMG x${this.robotStats.damageMultiplier.toFixed(2)}`,
      {
        color: '#8effb6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      },
    );

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
      this.robotStats.maxHp,
      this.robotStats.color,
    );
    this.movementSystem = new MovementSystem(
      this.playerRobot,
      this.createMovementKeys(),
      ARENA,
      this.robotStats.speed,
    );

    this.spawnWave(this.currentWaveIndex);
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
      {
        availableWeaponIds: this.robotStats.weaponIds,
        damageMultiplier: this.robotStats.damageMultiplier,
      },
    );
    this.combatSystem = new CombatSystem(
      this.enemies,
      this.playerRobot,
      (enemy) => this.handleEnemyDestroyed(enemy),
      () => this.updateHealthText(),
      () => this.endBattle('defeat'),
      this.robotStats.armor,
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
    this.waveText = this.add
      .text(this.scale.width / 2, ARENA.bottom + 14, '', {
        color: '#b8d8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    this.enemyCountText = this.add
      .text(ARENA.right - 12, ARENA.bottom + 14, '', {
        color: '#ffb4ba',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.bossHealthText = this.add
      .text(this.scale.width / 2, ARENA.top + 38, '', {
        backgroundColor: '#351625',
        color: '#ffd0df',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.updateHealthText();
    this.updateWeaponText();
    this.updateWaveText();
    this.updateEnemyCountText();
    this.updateBossHealthText();

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
        this.scene.restart({
          playerId: this.playerId,
          missionId: this.missionId,
        });
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

    this.updateBossHealthText();
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

  private endBattle(result: BattleResult): void {
    if (this.battleState !== 'active') {
      return;
    }

    this.battleState = result;
    this.saveBattleResult(result);

    this.clearCombatProjectiles();

    const message =
      result === 'victory'
        ? 'Victory - boss defeated - press R to restart'
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

  private saveBattleResult(result: BattleResult): void {
    if (!this.playerId || this.battleResultSaved) {
      return;
    }

    playerService.recordBattleResult(this.playerId, result);
    this.battleResultSaved = true;
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

  private updateWaveText(): void {
    const label = this.bossPhase
      ? 'Wave: Boss'
      : `Wave: ${this.currentWaveIndex + 1} / ${this.activeMission?.waves.length ?? 1}`;
    this.waveText?.setText(label);
  }

  private updateBossHealthText(): void {
    if (!this.boss?.active) {
      this.bossHealthText?.setVisible(false);
      return;
    }

    this.bossHealthText
      ?.setText(`Boss HP: ${this.boss.health} / ${this.boss.maxHealth}`)
      .setVisible(true);
  }

  private handleEnemyDestroyed(enemy: EnemyBot): void {
    this.updateEnemyCountText();
    if (enemy === this.boss) {
      this.updateBossHealthText();
    }

    if (this.enemies.every((enemy) => !enemy.active)) {
      if (this.bossPhase) {
        this.endBattle('victory');
      } else if (
        this.currentWaveIndex ===
        (this.activeMission?.waves.length ?? 1) - 1
      ) {
        if (this.activeMission?.bossId) {
          this.startBossTransition();
        } else {
          this.endBattle('victory');
        }
      } else {
        this.startWaveTransition();
      }
    }
  }

  private getMissionById(missionId: string): Mission | undefined {
    return MISSION_CONFIGS.find((mission) => mission.id === missionId);
  }

  private startWaveTransition(): void {
    this.startCombatTransition('Wave cleared', () => {
      this.spawnWave(this.currentWaveIndex + 1);
    });
  }

  private startBossTransition(): void {
    if (!this.activeMission?.bossId) {
      this.endBattle('victory');
      return;
    }

    this.startCombatTransition('Boss incoming', () => this.spawnBoss());
  }

  private startCombatTransition(message: string, onComplete: () => void): void {
    if (this.battleState !== 'active') {
      return;
    }

    this.battleState = 'waveTransition';
    this.clearCombatProjectiles();
    this.waveTransitionText = this.add
      .text(this.scale.width / 2, ARENA.centerY, message, {
        backgroundColor: '#172d42',
        color: '#b8d8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5);

    this.time.delayedCall(WAVE_TRANSITION_DELAY_MS, () => {
      if (this.battleState !== 'waveTransition') {
        return;
      }

      this.waveTransitionText?.destroy();
      this.waveTransitionText = undefined;
      onComplete();
      this.battleState = 'active';
    });
  }

  private clearCombatProjectiles(): void {
    for (const projectile of this.weaponSystem?.getActiveProjectiles() ?? []) {
      projectile.destroy();
    }

    this.enemyAISystem?.destroyProjectiles();
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

  private spawnWave(waveIndex: number): void {
    const wave = this.activeMission?.waves[waveIndex];

    if (!wave) {
      throw new Error(`Missing wave definition: ${waveIndex}`);
    }

    const spawnedEnemies = wave.enemyIds.map((enemyId, index) => {
      const config = ENEMY_CONFIGS.find((enemy) => enemy.id === enemyId);
      const position = ENEMY_SPAWN_POSITIONS[index];

      if (!config) {
        throw new Error(`Missing enemy config: ${enemyId}`);
      }

      if (!position) {
        throw new Error(`Missing enemy spawn position: ${index}`);
      }

      return new EnemyBot(this, position.x, position.y, config);
    });

    this.currentWaveIndex = waveIndex;
    this.boss = undefined;
    this.bossPhase = false;
    this.enemies.splice(0, this.enemies.length, ...spawnedEnemies);
    this.updateWaveText();
    this.updateEnemyCountText();
    this.updateBossHealthText();
  }

  private spawnBoss(): void {
    const bossId = this.activeMission?.bossId;

    if (!bossId) {
      this.endBattle('victory');
      return;
    }

    const config = ENEMY_CONFIGS.find((enemy) => enemy.id === bossId);

    if (!config || config.kind !== 'boss') {
      throw new Error(`Missing boss config: ${bossId}`);
    }

    this.boss = new EnemyBot(
      this,
      BOSS_SPAWN_POSITION.x,
      BOSS_SPAWN_POSITION.y,
      config,
    );
    this.bossPhase = true;
    this.enemies.splice(0, this.enemies.length, this.boss);
    this.updateWaveText();
    this.updateEnemyCountText();
    this.updateBossHealthText();
  }

  private createMovementKeys(): MovementKeys {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error(
        'Keyboard input is required for the Stage 3-C prototype.',
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
