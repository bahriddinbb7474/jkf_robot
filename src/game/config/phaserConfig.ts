import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { BattleScene } from '../scenes/BattleScene';
import { GarageScene } from '../scenes/GarageScene';
import { MissionSelectScene } from '../scenes/MissionSelectScene';
import { ShopScene } from '../scenes/ShopScene';
import { StartScene } from '../scenes/StartScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#08111f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  scene: [
    BootScene,
    StartScene,
    GarageScene,
    ShopScene,
    MissionSelectScene,
    BattleScene,
  ],
};
