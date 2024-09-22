import Phaser from 'phaser';
import GameOver from './scenes/gameover';
import GameStart from './scenes/gamestart';
import MainGame from './scenes/game';
import { sizes } from './gameConfig';
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
        y: 300
      },
      debug: false
    }
  },
  scene: [GameStart, MainGame, GameOver]
}

const game = new Phaser.Game(config);