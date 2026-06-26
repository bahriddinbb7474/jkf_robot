import Phaser from 'phaser';
import missionsData from '../../../data/static/missions.json';
import partsData from '../../../data/static/parts.json';
import { playerService } from '../services/PlayerService';
import type { Mission, MissionStatus } from '../types/Mission';
import type { Part } from '../types/Part';
import type { PlayerSave } from '../types/PlayerSave';

type MissionSelectSceneData = {
  playerId?: string;
  fromScene?: 'StartScene' | 'GarageScene' | 'ShopScene';
};

const missions = missionsData as Mission[];
const parts = partsData as Part[];

const STATUS_LABELS: Record<MissionStatus, string> = {
  completed: 'COMPLETED',
  unlocked: 'UNLOCKED',
  locked: 'LOCKED',
};

export class MissionSelectScene extends Phaser.Scene {
  private playerId: string | null = null;
  private playerSave: PlayerSave | null = null;
  private selectedMissionId: string | null = null;
  private fromScene: 'StartScene' | 'GarageScene' | 'ShopScene' = 'StartScene';
  private missionListContainer?: Phaser.GameObjects.Container;
  private detailText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private startButton?: Phaser.GameObjects.Text;

  constructor() {
    super('MissionSelectScene');
  }

  init(data: MissionSelectSceneData): void {
    this.playerId = data.playerId ?? null;
    this.fromScene = data.fromScene ?? 'StartScene';
  }

  create(): void {
    this.playerSave = this.playerId
      ? playerService.loadPlayer(this.playerId)
      : null;

    if (!this.playerSave) {
      this.scene.start('StartScene');
      return;
    }

    this.selectedMissionId = this.getFirstSelectableMissionId();
    this.cameras.main.setBackgroundColor('#08111f');
    this.drawBackdrop();

    this.add
      .text(this.scale.width / 2, 34, 'Missions', {
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

    this.missionListContainer = this.add.container(56, 148);
    this.detailText = this.add.text(580, 148, '', {
      color: '#c8d3df',
      fixedWidth: 320,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      lineSpacing: 6,
    });
    this.statusText = this.add
      .text(220, 496, '', {
        color: '#91a4bd',
        fixedWidth: 340,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0, 0.5);

    this.createButton(82, 496, 'Back', () => this.goBack());
    this.createButton(620, 496, 'Garage', () =>
      this.scene.start('GarageScene', { playerId: this.playerId }),
    );
    this.createButton(730, 496, 'Shop', () =>
      this.scene.start('ShopScene', { playerId: this.playerId }),
    );
    this.startButton = this.createButton(860, 496, 'Start', () =>
      this.startMission(),
    );

    this.renderMissions();
    this.renderMissionDetails();
    this.updateStartButtonState();
  }

  private renderMissions(): void {
    if (!this.missionListContainer || !this.playerId) {
      return;
    }

    this.missionListContainer.removeAll(true);
    this.missionListContainer.add(
      this.add.text(0, 0, 'Mission list', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      }),
    );

    missions.forEach((mission, index) => {
      const status = this.getMissionStatus(mission);
      const selected = mission.id === this.selectedMissionId;
      const row = this.add
        .text(0, 42 + index * 72, this.formatMissionRow(mission, status), {
          backgroundColor: selected ? '#1d547d' : '#101820',
          color: selected ? '#ffffff' : this.getStatusColor(status),
          fixedWidth: 470,
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          padding: { x: 10, y: 8 },
        })
        .setInteractive({ useHandCursor: status !== 'locked' });

      row.on('pointerup', () => {
        if (status === 'locked') {
          this.setStatus('Complete the previous mission first.');
          return;
        }

        this.selectedMissionId = mission.id;
        this.renderMissions();
        this.renderMissionDetails();
        this.updateStartButtonState();
      });

      this.missionListContainer?.add(row);
    });
  }

  private renderMissionDetails(): void {
    const mission = this.getSelectedMission();

    if (!mission) {
      this.detailText?.setText('No mission available.');
      return;
    }

    const unlocks =
      mission.unlockPartIds.length > 0
        ? mission.unlockPartIds
            .map((partId) => this.getPartName(partId))
            .join(', ')
        : 'None';

    this.detailText?.setText(
      [
        mission.name,
        '',
        mission.description,
        '',
        `Reward: ${mission.rewardMoney} cr`,
        `Waves: ${mission.waves.length}`,
        `Boss: ${mission.bossId ? 'Yes' : 'No'}`,
        `Unlocks: ${unlocks}`,
      ].join('\n'),
    );
  }

  private startMission(): void {
    const mission = this.getSelectedMission();

    if (!mission || !this.playerId) {
      this.setStatus('Select an unlocked mission first.');
      return;
    }

    if (this.getMissionStatus(mission) === 'locked') {
      this.setStatus('Complete the previous mission first.');
      return;
    }

    this.scene.start('BattleScene', {
      playerId: this.playerId,
      missionId: mission.id,
    });
  }

  private goBack(): void {
    this.scene.start(this.fromScene, { playerId: this.playerId });
  }

  private getFirstSelectableMissionId(): string | null {
    return (
      missions.find((mission) => this.getMissionStatus(mission) !== 'locked')
        ?.id ?? null
    );
  }

  private getSelectedMission(): Mission | null {
    return (
      missions.find((mission) => mission.id === this.selectedMissionId) ?? null
    );
  }

  private getMissionStatus(mission: Mission): MissionStatus {
    if (!this.playerId) {
      return 'locked';
    }

    const status = playerService.getMissionStatus(
      this.playerId,
      mission.id,
      mission.requiredCompletedMissionId,
    );

    return status === 'missing-player' ? 'locked' : status;
  }

  private formatMissionRow(mission: Mission, status: MissionStatus): string {
    return `${mission.name}\n${STATUS_LABELS[status]} | Reward ${mission.rewardMoney} cr`;
  }

  private getStatusColor(status: MissionStatus): string {
    switch (status) {
      case 'completed':
        return '#8effb6';
      case 'unlocked':
        return '#f4f7fb';
      case 'locked':
        return '#f08a8a';
    }
  }

  private getPartName(partId: string): string {
    return parts.find((part) => part.id === partId)?.name ?? partId;
  }

  private updateStartButtonState(): void {
    const mission = this.getSelectedMission();
    const active =
      mission !== null && this.getMissionStatus(mission) !== 'locked';

    this.startButton?.setBackgroundColor(active ? '#143652' : '#2a3440');
    this.startButton?.setColor(active ? '#f4f7fb' : '#91a4bd');
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
    button.on('pointerout', () => {
      button.setBackgroundColor('#143652');
      this.updateStartButtonState();
    });
    button.on('pointerup', onClick);

    return button;
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message);
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0b1524, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0x102235, 1);
    graphics.fillRect(30, 70, 900, 420);
    graphics.lineStyle(2, 0x2a4b68, 0.9);
    graphics.strokeRect(30, 70, 900, 420);
    graphics.lineStyle(1, 0x1d547d, 0.55);

    for (let y = 132; y < 452; y += 72) {
      graphics.lineBetween(30, y, 930, y);
    }

    graphics.fillStyle(0x08111f, 0.9);
    graphics.fillRect(30, 458, 900, 32);
  }
}
