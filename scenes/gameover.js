import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    this.add.text(sizes.width / 2, 10, 'Game Over').setOrigin(0.5, 0.5);

    const textBtn = this.add.text(sizes.width / 2, sizes.height / 2, "Play again", {
      fontSize: "25px Arial",
      color: "#fff",
      backgroundColor: '#007bff',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
    .setOrigin(0.5, 0.5)
    .setInteractive()

    textBtn.on('pointerdown', () => {
      this.scene.start("MainGame")
    })

  }
}