import Phaser from 'phaser';
import GameOver from './scenes/gameover';
import GameStart from './scenes/gamestart';
import MainGame from './scenes/game';
import { sizes, speedDown } from './gameConfig';
// followed this tutorial https://www.youtube.com/watch?v=0qtg-9M3peI

const config = {
  type: Phaser.WEBGL, // we could also choose Phaser.AUTO
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: speedDown
      },
      debug: false
    }
  },
  scene: [MainGame, GameOver]
  // scene: [GameStart, MainGame, GameOver]
}

const game = new Phaser.Game(config);