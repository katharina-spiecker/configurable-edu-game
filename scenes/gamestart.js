import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class GameStart extends Phaser.Scene {
  constructor() {
    super("GameStart");
    this.text;
    this.loadingAnim;
    this.input;
  }

  preload() {
    this.load.spritesheet('spriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap-characters_packed.png', {
      frameWidth: 24,
      frameHeight: 24
    });
  }

  create() {
    // Zeige Animation of Spielcharacter während auf Spielerinput warten
    this.anims.create({
      key: 'loading_animation',
      frames: this.anims.generateFrameNumbers('spriteSheet', { start: 4, end: 5 }),
      frameRate: 3, // frames per second
      repeat: -1
    });
    this.loadingAnim = this.add.sprite(sizes.width / 2, 200, 'spriteSheet', 4);
    this.loadingAnim.setScale(5);
    this.loadingAnim.play('loading_animation');

    this.text = this.add.text(sizes.width / 2, 300, "Gebe den Spielcode ein", {font: "30px Arial", fill: "#ffffff"}).setOrigin(0.5, 0.5);
    
    this.input = document.createElement("input");
    this.input.id = "game-id";
    document.querySelector("main").appendChild(this.input);
    this.input.addEventListener("input", (e) => {
      const id = e.target.value.trim();
      // mongodb id always 24 - TODO, change to different id later
      if (id.length === 24) {
        this.loadQuiz(id);
      } else {
        this.text.setText("Die Spiel id ist nicht korrekt");
        // TODO: delete once dev complete
        this.loadQuiz("672b986a6e527f78cd516624");
      }
    })
  }

  // 672b986a6e527f78cd516624
  loadQuiz(quizId) {
    // Füge Text Loading
    this.text.setText("Loading...");
    // lade Spieldaten
    fetch(`http://localhost:3000/api/topics/${quizId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch quiz: Error with status ${res.status}`)
      }
      return res.json();
    })
    .then(data => {
      if (data.quiz.length === 0) {
        this.text.setText("Das Thema muss mindestens ein Quiz enthalten.");
        return;
      }
      // TODO: make sure it is visible for at least 3 seconds
      this.text.destroy();
      // speichere Quizdaten, damit verfügbar in anderen Szenen
      this.registry.set("topicName", data.topicName)
      this.registry.set("quiz", data.quiz)
      // Button zum Spielbeginn hinzufügen
      const textBtn = this.add.text(sizes.width / 2, 300, "Start", {
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
        this.input.remove();
        this.scene.start("MainGame")
      })
    })
    .catch(err => console.error(err))
  }
}