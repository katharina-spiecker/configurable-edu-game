import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class GameStart extends Phaser.Scene {
  constructor() {
    super("GameStart");
  }

  create() {
    const textBtn = this.add.text(sizes.width / 2, sizes.height / 2, "Game start", {
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

  

/* <h1>Apple Catcher</h1>
            <p>You have 30 seconds to catch apples!</p>
            <p>If you catch more than 10 apples you win.</p>
            <p>Click the start button to begin</p>
            <button id="game-start-btn">Start</button> */
}