import Phaser from 'phaser';
import { playerService } from '../services/PlayerService';
import { StatsSystem } from '../systems/StatsSystem';
import type { Part, PartSlot } from '../types/Part';
import type { PlayerSave } from '../types/PlayerSave';
import type { RobotBuild } from '../types/RobotBuild';
import type { RobotStats } from '../types/RobotStats';

type GarageSceneData = {
  playerId?: string;
};

const PART_SLOTS: Array<{ key: PartSlot; label: string }> = [
  { key: 'body', label: 'Body' },
  { key: 'head', label: 'Head' },
  { key: 'legs', label: 'Legs' },
  { key: 'armor', label: 'Armor' },
  { key: 'color', label: 'Color' },
];

export class GarageScene extends Phaser.Scene {
  private playerId: string | null = null;
  private playerSave: PlayerSave | null = null;
  private workingBuild?: RobotBuild;
  private previewContainer?: Phaser.GameObjects.Container;
  private partsContainer?: Phaser.GameObjects.Container;
  private statsContainer?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;

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

    this.workingBuild = this.cloneBuild(this.playerSave.currentBuild);
    this.cameras.main.setBackgroundColor('#08111f');
    this.drawGarageBackdrop();

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

    this.previewContainer = this.add.container(0, 0);
    this.partsContainer = this.add.container(0, 0);
    this.statsContainer = this.add.container(0, 0);

    this.statusText = this.add
      .text(210, 486, '', {
        color: '#91a4bd',
        fixedWidth: 330,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0, 0.5);

    this.createButton(82, 484, 'Back', () => this.scene.start('StartScene'));
    this.createButton(570, 484, 'Shop', () =>
      this.scene.start('ShopScene', { playerId: this.playerId }),
    );
    this.createButton(690, 484, 'Missions', () =>
      this.scene.start('MissionSelectScene', {
        playerId: this.playerId,
        fromScene: 'GarageScene',
      }),
    );
    this.createButton(840, 484, 'Save Build', () => this.saveBuild());

    this.renderGarage();
  }

  private renderGarage(): void {
    if (!this.workingBuild) {
      return;
    }

    const stats = StatsSystem.calculate(this.workingBuild);

    this.renderRobotPreview(250, 284, stats);
    this.renderPartSelection(440, 92);
    this.renderStatsSummary(700, 92, stats);
  }

  private renderPartSelection(x: number, y: number): void {
    if (!this.playerSave || !this.workingBuild || !this.partsContainer) {
      return;
    }

    this.partsContainer.removeAll(true);
    this.partsContainer.add(
      this.add.text(x, y, 'Owned parts', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      }),
    );

    PART_SLOTS.forEach((slot, slotIndex) => {
      const slotY = y + 36 + slotIndex * 70;
      const ownedParts = StatsSystem.getPartsBySlot(slot.key).filter((part) =>
        this.playerSave?.ownedPartIds.includes(part.id),
      );

      this.partsContainer?.add(
        this.add.text(x, slotY, slot.label, {
          color: '#8effb6',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
        }),
      );

      ownedParts.forEach((part, partIndex) => {
        const selected = this.getSelectedPartId(slot.key) === part.id;
        const option = this.add
          .text(x, slotY + 24 + partIndex * 24, this.formatPartOption(part), {
            backgroundColor: selected ? '#1d547d' : '#101820',
            color: selected ? '#ffffff' : '#c8d3df',
            fixedWidth: 210,
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            padding: { x: 8, y: 4 },
          })
          .setInteractive({ useHandCursor: true });

        option.on('pointerup', () => this.selectPart(slot.key, part.id));
        this.partsContainer?.add(option);
      });
    });
  }

  private renderStatsSummary(x: number, y: number, stats: RobotStats): void {
    if (!this.workingBuild || !this.statsContainer) {
      return;
    }

    this.statsContainer.removeAll(true);

    const buildRows = [
      `Body: ${this.getPartName(this.workingBuild.bodyId)}`,
      `Head: ${this.getPartName(this.workingBuild.headId)}`,
      `Legs: ${this.getPartName(this.workingBuild.legsId)}`,
      `Armor: ${this.getPartName(this.workingBuild.armorId)}`,
      `Color: ${this.getPartName(this.workingBuild.colorId)}`,
      `Weapons: ${stats.weaponIds.length}`,
    ];
    const statRows = [
      `Max HP: ${stats.maxHp}`,
      `Armor: ${stats.armor}`,
      `Speed: ${stats.speed}`,
      `Damage: x${stats.damageMultiplier.toFixed(2)}`,
      `Color: ${stats.colorHex}`,
    ];

    this.statsContainer.add(
      this.add.text(x, y, 'Current build', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      }),
    );

    buildRows.forEach((row, index) => {
      this.statsContainer?.add(
        this.add.text(x, y + 34 + index * 24, row, {
          color: '#c8d3df',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
        }),
      );
    });

    this.statsContainer.add(
      this.add.text(x, y + 206, 'Stats', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      }),
    );

    statRows.forEach((row, index) => {
      this.statsContainer?.add(
        this.add.text(x, y + 240 + index * 24, row, {
          color: '#b8d8ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
        }),
      );
    });
  }

  private renderRobotPreview(x: number, y: number, stats: RobotStats): void {
    if (!this.previewContainer) {
      return;
    }

    this.previewContainer.removeAll(true);
    this.previewContainer.add(
      this.add
        .text(x, 118, 'Robot preview', {
          color: '#d8e4ed',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    this.previewContainer.add(
      this.add.circle(x, y + 54, 96, 0x102235, 0.9).setStrokeStyle(3, 0x2f6fff),
    );
    this.previewContainer.add(
      this.add
        .rectangle(x, y, 92, 100, stats.color)
        .setStrokeStyle(4, 0xbcefff),
    );
    this.previewContainer.add(
      this.add
        .rectangle(x, y - 66, 70, 34, 0xc8d3df)
        .setStrokeStyle(3, 0x111820),
    );
    this.previewContainer.add(
      this.add
        .rectangle(x - 82, y - 8, 44, 82, stats.color)
        .setStrokeStyle(3, 0x111820),
    );
    this.previewContainer.add(
      this.add
        .rectangle(x + 82, y - 8, 44, 82, stats.color)
        .setStrokeStyle(3, 0x111820),
    );
    this.previewContainer.add(
      this.add
        .rectangle(x - 34, y + 78, 34, 56, 0xc8d3df)
        .setStrokeStyle(3, 0x111820),
    );
    this.previewContainer.add(
      this.add
        .rectangle(x + 34, y + 78, 34, 56, 0xc8d3df)
        .setStrokeStyle(3, 0x111820),
    );
    this.previewContainer.add(this.add.circle(x, y - 10, 18, 0x57d4ff, 0.9));
  }

  private selectPart(slot: PartSlot, partId: string): void {
    if (!this.workingBuild) {
      return;
    }

    this.workingBuild = {
      ...this.workingBuild,
      [`${slot}Id`]: partId,
    };
    this.setStatus('Unsaved build changes.');
    this.renderGarage();
  }

  private saveBuild(): void {
    if (!this.playerSave || !this.workingBuild) {
      return;
    }

    this.playerSave = {
      ...this.playerSave,
      currentBuild: this.cloneBuild(this.workingBuild),
    };
    playerService.savePlayer(this.playerSave);
    this.setStatus('Build saved.');
  }

  private getSelectedPartId(slot: PartSlot): string | null {
    if (!this.workingBuild) {
      return null;
    }

    switch (slot) {
      case 'body':
        return this.workingBuild.bodyId;
      case 'head':
        return this.workingBuild.headId;
      case 'legs':
        return this.workingBuild.legsId;
      case 'armor':
        return this.workingBuild.armorId;
      case 'color':
        return this.workingBuild.colorId;
    }
  }

  private formatPartOption(part: Part): string {
    const modifiers = [
      this.formatModifier('HP', part.maxHpBonus),
      this.formatModifier('ARM', part.armorBonus),
      this.formatModifier('SPD', part.speedBonus),
      this.formatModifier('DMG', part.damageMultiplierBonus),
    ].filter((modifier) => modifier.length > 0);

    return modifiers.length > 0
      ? `${part.name}  ${modifiers.join(' ')}`
      : part.name;
  }

  private formatModifier(label: string, value: number | undefined): string {
    if (value === undefined || value === 0) {
      return '';
    }

    const prefix = value > 0 ? '+' : '';
    const formattedValue =
      label === 'DMG' ? value.toFixed(2).replace(/^0/, '') : value.toString();

    return `${label}${prefix}${formattedValue}`;
  }

  private getPartName(partId: string): string {
    return StatsSystem.getPartById(partId)?.name ?? partId;
  }

  private cloneBuild(build: RobotBuild): RobotBuild {
    return {
      ...build,
      weaponIds: [...build.weaponIds],
    };
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

  private setStatus(message: string): void {
    this.statusText?.setText(message);
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
