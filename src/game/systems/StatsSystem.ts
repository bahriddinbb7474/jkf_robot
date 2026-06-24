import balanceData from '../../../data/static/balance.json';
import partsData from '../../../data/static/parts.json';
import weaponsData from '../../../data/static/weapons.json';
import type { Part, PartSlot } from '../types/Part';
import type { RobotBuild } from '../types/RobotBuild';
import type { RobotStats } from '../types/RobotStats';
import type { Weapon } from '../types/Weapon';

type BalanceConfig = {
  basePlayerStats: {
    health: number;
    speed: number;
  };
};

const DEFAULT_COLOR_HEX = '#32b8d9';
const DEFAULT_DAMAGE_MULTIPLIER = 1;
const MIN_PLAYER_HP = 1;
const MIN_PLAYER_SPEED = 80;

const balance = balanceData as BalanceConfig;
const parts = partsData as Part[];
const weapons = weaponsData as Weapon[];

const partsById = new Map(parts.map((part) => [part.id, part]));
const weaponsById = new Map(weapons.map((weapon) => [weapon.id, weapon]));

export class StatsSystem {
  static calculate(build: RobotBuild): RobotStats {
    const selectedParts = this.getSelectedParts(build);
    const maxHp = Math.max(
      MIN_PLAYER_HP,
      balance.basePlayerStats.health +
        selectedParts.reduce((sum, part) => sum + (part.maxHpBonus ?? 0), 0),
    );
    const armor = Math.max(
      0,
      selectedParts.reduce((sum, part) => sum + (part.armorBonus ?? 0), 0),
    );
    const speed = Math.max(
      MIN_PLAYER_SPEED,
      balance.basePlayerStats.speed +
        selectedParts.reduce((sum, part) => sum + (part.speedBonus ?? 0), 0),
    );
    const damageMultiplier = Math.max(
      0.1,
      DEFAULT_DAMAGE_MULTIPLIER +
        selectedParts.reduce(
          (sum, part) => sum + (part.damageMultiplierBonus ?? 0),
          0,
        ),
    );
    const colorHex =
      selectedParts.find((part) => part.slot === 'color')?.colorHex ??
      DEFAULT_COLOR_HEX;
    const weaponIds = build.weaponIds.filter((weaponId) =>
      weaponsById.has(weaponId),
    );

    return {
      maxHp,
      armor,
      speed,
      damageMultiplier,
      weaponIds: weaponIds.length > 0 ? weaponIds : [weapons[0].id],
      color: this.parseHexColor(colorHex),
      colorHex,
    };
  }

  static getPartById(partId: string): Part | null {
    return partsById.get(partId) ?? null;
  }

  static getPartsBySlot(slot: PartSlot): Part[] {
    return parts.filter((part) => part.slot === slot);
  }

  private static getSelectedParts(build: RobotBuild): Part[] {
    return [
      this.getPartForSlot('body', build.bodyId),
      this.getPartForSlot('head', build.headId),
      this.getPartForSlot('legs', build.legsId),
      this.getPartForSlot('armor', build.armorId),
      this.getPartForSlot('color', build.colorId),
    ];
  }

  private static getPartForSlot(slot: PartSlot, partId: string): Part {
    const part = partsById.get(partId);

    if (part?.slot === slot) {
      return part;
    }

    const fallbackPart = parts.find((candidate) => candidate.slot === slot);

    if (!fallbackPart) {
      throw new Error(`Missing default part for slot: ${slot}`);
    }

    return fallbackPart;
  }

  private static parseHexColor(colorHex: string): number {
    const normalizedHex = colorHex.replace('#', '');
    const parsedColor = Number.parseInt(normalizedHex, 16);

    if (Number.isNaN(parsedColor)) {
      return Number.parseInt(DEFAULT_COLOR_HEX.replace('#', ''), 16);
    }

    return parsedColor;
  }
}
