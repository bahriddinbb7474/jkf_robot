import Phaser from 'phaser';
import missionsData from '../../../data/static/missions.json';
import partsData from '../../../data/static/parts.json';
import { playerService } from '../services/PlayerService';
import type { Mission } from '../types/Mission';
import type { Part } from '../types/Part';
import type { BattleResult, PlayerSave } from '../types/PlayerSave';

type RewardSceneData = {
  playerId?: string;
  missionId?: string;
  result?: BattleResult;
  rewardMoney?: number;
  unlockedPartIds?: string[];
  alreadyCompleted?: boolean;
};

const missions = missionsData as Mission[];
const parts = partsData as Part[];

export class RewardScene extends Phaser.Scene {
  private playerId: string | null = null;
  private missionId: string | null = null;
  private result: BattleResult = 'defeat';
  private rewardMoney = 0;
  private unlockedPartIds: string[] = [];
  private alreadyCompleted = false;
  private playerSave: PlayerSave | null = null;

  constructor() {
    super('RewardScene');
  }

  init(data: RewardSceneData): void {
    this.playerId = data.playerId ?? null;
    this.missionId = data.missionId ?? null;
    this.result = data.result ?? 'defeat';
    this.rewardMoney = data.rewardMoney ?? 0;
    this.unlockedPartIds = data.unlockedPartIds ?? [];
    this.alreadyCompleted = data.alreadyCompleted ?? false;
  }

  create(): void {
    this.playerSave = this.playerId
      ? playerService.loadPlayer(this.playerId)
      : null;

    if (!this.playerSave) {
      this.scene.start('StartScene');
      return;
    }

    const mission = this.getMission();
    this.cameras.main.setBackgroundColor('#08111f');
    this.drawBackdrop();

    this.add
      .text(this.scale.width / 2, 40, 'Mission Result', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const success = this.result === 'victory';
    const resultLabel = success ? 'Victory' : 'Defeat';
    const resultColor = success ? '#8effb6' : '#ff9ca5';
    const unlocks =
      this.unlockedPartIds.length > 0
        ? this.unlockedPartIds
            .map((partId) => this.getPartName(partId))
            .join(', ')
        : 'None';
    const note = success
      ? this.alreadyCompleted
        ? 'Mission was already completed. No repeat reward.'
        : 'Mission completed. Progress saved.'
      : 'No mission reward. Your bought parts and build are safe.';

    this.add.text(80, 94, `Pilot: ${this.playerSave.name}`, {
      color: '#8effb6',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    });

    this.add.text(80, 126, `Mission: ${mission?.name ?? this.missionId}`, {
      color: '#b8d8ff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
    });

    this.add.text(80, 174, resultLabel, {
      color: resultColor,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
    });

    this.add.text(
      80,
      244,
      [
        `Money earned: ${this.rewardMoney} cr`,
        `Unlocked parts: ${unlocks}`,
        `Current money: ${this.playerSave.money}`,
        note,
      ].join('\n'),
      {
        color: '#c8d3df',
        fixedWidth: 760,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        lineSpacing: 8,
      },
    );

    this.createButton(92, 496, 'Missions', () =>
      this.scene.start('MissionSelectScene', {
        playerId: this.playerId,
        fromScene: 'StartScene',
      }),
    );
    this.createButton(235, 496, 'Retry', () =>
      this.scene.start('BattleScene', {
        playerId: this.playerId,
        missionId: this.missionId,
      }),
    );
    this.createButton(690, 496, 'Garage', () =>
      this.scene.start('GarageScene', { playerId: this.playerId }),
    );
    this.createButton(820, 496, 'Shop', () =>
      this.scene.start('ShopScene', { playerId: this.playerId }),
    );
  }

  private getMission(): Mission | undefined {
    return missions.find((mission) => mission.id === this.missionId);
  }

  private getPartName(partId: string): string {
    return parts.find((part) => part.id === partId)?.name ?? partId;
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

  private drawBackdrop(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0b1524, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0x102235, 1);
    graphics.fillRect(30, 70, 900, 420);
    graphics.lineStyle(2, 0x2a4b68, 0.9);
    graphics.strokeRect(30, 70, 900, 420);
    graphics.fillStyle(0x08111f, 0.9);
    graphics.fillRect(30, 458, 900, 32);
  }
}
