import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class MainGame extends Phaser.Scene {
  constructor() {
    super("MainGame");
    this.player = null;
    this.cursor = null;
    this.playerSpeedY = 300;
    this.playerSpeedX = 80;
    this.target = null;

    // this.textTime = null; // display remaining time here

    // get elements for displaying quiz and answers
    this.quizWrapperElement = document.getElementById("quiz");
    this.questionElement = document.getElementById("quiz-question");
    this.answersElement = document.getElementById("quiz-answers");

    this.currentQuizIndex = 0;
    this.quiz = [];

    // wird aktiviert um level zu wechseln.
    this.levelTransitionActive = false;

    // tilemaps
    this.obstaclesMap = null;
  }

  preload() {
    this.load.audio("coinSound", "../assets/audio/coin.mp3");
    this.load.audio("wrongAnswerSound", "../assets/audio/kenney_sci-fi-sounds/Audio/impactMetal_002.ogg");
    this.load.audio("alienLanding", "../assets/audio/kenney_sci-fi-sounds/Audio/doorOpen_001.ogg");

    // Lade tilemaps: Objekte, Hintergründe, Charaktere
    this.load.image('tiles', '../assets/kenney_pixel-platformer/Tilemap/tilemap_packed.png');
    this.load.image('tilesBg', '../assets/kenney_pixel-platformer/Tilemap/tilemap-backgrounds_packed.png');
    this.load.spritesheet('spriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap-characters_packed.png', {
      frameWidth: 24,  // Width of each character frame
      frameHeight: 24  // Height of each character frame
    });

    this.load.spritesheet('itemsSpriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap_packed.png', {
      frameWidth: 18,  // Width of each character frame
      frameHeight: 18  // Height of each character frame
    });

    this.load.tilemapTiledJSON('level-1', '../assets/tilemaps/level-1.tmj');
  }

  create() {
    // how long the game should stretch in unit of screens (one game screen is sizes.with wide)
    // a question should last for 1 frame 
    const quiz = this.registry.get("quiz");
    if (quiz && quiz.length > 0) {
      this.gameFramesAmount = quiz.length;
    } else {
      this.gameFramesAmount = 1;
    }

    this.addMap();

    // music
    this.coinSound = this.sound.add("coinSound");
    this.wrongAnswerSound = this.sound.add("wrongAnswerSound");
    this.alienLanding = this.sound.add("alienLanding");

    this.addPlayer();
    this.alienLanding.play();

    this.answerObjects = this.physics.add.staticGroup();

    // Enable collision between player and tilemap layers
    // added from tiled layer
    this.physics.add.collider(this.player, this.map.getLayer("Landscape").tilemapLayer);


    this.addQuiz();

    // add points to global point registry in order to access scene
    this.registry.set("points", 0);

    // um auf User Eingaben zu hören
    this.cursor = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: 'lose_points',
      frames: this.anims.generateFrameNumbers('itemsSpriteSheet', { start: 44, end: 46 }),
      frameRate: 3
    });

    this.pointsLoseAnim = this.add.sprite(sizes.width - 30, 30, 'itemsSpriteSheet', 44);
    this.pointsLoseAnim.setVisible(false);
    this.pointsLoseAnim.setScale(2);

    this.coinParticles = this.add.particles(0, 0, 'itemsSpriteSheet', {
      frame: 151,
      speed: 100,
      gravity: 50,
      scale: 2,
      duration: 100,
      emitting: false
    });

    this.coinParticles.startFollow(this.player, 10, 10, true);
  }

  update() {
    // let remainingTime = this.timedEvent.getRemainingSeconds();
    // this.textTime.setText(`Remaining time: ${Math.floor(remainingTime)}`);

    // falls in Transition: Player soll nach rechts laufen bis im nächsten Level ohne Eingabe vom Spielenden zu beachten 
    if (this.levelTransitionActive) {
      if (this.player.x > (this.currentQuizIndex * sizes.width)) {
        this.stablizeLevel();
      }
      return;
    }

    if (this.cursor.up.isDown) {
      this.player.setVelocityY(-this.playerSpeedY);
    } else if (this.cursor.down.isDown) {
      this.player.setVelocityY(this.playerSpeedY)
    } else if (this.cursor.right.isDown) {
      this.player.setVelocityX(this.playerSpeedX * 3);
    } else if (this.cursor.left.isDown) {
      this.player.setVelocityX(-this.playerSpeedX * 3);
    } else {
      // mache Player 10% langsamer, wenn keine Taste gedrückt damit langsam anhaltend
      this.player.setVelocityX(this.player.body.velocity.x * 0.9);
    }
  }

  gameOver() {
    this.sound.stopAll();
    this.questionElement.innerText = "";
    this.answersElement.innerText = "";
    this.quizWrapperElement.style.display = "none";
    this.scene.start('GameOver');
  }

  addPlayer() {
    this.player = this.physics.add.sprite(sizes.width / 3, 0, 'spriteSheet', 4); // Extract character at frame 1
    this.player.setOrigin(0.5, 0.5).setScale(2);
    // this.player.body.setAllowGravity(false);

    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('spriteSheet', { start: 4, end: 5 }),
      frameRate: 3,
      repeat: -1
    });

    // Play the animation for a specific character
    this.player.play('player_walk');

    // wie stark Player zurückprallen soll bei Zusammenstoß mit anderem Objekt
    this.player.setBounce(0.5);

    // should not move when collided with by other objects
    this.player.setImmovable(true);

    // macht collision box kleiner als player
    this.player.setSize(20, 20);

    // setze Anfangsposition von Kamera oben links damit das gesamte Spiel sichtbar ist
    this.cameras.main.setScroll(0, 0);
    // Kamera kann nicht über den Bereich hinausgehen
    // damit player nicht über diesen Bereich hinausgehen kann
    this.physics.world.setBounds(0, 0, sizes.width, sizes.height - 54); // Höhe minus 54 px damit nicht tiefer als "Erde" möglich
    this.physics.world.setBoundsCollision(true, true, false, true);
    this.player.setCollideWorldBounds(true);

    // verschiebe Player hinter den foregroundLayer
    this.children.moveTo(this.player, this.children.getIndex(this.foregroundLayer));
    // für berühren von Stacheln
    this.physics.add.overlap(this.player, this.spikeGroup, this.hitSpikes, null, this);
  }

  addQuiz() {
    const quiz = this.registry.get("quiz");
    if (!quiz || quiz.length === 0) {
      return;
    }

    this.quiz = quiz;

    this.quizWrapperElement.style.display = "block";
    // setzte Anfangsquiz
    this.updateQuiz();
  }

  updateQuiz() {
    const currentQuiz = this.quiz[this.currentQuizIndex];
    this.questionElement.innerText = currentQuiz.question;
    // lösche vorherigen Inhalt
    this.answersElement.innerText = "";
    // append answers
    for (let i = 0; i < currentQuiz.answers.length; i++) {
      const pElement = document.createElement("p");
      pElement.innerText = `${i + 1}) ${currentQuiz.answers[i].text}`;
      this.answersElement.appendChild(pElement);
    }
    this.addAnswerBoxes(currentQuiz);
  }

  addAnswerBoxes(currentQuiz) {
    // erstelle Boxen - schon 4 potetielle Orte vorgegeben in Object Layer
    let boxesArr = this.map.getObjectLayer('Objects').objects.filter(object => object.gid === 10);
    let imageIndex = 161; // Bild für die 1 auf dem spritesheet

    for (let i = 0; i < currentQuiz.answers.length; i++) {
        let currentBox = boxesArr[i];
        let xPosition = currentBox.x * 2;
        let yPosition = currentBox.y * 2;

        // erstelle Boxinhalt je nachdem ob richtige oder falsche Antwort
        let answerSurprise;
        if (currentQuiz.answers[i].correct) {
          answerSurprise = this.answerObjects.create(xPosition, yPosition, 'itemsSpriteSheet', 27).setOrigin(0, 1).setScale(1.5);
          answerSurprise.correct = true;
        } else {
          answerSurprise = this.answerObjects.create(xPosition, yPosition, 'spriteSheet', 8).setOrigin(0, 1).setScale(1.5);
          answerSurprise.correct = false;
        }

        // erstelle Box
        const answerBackground = this.answerObjects
          .create(xPosition, yPosition, "itemsSpriteSheet", 9) // Frame 9 enthält Box
          .setOrigin(0, 1)
          .setScale(2)
          .setSize(30, 30)
          
        // erstelle Zahl
        const answerOption = this.answerObjects.create(xPosition, yPosition, 'itemsSpriteSheet', imageIndex).setOrigin(0, 1).setScale(2);
        // nächste Antwort kriegt nächstes Bild (sind in der tilemap aufsteigend sortiert)
        imageIndex++;

        // füge overlap detection hinzu
        this.physics.add.overlap(this.player, answerSurprise, (player, answerSurprise) => this.onCollideWithAnswer(player, answerSurprise, answerBackground, answerOption), null, this);
    }
  }

  onCollideWithAnswer(player, answerSurprise, answerBackground, answerOption) {
    if (answerSurprise.correct) {
      this.answerObjects.clear(true, true);
      this.coinParticles.start();
      // spiele Punkte gesammelt Musik ab
      this.coinSound.play();
       // erhöhe quiz index
      this.currentQuizIndex++;
      // TODO erhöhe Punkte

      // Schlüssel erscheint - Symbol um ins nächste Level aufzusteigen
      const keySymbol = this.add.image(player.x + 10, player.y + 10, 'itemsSpriteSheet', 27).setScale(2);
      this.tweens.add({
        targets: keySymbol,      
        x: player.x + 30,      
        y: player.y - 20,                
        duration: 2000 // Dauer der Animation in ms
      });

      this.transitionToNewLevel();
    } else {
      this.losePoints();
      // entferne falsche Antwort
      answerOption.destroy();
      answerBackground.destroy();
    }
  }

  losePoints() {
    this.wrongAnswerSound.play();
    // falls falsch signalisiere Punktabzug
    this.pointsLoseAnim.setVisible(true);
    this.pointsLoseAnim.play('lose_points');
    // verstecke das Sprite sobald animation fertig
    this.pointsLoseAnim.on('animationcomplete', () => {
      this.pointsLoseAnim.setVisible(false);
    });
  }

  // erzeugt Übergang zum nächsten Level
  transitionToNewLevel() {
    this.levelTransitionActive = true; // damit Spieler temporär nicht navigieren kann
    // player landet langsam auf dem Boden
    this.player.setVelocityY(0);
    // player läuft nach rechts
    this.player.setVelocityX(this.playerSpeedX);
    this.cameras.main.startFollow(this.player, true, 1, 0, -150, 0);
    this.physics.world.setBoundsCollision(true, false, false, true);
  }

  // fixiert die Levelansicht
  stablizeLevel() {
    // wo das Level anfängt
    const leftLevelBound = sizes.width * this.currentQuizIndex;
    this.levelTransitionActive = false;
    this.player.setVelocityX(0);
    this.physics.world.setBounds(leftLevelBound, 0, sizes.width, sizes.height - 54);
    this.physics.world.setBoundsCollision(true, true, false, true);
    this.cameras.main.setScroll(leftLevelBound, 0);
    this.cameras.main.stopFollow();
    // aktualisiere Quiz
    this.updateQuiz();
  }

  addMap() {
    this.map = this.make.tilemap({key: 'level-1'});
    // name in tiled verwendet (tileset) und key der in preload angegeben
    const tileset = this.map.addTilesetImage('tileset', 'tiles');

    // 1. Argument name von tiled
    this.landscapeLayer = this.map.createLayer("Landscape", tileset).setScale(2).setCollision([42, 43, 44, 49, 50, 51, 62, 63, 64], true);

    this.foregroundLayer = this.map.createLayer("Foreground", tileset).setScale(2);

    // const debugGraphics = this.add.graphics();
    // layer.renderDebug(debugGraphics)

    this.spikeGroup = this.physics.add.group({immovable: true, allowGravity: false});

    this.map.getObjectLayer('Objects').objects.forEach(object => {
      if (object.gid === 69) {
        this.spikeGroup
          .create(object.x * 2, object.y * 2, "itemsSpriteSheet", object.gid - 1) // ziehe 1 ab da frames 0 indexed
          .setOrigin(0, 1) 
          .setScale(2)
          .setSize(18, 8) // da spikes nicht die ganze Kachel füllen
          .setOffset(0, 10)
      }
    })
  }

  hitSpikes() {
    // TODO, add more logic
    this.losePoints();
  }


}