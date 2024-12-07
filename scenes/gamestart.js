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
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('spriteSheet', { start: 4, end: 5 }),
      frameRate: 3,
      repeat: -1
    });
    this.loadingAnim = this.add.sprite(sizes.width / 2, 200, 'spriteSheet', 4);
    this.loadingAnim.setScale(5);
    this.loadingAnim.play('player_walk');

    this.text = this.add.text(sizes.width / 2, 300, "Gebe den Spielcode ein", {font: "30px Arial", fill: "#ffffff"}).setOrigin(0.5, 0.5);
    
    this.input = document.createElement("input");
    this.input.id = "game-id";
    document.querySelector("main").appendChild(this.input);
    this.input.addEventListener("input", (e) => {
      const id = e.target.value.trim();
      // der Spielcode (uuid) ist immer genau 36 Zeichen lang
      if (id.length === 36) {
        this.loadQuiz(id);
      } else {
        this.text.setText("Bitte überprüfe die Spiel-ID");
      }
    })
  }

  loadQuiz(gameCode) {
    this.text.setText("Loading...");
    // lade Quizdaten
    fetch(`http://localhost:3000/api/quizzes/game/${gameCode}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch quiz: Error with status ${res.status}`)
      }
      return res.json();
    })
    .then(data => {
      if (data.quiz.length === 0) {
        this.text.setText("Das Quiz muss mindestens eine Frage enthalten.");
        return;
      }
      this.text.destroy();
      // speichere Quizdaten, damit verfügbar in anderen Szenen
      this.registry.set("quiz", data.quiz)
      // Button zum Spielbeginn hinzufügen
      const textBtn = this.add.text(sizes.width / 2, 310, "Start", {
        fontFamily: "Arial",
        fontSize: "25px",
        color: "#fff",
        backgroundColor: "#4248f5",
        padding: { x: 20, y: 10 },
        align: "center"
      })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      
      // Event Listener: bei Klick auf Button startet Spiel
      textBtn.on('pointerdown', () => {
        this.input.remove();
        this.scene.start("MainGame")
        // this.scene.start("GameOver");
      })
    })
    .catch(err => console.error(err))
  }
}