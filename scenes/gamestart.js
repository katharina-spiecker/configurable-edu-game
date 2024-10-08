import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class GameStart extends Phaser.Scene {
  constructor() {
    super("GameStart");
  }

  preload() {
    this.load.spritesheet('spriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap-characters_packed.png', {
      frameWidth: 24,
      frameHeight: 24
    });
  }

  create() {

    // Füge Text Loading
    const loadingText = this.add.text(sizes.width / 2, sizes.height / 2 + 100, "Loading...", {font: "30px Arial", fill: "#ffffff"}).setOrigin(0.5, 0.5)

    // Zeige Animation of Spielcharacter während des Ladens
    this.anims.create({
      key: 'loading_animation',
      frames: this.anims.generateFrameNumbers('spriteSheet', { start: 4, end: 5 }),
      frameRate: 3, // frames per second
      repeat: -1
    });
    const loadingAnim = this.add.sprite(sizes.width / 2, sizes.height / 2, 'spriteSheet', 4);
    loadingAnim.setScale(5);
    loadingAnim.play('loading_animation');


    // load game data
    // f43760a3-55c3-4d6c-a40e-98e606136ac7 cf3ab749-789f-405d-9741-bf6770ac8bed
    const testQuizId = "670114ec9f2becc8986974e6";
    fetch(`http://localhost:3000/api/topics/${testQuizId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch quiz: Error with status ${res.status}`)
      }
      return res.json();
    })
    .then(data => {
      // TODO: make sure it is visible for at least 3 seconds
      loadingAnim.destroy();
      loadingText.destroy();
      // speichere Quizdaten, damit verfügbar in anderen Szenen
      this.registry.set("topicName", data.topicName)
      this.registry.set("quiz", data.quiz)
      // Button zum Spielbeginn hinzufügen
      const textBtn = this.add.text(sizes.width / 2, sizes.height / 2, "Start", {
        fontSize: "25px Arial",
        color: "#fff",
        backgroundColor: '#007bff',
        padding: { x: 20, y: 10 },
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      // Event Listener: bei Klick auf Button startet Spiel
      textBtn.on('pointerdown', () => {
        this.scene.start("MainGame")
      })
    })
    .catch(err => console.error(err))
  }
}