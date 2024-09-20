import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    console.log(this.registry.get('points'));
    this.add.text(sizes.width / 2, 30, 'Game Over').setOrigin(0.5, 0.5);
    this.add.text(sizes.width / 2, 50, `Du hast ${this.registry.get('points')} ${this.registry.get('points') === 1 ? 'Punkt' : 'Punkte'} gesammelt `).setOrigin(0.5, 0.5);

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