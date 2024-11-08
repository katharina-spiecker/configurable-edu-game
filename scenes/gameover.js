import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  preload() {
    this.load.spritesheet('itemsSpriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap_packed.png', {
      frameWidth: 18,
      frameHeight: 18
    });
  }

  create() {
    this.add.text(sizes.width / 2, 30, 'Game Over').setOrigin(0.5, 0.5);
    const points = this.registry.get('points');
    const text = `Punkte: ${points > 0 ? points : 0}`;
    this.add.text(sizes.width / 2, 50, text).setOrigin(0.5, 0.5);

    this.anims.create({
      key: 'finishFlag',
      frames: this.anims.generateFrameNumbers('itemsSpriteSheet', { start: 111, end: 112 }),
      frameRate: 3,
      repeat: -1
    });

    const flagPole = this.add.image(sizes.width - 100, sizes.height, 'itemsSpriteSheet', 131).setScale(5).setOrigin(0.5, 1);
    this.finishFlagAnim = this.add.sprite(sizes.width - 100, sizes.height - (flagPole.height * flagPole.scaleY), 'itemsSpriteSheet', 111).setScale(5);
    this.finishFlagAnim.play('finishFlag');

    // Zeige Spielcharacter Animation wie in GameStart Szene
    this.playerAnim = this.add.sprite(sizes.width / 2, sizes.height, 'spriteSheet', 4).setScale(5).setOrigin(0.5, 1);
    this.playerAnim.play('player_walk');

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