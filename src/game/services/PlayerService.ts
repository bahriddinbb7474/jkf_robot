import balanceData from '../../../data/static/balance.json';
import partsData from '../../../data/static/parts.json';
import type { RobotBuild } from '../types/RobotBuild';
import type {
  BattleResult,
  PlayerProfile,
  PlayerSave,
  PlayerStorageState,
  QuestionStats,
} from '../types/PlayerSave';
import { LocalStorageService } from './LocalStorageService';
import type { StorageService } from './StorageService';

const PLAYER_STORAGE_KEY = 'jkf_robot.players.v1';
const PLAYER_STORAGE_VERSION = 1;
const STARTING_WEAPON_IDS = ['laser_basic', 'rocket_basic', 'sword_basic'];

type StaticPart = {
  id: string;
  slot: string;
};

type BalanceConfig = {
  startingMoney: number;
};

const balance = balanceData as BalanceConfig;
const parts = partsData as StaticPart[];

export class PlayerService {
  constructor(private readonly storage: StorageService) {}

  listPlayers(): PlayerProfile[] {
    return this.loadState().players.map((player) => ({
      id: player.id,
      name: player.name,
      wins: player.wins,
      losses: player.losses,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    }));
  }

  createPlayer(name: string): PlayerSave {
    const trimmedName = this.normalizeName(name);
    const state = this.loadState();

    if (trimmedName.length === 0) {
      throw new Error('Player name is required.');
    }

    if (
      state.players.some(
        (player) => player.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      throw new Error('Player name already exists.');
    }

    const now = new Date().toISOString();
    const player: PlayerSave = {
      id: this.createPlayerId(),
      name: trimmedName,
      money: balance.startingMoney,
      wins: 0,
      losses: 0,
      completedMissionIds: [],
      unlockedPartIds: this.getDefaultPartIds(),
      ownedPartIds: this.getDefaultPartIds(),
      currentBuild: this.createDefaultBuild(),
      questionStats: this.createDefaultQuestionStats(),
      createdAt: now,
      updatedAt: now,
    };

    this.saveState({
      ...state,
      currentPlayerId: player.id,
      players: [...state.players, player],
    });

    return player;
  }

  getCurrentPlayerId(): string | null {
    return this.loadState().currentPlayerId;
  }

  getCurrentPlayer(): PlayerSave | null {
    const currentPlayerId = this.getCurrentPlayerId();

    if (currentPlayerId === null) {
      return null;
    }

    return this.loadPlayer(currentPlayerId);
  }

  setCurrentPlayer(playerId: string): void {
    const state = this.loadState();

    if (!state.players.some((player) => player.id === playerId)) {
      throw new Error('Player does not exist.');
    }

    this.saveState({
      ...state,
      currentPlayerId: playerId,
    });
  }

  loadPlayer(playerId: string): PlayerSave | null {
    return (
      this.loadState().players.find((player) => player.id === playerId) ?? null
    );
  }

  savePlayer(player: PlayerSave): void {
    const now = new Date().toISOString();
    const state = this.loadState();
    const existingPlayerIndex = state.players.findIndex(
      (savedPlayer) => savedPlayer.id === player.id,
    );
    const savedPlayer = {
      ...player,
      name: this.normalizeName(player.name),
      updatedAt: now,
    };

    if (savedPlayer.name.length === 0) {
      throw new Error('Player name is required.');
    }

    if (existingPlayerIndex === -1) {
      this.saveState({
        ...state,
        players: [...state.players, savedPlayer],
      });
      return;
    }

    const players = [...state.players];
    players[existingPlayerIndex] = savedPlayer;
    this.saveState({
      ...state,
      players,
    });
  }

  updatePlayerProgress(
    playerId: string,
    patch: Partial<PlayerSave>,
  ): PlayerSave | null {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return null;
    }

    const updatedPlayer = {
      ...player,
      ...patch,
      id: player.id,
      createdAt: player.createdAt,
    };
    this.savePlayer(updatedPlayer);

    return this.loadPlayer(playerId);
  }

  recordBattleResult(
    playerId: string,
    result: BattleResult,
  ): PlayerSave | null {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return null;
    }

    return this.updatePlayerProgress(playerId, {
      wins: result === 'victory' ? player.wins + 1 : player.wins,
      losses: result === 'defeat' ? player.losses + 1 : player.losses,
    });
  }

  private loadState(): PlayerStorageState {
    return this.normalizeState(
      this.storage.load<PlayerStorageState>(
        PLAYER_STORAGE_KEY,
        this.createEmptyState(),
      ),
    );
  }

  private saveState(state: PlayerStorageState): void {
    this.storage.save(PLAYER_STORAGE_KEY, this.normalizeState(state));
  }

  private normalizeState(state: unknown): PlayerStorageState {
    if (
      !this.isRecord(state) ||
      state.version !== PLAYER_STORAGE_VERSION ||
      !Array.isArray(state.players)
    ) {
      return this.createEmptyState();
    }

    const players = state.players.filter((player) =>
      this.isValidPlayerSave(player),
    );
    const currentPlayerId =
      typeof state.currentPlayerId === 'string' &&
      players.some((player) => player.id === state.currentPlayerId)
        ? state.currentPlayerId
        : null;

    return {
      version: PLAYER_STORAGE_VERSION,
      currentPlayerId,
      players,
    };
  }

  private createEmptyState(): PlayerStorageState {
    return {
      version: PLAYER_STORAGE_VERSION,
      currentPlayerId: null,
      players: [],
    };
  }

  private isValidPlayerSave(player: unknown): player is PlayerSave {
    if (!this.isRecord(player)) {
      return false;
    }

    return (
      typeof player.id === 'string' &&
      player.id.length > 0 &&
      typeof player.name === 'string' &&
      player.name.length > 0 &&
      typeof player.money === 'number' &&
      typeof player.wins === 'number' &&
      typeof player.losses === 'number' &&
      Array.isArray(player.completedMissionIds) &&
      Array.isArray(player.unlockedPartIds) &&
      Array.isArray(player.ownedPartIds) &&
      this.isValidRobotBuild(player.currentBuild) &&
      this.isValidQuestionStats(player.questionStats) &&
      typeof player.createdAt === 'string' &&
      typeof player.updatedAt === 'string'
    );
  }

  private isValidRobotBuild(build: unknown): build is RobotBuild {
    if (!this.isRecord(build)) {
      return false;
    }

    return (
      typeof build.bodyId === 'string' &&
      typeof build.headId === 'string' &&
      typeof build.legsId === 'string' &&
      typeof build.armorId === 'string' &&
      typeof build.colorId === 'string' &&
      Array.isArray(build.weaponIds)
    );
  }

  private isValidQuestionStats(stats: unknown): stats is QuestionStats {
    if (!this.isRecord(stats)) {
      return false;
    }

    return (
      typeof stats.answered === 'number' &&
      typeof stats.correct === 'number' &&
      typeof stats.mathAnswered === 'number' &&
      typeof stats.mathCorrect === 'number' &&
      typeof stats.englishAnswered === 'number' &&
      typeof stats.englishCorrect === 'number'
    );
  }

  private createDefaultBuild(): RobotBuild {
    return {
      bodyId: this.getPartIdBySlot('body'),
      headId: this.getPartIdBySlot('head'),
      legsId: this.getPartIdBySlot('legs'),
      armorId: this.getPartIdBySlot('armor'),
      colorId: this.getPartIdBySlot('color'),
      weaponIds: STARTING_WEAPON_IDS,
    };
  }

  private getDefaultPartIds(): string[] {
    return parts.map((part) => part.id);
  }

  private getPartIdBySlot(slot: string): string {
    const part = parts.find((candidate) => candidate.slot === slot);

    if (part === undefined) {
      throw new Error(`Missing default ${slot} part.`);
    }

    return part.id;
  }

  private createDefaultQuestionStats(): QuestionStats {
    return {
      answered: 0,
      correct: 0,
      mathAnswered: 0,
      mathCorrect: 0,
      englishAnswered: 0,
      englishCorrect: 0,
    };
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private createPlayerId(): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return globalThis.crypto.randomUUID();
    }

    return `player_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

export const playerService = new PlayerService(new LocalStorageService());
