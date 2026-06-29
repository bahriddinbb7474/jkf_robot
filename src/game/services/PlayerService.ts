import balanceData from '../../../data/static/balance.json';
import partsData from '../../../data/static/parts.json';
import type { MissionStatus } from '../types/Mission';
import type { QuestionSubject } from '../types/Question';
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
  locked?: boolean;
  price: number;
  slot: string;
};

type BalanceConfig = {
  startingMoney: number;
  rewards: {
    bonusQuestion: number;
  };
};

type PlayerSaveCandidate = Omit<PlayerSave, 'questionStats'> & {
  questionStats?: unknown;
};

const balance = balanceData as BalanceConfig;
const parts = partsData as StaticPart[];

export type PartPurchaseStatus =
  | 'owned'
  | 'available'
  | 'locked'
  | 'not-enough-money'
  | 'missing-player'
  | 'missing-part';

export type PurchasePartResult =
  | {
      status: 'purchased';
      player: PlayerSave;
    }
  | {
      status: Exclude<PartPurchaseStatus, 'available'>;
      player: PlayerSave | null;
    };

export type MissionCompletion = {
  id: string;
  rewardMoney: number;
  unlockPartIds: string[];
};

export type CompleteMissionResult =
  | {
      status: 'completed';
      player: PlayerSave;
      rewardMoney: number;
      unlockedPartIds: string[];
    }
  | {
      status: 'already-completed';
      player: PlayerSave;
      rewardMoney: 0;
      unlockedPartIds: [];
    }
  | {
      status: 'missing-player';
      player: null;
      rewardMoney: 0;
      unlockedPartIds: [];
    };

export type RecordQuestionAnswerResult =
  | {
      status: 'recorded';
      player: PlayerSave;
      rewardMoney: number;
    }
  | {
      status: 'missing-player';
      player: null;
      rewardMoney: 0;
    };

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

  recordQuestionAnswer(
    playerId: string,
    subject: QuestionSubject,
    correct: boolean,
  ): RecordQuestionAnswerResult {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return {
        status: 'missing-player',
        player: null,
        rewardMoney: 0,
      };
    }

    const rewardMoney = correct ? balance.rewards.bonusQuestion : 0;
    const questionStats: QuestionStats = {
      answered: player.questionStats.answered + 1,
      correct: player.questionStats.correct + (correct ? 1 : 0),
      mathAnswered:
        player.questionStats.mathAnswered + (subject === 'math' ? 1 : 0),
      mathCorrect:
        player.questionStats.mathCorrect +
        (subject === 'math' && correct ? 1 : 0),
      englishAnswered:
        player.questionStats.englishAnswered + (subject === 'english' ? 1 : 0),
      englishCorrect:
        player.questionStats.englishCorrect +
        (subject === 'english' && correct ? 1 : 0),
    };
    const updatedPlayer = {
      ...player,
      money: player.money + rewardMoney,
      questionStats,
    };

    this.savePlayer(updatedPlayer);

    return {
      status: 'recorded',
      player: this.loadPlayer(playerId) ?? updatedPlayer,
      rewardMoney,
    };
  }

  getMissionStatus(
    playerId: string,
    missionId: string,
    requiredCompletedMissionId: string | null,
  ): MissionStatus | 'missing-player' {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return 'missing-player';
    }

    if (player.completedMissionIds.includes(missionId)) {
      return 'completed';
    }

    if (
      requiredCompletedMissionId !== null &&
      !player.completedMissionIds.includes(requiredCompletedMissionId)
    ) {
      return 'locked';
    }

    return 'unlocked';
  }

  completeMission(
    playerId: string,
    mission: MissionCompletion,
  ): CompleteMissionResult {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return {
        status: 'missing-player',
        player: null,
        rewardMoney: 0,
        unlockedPartIds: [],
      };
    }

    if (player.completedMissionIds.includes(mission.id)) {
      return {
        status: 'already-completed',
        player,
        rewardMoney: 0,
        unlockedPartIds: [],
      };
    }

    const updatedPlayer = {
      ...player,
      money: player.money + mission.rewardMoney,
      completedMissionIds: this.mergeUniqueIds(player.completedMissionIds, [
        mission.id,
      ]),
      unlockedPartIds: this.mergeUniqueIds(
        player.unlockedPartIds,
        mission.unlockPartIds,
      ),
    };

    this.savePlayer(updatedPlayer);

    return {
      status: 'completed',
      player: this.loadPlayer(playerId) ?? updatedPlayer,
      rewardMoney: mission.rewardMoney,
      unlockedPartIds: mission.unlockPartIds,
    };
  }

  getPartPurchaseStatus(playerId: string, partId: string): PartPurchaseStatus {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return 'missing-player';
    }

    const part = this.getPartById(partId);

    if (part === null) {
      return 'missing-part';
    }

    return this.getPartPurchaseStatusForPlayer(player, part);
  }

  purchasePart(playerId: string, partId: string): PurchasePartResult {
    const player = this.loadPlayer(playerId);

    if (player === null) {
      return {
        status: 'missing-player',
        player: null,
      };
    }

    const part = this.getPartById(partId);

    if (part === null) {
      return {
        status: 'missing-part',
        player,
      };
    }

    const status = this.getPartPurchaseStatusForPlayer(player, part);

    if (status !== 'available') {
      return {
        status,
        player,
      };
    }

    const updatedPlayer = {
      ...player,
      money: player.money - part.price,
      ownedPartIds: this.mergeUniqueIds(player.ownedPartIds, [part.id]),
      unlockedPartIds: this.mergeUniqueIds(player.unlockedPartIds, [part.id]),
    };

    this.savePlayer(updatedPlayer);

    return {
      status: 'purchased',
      player: this.loadPlayer(playerId) ?? updatedPlayer,
    };
  }

  private loadState(): PlayerStorageState {
    const loadedState = this.storage.load<PlayerStorageState>(
      PLAYER_STORAGE_KEY,
      this.createEmptyState(),
    );
    const normalizedState = this.normalizeState(loadedState);

    if (!this.areStatesEqual(loadedState, normalizedState)) {
      this.storage.save(PLAYER_STORAGE_KEY, normalizedState);
    }

    return normalizedState;
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

    const players = state.players
      .filter((player) => this.isValidPlayerSave(player))
      .map((player) => this.normalizePlayerSave(player));
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

  private normalizePlayerSave(player: PlayerSaveCandidate): PlayerSave {
    const defaultOwnedPartIds = this.getDefaultPartIds();

    return {
      ...player,
      unlockedPartIds: this.mergeUniqueIds(
        player.unlockedPartIds,
        defaultOwnedPartIds,
      ),
      ownedPartIds: this.mergeUniqueIds(
        player.ownedPartIds,
        defaultOwnedPartIds,
      ),
      questionStats: this.normalizeQuestionStats(player.questionStats),
    };
  }

  private isValidPlayerSave(player: unknown): player is PlayerSaveCandidate {
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

    const {
      answered,
      correct,
      mathAnswered,
      mathCorrect,
      englishAnswered,
      englishCorrect,
    } = stats;

    return (
      this.isNonNegativeInteger(answered) &&
      this.isNonNegativeInteger(correct) &&
      this.isNonNegativeInteger(mathAnswered) &&
      this.isNonNegativeInteger(mathCorrect) &&
      this.isNonNegativeInteger(englishAnswered) &&
      this.isNonNegativeInteger(englishCorrect) &&
      correct <= answered &&
      mathCorrect <= mathAnswered &&
      englishCorrect <= englishAnswered &&
      answered === mathAnswered + englishAnswered &&
      correct === mathCorrect + englishCorrect
    );
  }

  private normalizeQuestionStats(stats: unknown): QuestionStats {
    return this.isValidQuestionStats(stats)
      ? stats
      : this.createDefaultQuestionStats();
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
    return parts.filter((part) => part.price === 0).map((part) => part.id);
  }

  private getPartIdBySlot(slot: string): string {
    const part = parts.find((candidate) => candidate.slot === slot);

    if (part === undefined) {
      throw new Error(`Missing default ${slot} part.`);
    }

    return part.id;
  }

  private getPartById(partId: string): StaticPart | null {
    return parts.find((part) => part.id === partId) ?? null;
  }

  private getPartPurchaseStatusForPlayer(
    player: PlayerSave,
    part: StaticPart,
  ): PartPurchaseStatus {
    if (player.ownedPartIds.includes(part.id)) {
      return 'owned';
    }

    if (!this.isPartUnlocked(player, part)) {
      return 'locked';
    }

    if (player.money < part.price) {
      return 'not-enough-money';
    }

    return 'available';
  }

  private isPartUnlocked(player: PlayerSave, part: StaticPart): boolean {
    return !part.locked || player.unlockedPartIds.includes(part.id);
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

  private isNonNegativeInteger(value: unknown): value is number {
    return Number.isInteger(value) && Number(value) >= 0;
  }

  private mergeUniqueIds(existingIds: string[], addedIds: string[]): string[] {
    return [...new Set([...existingIds, ...addedIds])];
  }

  private areStatesEqual(a: unknown, b: PlayerStorageState): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

export const playerService = new PlayerService(new LocalStorageService());
