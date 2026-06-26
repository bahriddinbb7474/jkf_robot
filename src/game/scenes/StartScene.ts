import Phaser from 'phaser';
import { playerService } from '../services/PlayerService';
import type { PlayerProfile } from '../types/PlayerSave';

export class StartScene extends Phaser.Scene {
  private selectedPlayerId: string | null = null;
  private nameBuffer = '';
  private nameInputText?: Phaser.GameObjects.Text;
  private playerListContainer?: Phaser.GameObjects.Container;
  private startButton?: Phaser.GameObjects.Text;
  private garageButton?: Phaser.GameObjects.Text;
  private shopButton?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private readonly keyDownHandler = (event: KeyboardEvent): void => {
    this.handleNameInput(event);
  };

  constructor() {
    super('StartScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;

    this.add
      .text(centerX, 54, 'JKF_robot', {
        color: '#57d4ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 100, 'Stage 4 - Players and Save', {
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.createPlayerPanel();
    this.refreshPlayers();

    this.input.keyboard?.on('keydown', this.keyDownHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.keyDownHandler);
    });
  }

  private createPlayerPanel(): void {
    this.add.text(90, 144, 'Create player', {
      color: '#d8e4ed',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    this.nameInputText = this.add.text(90, 184, '', {
      backgroundColor: '#101820',
      color: '#f4f7fb',
      fixedWidth: 360,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      padding: { x: 14, y: 10 },
    });

    const createButton = this.add
      .text(470, 184, 'Create', {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        padding: { x: 18, y: 10 },
      })
      .setInteractive({ useHandCursor: true });

    createButton.on('pointerover', () =>
      createButton.setBackgroundColor('#1d547d'),
    );
    createButton.on('pointerout', () =>
      createButton.setBackgroundColor('#143652'),
    );
    createButton.on('pointerup', () => this.createPlayer());

    this.add.text(90, 258, 'Players', {
      color: '#d8e4ed',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    this.playerListContainer = this.add.container(90, 300);

    this.shopButton = this.add
      .text(620, 470, 'Shop', {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.shopButton.on('pointerover', () =>
      this.shopButton?.setBackgroundColor(
        this.selectedPlayerId ? '#1d547d' : '#2a3440',
      ),
    );
    this.shopButton.on('pointerout', () => this.updateActionButtonState());
    this.shopButton.on('pointerup', () => this.openShop());

    this.garageButton = this.add
      .text(740, 470, 'Garage', {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.garageButton.on('pointerover', () =>
      this.garageButton?.setBackgroundColor(
        this.selectedPlayerId ? '#1d547d' : '#2a3440',
      ),
    );
    this.garageButton.on('pointerout', () => this.updateActionButtonState());
    this.garageButton.on('pointerup', () => this.openGarage());

    this.startButton = this.add
      .text(860, 470, 'Start Battle', {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () =>
      this.startButton?.setBackgroundColor(
        this.selectedPlayerId ? '#1d547d' : '#2a3440',
      ),
    );
    this.startButton.on('pointerout', () => this.updateActionButtonState());
    this.startButton.on('pointerup', () => this.startBattle());

    this.statusText = this.add
      .text(90, 462, '', {
        color: '#91a4bd',
        fixedWidth: 560,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0, 0.5);

    this.updateNameInputText();
    this.updateActionButtonState();
  }

  private refreshPlayers(): void {
    const players = playerService.listPlayers();
    const currentPlayerId = playerService.getCurrentPlayerId();

    this.selectedPlayerId =
      currentPlayerId !== null &&
      players.some((player) => player.id === currentPlayerId)
        ? currentPlayerId
        : (players[0]?.id ?? null);

    if (
      this.selectedPlayerId !== null &&
      this.selectedPlayerId !== currentPlayerId
    ) {
      playerService.setCurrentPlayer(this.selectedPlayerId);
    }

    this.renderPlayerList(players);
    this.updateActionButtonState();
  }

  private renderPlayerList(players: PlayerProfile[]): void {
    this.playerListContainer?.removeAll(true);

    if (!this.playerListContainer) {
      return;
    }

    if (players.length === 0) {
      this.playerListContainer.add(
        this.add.text(0, 0, 'No players yet. Type a name and create one.', {
          color: '#91a4bd',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
        }),
      );
      return;
    }

    players.forEach((player, index) => {
      const selected = player.id === this.selectedPlayerId;
      const row = this.add
        .text(
          0,
          index * 42,
          `${selected ? '> ' : '  '}${player.name}  W:${player.wins} L:${player.losses}`,
          {
            backgroundColor: selected ? '#1d547d' : '#101820',
            color: selected ? '#ffffff' : '#c8d3df',
            fixedWidth: 520,
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
            padding: { x: 12, y: 8 },
          },
        )
        .setInteractive({ useHandCursor: true });

      row.on('pointerup', () => {
        playerService.setCurrentPlayer(player.id);
        this.selectedPlayerId = player.id;
        this.setStatus(`Selected ${player.name}.`);
        this.refreshPlayers();
      });

      this.playerListContainer?.add(row);
    });
  }

  private handleNameInput(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (this.nameBuffer.length > 0) {
        this.createPlayer();
      } else {
        this.startBattle();
      }
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.nameBuffer = this.nameBuffer.slice(0, -1);
      this.updateNameInputText();
      return;
    }

    if (event.key.length !== 1 || this.nameBuffer.length >= 18) {
      return;
    }

    if (!/^[a-zA-Z0-9 _-]$/.test(event.key)) {
      return;
    }

    this.nameBuffer += event.key;
    this.updateNameInputText();
  }

  private createPlayer(): void {
    try {
      const player = playerService.createPlayer(this.nameBuffer);
      this.selectedPlayerId = player.id;
      this.nameBuffer = '';
      this.updateNameInputText();
      this.setStatus(`Created ${player.name}.`);
      this.refreshPlayers();
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : 'Create failed.');
    }
  }

  private startBattle(): void {
    if (this.selectedPlayerId === null) {
      this.setStatus('Create or select a player first.');
      return;
    }

    this.scene.start('BattleScene', { playerId: this.selectedPlayerId });
  }

  private openGarage(): void {
    if (this.selectedPlayerId === null) {
      this.setStatus('Create or select a player first.');
      return;
    }

    this.scene.start('GarageScene', { playerId: this.selectedPlayerId });
  }

  private openShop(): void {
    if (this.selectedPlayerId === null) {
      this.setStatus('Create or select a player first.');
      return;
    }

    this.scene.start('ShopScene', { playerId: this.selectedPlayerId });
  }

  private updateNameInputText(): void {
    const label =
      this.nameBuffer.length > 0 ? this.nameBuffer : 'Type player name...';
    this.nameInputText?.setText(label);
    this.nameInputText?.setColor(
      this.nameBuffer.length > 0 ? '#f4f7fb' : '#6f8498',
    );
  }

  private updateActionButtonState(): void {
    this.startButton?.setBackgroundColor(
      this.selectedPlayerId ? '#143652' : '#2a3440',
    );
    this.startButton?.setColor(this.selectedPlayerId ? '#f4f7fb' : '#91a4bd');
    this.garageButton?.setBackgroundColor(
      this.selectedPlayerId ? '#143652' : '#2a3440',
    );
    this.garageButton?.setColor(this.selectedPlayerId ? '#f4f7fb' : '#91a4bd');
    this.shopButton?.setBackgroundColor(
      this.selectedPlayerId ? '#143652' : '#2a3440',
    );
    this.shopButton?.setColor(this.selectedPlayerId ? '#f4f7fb' : '#91a4bd');
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message);
  }
}
