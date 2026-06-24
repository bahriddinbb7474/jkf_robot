import Phaser from 'phaser';
import { playerService } from '../services/PlayerService';
import { StatsSystem } from '../systems/StatsSystem';
import type { PlayerSave } from '../types/PlayerSave';
import type { RobotStats } from '../types/RobotStats';

type GarageSceneData = {
  playerId?: string;
};

export class GarageScene extends Phaser.Scene {
  private playerId: string | null = null;
  private playerSave: PlayerSave | null = null;

  constructor() {
    super('GarageScene');
  }

  init(data: GarageSceneData): void {
    this.playerId = data.playerId ?? null;
  }

  create(): void {
    this.playerSave = this.playerId
      ? playerService.loadPlayer(this.playerId)
      : null;

    if (!this.playerSave) {
      this.scene.start('StartScene');
      return;
    }

    this.cameras.main.setBackgroundColor('#08111f');
    this.drawGarageBackdrop();

    const stats = StatsSystem.calculate(this.playerSave.currentBuild);

    this.add
      .text(this.scale.width / 2, 34, 'Garage', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add.text(56, 76, `Pilot: ${this.playerSave.name}`, {
      color: '#8effb6',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    });

    this.add.text(56, 106, `Money: ${this.playerSave.money}`, {
      color: '#f4d35e',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
    });

    this.drawRobotPreview(250, 284, stats);
    this.renderBuildSummary(510, 96);
    this.renderStatsSummary(510, 286, stats);
    this.createButton(100, 484, 'Back', () => this.scene.start('StartScene'));
    this.createButton(810, 484, 'Start Battle', () =>
      this.scene.start('BattleScene', { playerId: this.playerId }),
    );
  }

  private renderBuildSummary(x: number, y: number): void {
    if (!this.playerSave) {
      return;
    }

    const build = this.playerSave.currentBuild;
    const rows = [
      ['Body', build.bodyId],
      ['Head', build.headId],
      ['Legs', build.legsId],
      ['Armor', build.armorId],
      ['Color', build.colorId],
      ['Weapons', build.weaponIds.join(', ')],
    ];

    this.add.text(x, y, 'Current build', {
      color: '#d8e4ed',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    rows.forEach(([label, value], index) => {
      this.add.text(x, y + 38 + index * 26, `${label}: ${value}`, {
        color: '#c8d3df',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
      });
    });
  }

  private renderStatsSummary(x: number, y: number, stats: RobotStats): void {
    const rows = [
      `Max HP: ${stats.maxHp}`,
      `Armor: ${stats.armor}`,
      `Speed: ${stats.speed}`,
      `Damage: x${stats.damageMultiplier.toFixed(2)}`,
      `Weapons: ${stats.weaponIds.length}`,
      `Color: ${stats.colorHex}`,
    ];

    this.add.text(x, y, 'Stats', {
      color: '#d8e4ed',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    rows.forEach((row, index) => {
      this.add.text(x, y + 38 + index * 26, row, {
        color: '#b8d8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      });
    });
  }

  private drawRobotPreview(x: number, y: number, stats: RobotStats): void {
    this.add
      .text(x, 118, 'Robot preview', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add.circle(x, y + 54, 96, 0x102235, 0.9).setStrokeStyle(3, 0x2f6fff);
    this.add.rectangle(x, y, 92, 100, stats.color).setStrokeStyle(4, 0xbcefff);
    this.add.rectangle(x, y - 66, 70, 34, 0xc8d3df).setStrokeStyle(3, 0x111820);
    this.add
      .rectangle(x - 82, y - 8, 44, 82, stats.color)
      .setStrokeStyle(3, 0x111820);
    this.add
      .rectangle(x + 82, y - 8, 44, 82, stats.color)
      .setStrokeStyle(3, 0x111820);
    this.add
      .rectangle(x - 34, y + 78, 34, 56, 0xc8d3df)
      .setStrokeStyle(3, 0x111820);
    this.add
      .rectangle(x + 34, y + 78, 34, 56, 0xc8d3df)
      .setStrokeStyle(3, 0x111820);
    this.add.circle(x, y - 10, 18, 0x57d4ff, 0.9);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#1d547d'));
    button.on('pointerout', () => button.setBackgroundColor('#143652'));
    button.on('pointerup', onClick);

    return button;
  }

  private drawGarageBackdrop(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0b1524, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0x102235, 1);
    graphics.fillRect(30, 70, 900, 420);
    graphics.lineStyle(2, 0x2a4b68, 0.9);
    graphics.strokeRect(30, 70, 900, 420);
    graphics.lineStyle(1, 0x1d547d, 0.55);

    for (let x = 70; x < 900; x += 80) {
      graphics.lineBetween(x, 70, x - 38, 490);
    }

    graphics.fillStyle(0x16324a, 1);
    graphics.fillCircle(250, 338, 132);
    graphics.lineStyle(4, 0x57d4ff, 0.7);
    graphics.strokeCircle(250, 338, 132);
  }
}
