import Phaser from 'phaser';
import partsData from '../../../data/static/parts.json';
import { playerService } from '../services/PlayerService';
import type { Part } from '../types/Part';
import type { PlayerSave } from '../types/PlayerSave';

type ShopSceneData = {
  playerId?: string;
};

const parts = partsData as Part[];
const PARTS_PER_COLUMN = 6;
const PART_ROW_HEIGHT = 42;
const PART_COLUMN_WIDTH = 410;

const STATUS_LABELS = {
  owned: 'OWNED',
  available: 'AVAILABLE',
  locked: 'LOCKED',
  'not-enough-money': 'NO MONEY',
  'missing-player': 'NO PLAYER',
  'missing-part': 'MISSING',
} as const;

export class ShopScene extends Phaser.Scene {
  private playerId: string | null = null;
  private playerSave: PlayerSave | null = null;
  private partsContainer?: Phaser.GameObjects.Container;
  private moneyText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  init(data: ShopSceneData): void {
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
    this.drawShopBackdrop();

    this.add
      .text(this.scale.width / 2, 34, 'Shop', {
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

    this.moneyText = this.add.text(56, 106, `Money: ${this.playerSave.money}`, {
      color: '#f4d35e',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
    });

    this.partsContainer = this.add.container(56, 142);
    this.statusText = this.add
      .text(270, 486, 'Click an available part to buy it.', {
        color: '#91a4bd',
        fixedWidth: 420,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0, 0.5);

    this.createButton(82, 496, 'Back', () => this.scene.start('StartScene'));
    this.createButton(690, 496, 'Garage', () =>
      this.scene.start('GarageScene', { playerId: this.playerId }),
    );
    this.createButton(830, 496, 'Missions', () =>
      this.scene.start('MissionSelectScene', {
        playerId: this.playerId,
        fromScene: 'ShopScene',
      }),
    );

    this.renderParts();
  }

  private renderParts(): void {
    if (!this.partsContainer || !this.playerSave || !this.playerId) {
      return;
    }

    this.partsContainer.removeAll(true);
    this.partsContainer.add(
      this.add.text(0, 0, 'Parts catalog', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      }),
    );

    parts.forEach((part, index) => {
      const columnIndex = Math.floor(index / PARTS_PER_COLUMN);
      const rowIndex = index % PARTS_PER_COLUMN;
      const rowX = columnIndex * PART_COLUMN_WIDTH;
      const rowY = 38 + rowIndex * PART_ROW_HEIGHT;
      const status = playerService.getPartPurchaseStatus(
        this.playerId ?? '',
        part.id,
      );
      const row = this.add.text(rowX, rowY, this.formatPartRow(part, status), {
        backgroundColor: status === 'available' ? '#143652' : '#101820',
        color: this.getStatusColor(status),
        fixedWidth: 390,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        padding: { x: 10, y: 6 },
      });

      row.setInteractive({ useHandCursor: status === 'available' });
      row.on('pointerover', () => {
        if (status === 'available') {
          row.setBackgroundColor('#1d547d');
        }
      });
      row.on('pointerout', () => {
        row.setBackgroundColor(status === 'available' ? '#143652' : '#101820');
      });
      row.on('pointerup', () => this.purchasePart(part.id));

      this.partsContainer?.add(row);
    });
  }

  private purchasePart(partId: string): void {
    if (!this.playerId) {
      this.setStatus('Select a player before shopping.');
      return;
    }

    const result = playerService.purchasePart(this.playerId, partId);

    if (result.player) {
      this.playerSave = result.player;
      this.moneyText?.setText(`Money: ${this.playerSave.money}`);
    }

    switch (result.status) {
      case 'purchased':
        this.setStatus('Part purchased. It is now available in Garage.');
        break;
      case 'owned':
        this.setStatus('That part is already owned.');
        break;
      case 'locked':
        this.setStatus('That part is locked.');
        break;
      case 'not-enough-money':
        this.setStatus('Not enough money.');
        break;
      case 'missing-part':
        this.setStatus('Part config is missing.');
        break;
      case 'missing-player':
        this.setStatus('Player save is missing.');
        break;
    }

    this.renderParts();
  }

  private formatPartRow(
    part: Part,
    status: ReturnType<typeof playerService.getPartPurchaseStatus>,
  ): string {
    const priceLabel = part.price === 0 ? 'free' : `${part.price} cr`;
    return `${part.name} | ${priceLabel} | ${STATUS_LABELS[status]}`;
  }

  private getStatusColor(
    status: ReturnType<typeof playerService.getPartPurchaseStatus>,
  ): string {
    switch (status) {
      case 'owned':
        return '#8effb6';
      case 'available':
        return '#f4f7fb';
      case 'locked':
        return '#f08a8a';
      case 'not-enough-money':
        return '#f4d35e';
      default:
        return '#91a4bd';
    }
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message);
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

  private drawShopBackdrop(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0b1524, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0x102235, 1);
    graphics.fillRect(30, 70, 900, 420);
    graphics.lineStyle(2, 0x2a4b68, 0.9);
    graphics.strokeRect(30, 70, 900, 420);
    graphics.lineStyle(1, 0x1d547d, 0.55);

    for (let y = 118; y < 458; y += PART_ROW_HEIGHT) {
      graphics.lineBetween(30, y, 930, y);
    }

    graphics.fillStyle(0x08111f, 0.9);
    graphics.fillRect(30, 458, 900, 32);
  }
}
