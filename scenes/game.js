import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class MainGame extends Phaser.Scene {
  constructor() {
    super("MainGame");
  }

  preload() {
    this.load.audio("coinSound", "../assets/audio/coin.mp3");
    this.load.audio("wrongAnswerSound", "../assets/audio/kenney_sci-fi-sounds/Audio/impactMetal_002.ogg");
    this.load.audio("alienLanding", "../assets/audio/kenney_sci-fi-sounds/Audio/doorOpen_001.ogg");
    this.load.spritesheet('itemsSpriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap_packed.png', {
      frameWidth: 18,
      frameHeight: 18
    });
    this.load.image('tilesBg', '../assets/kenney_pixel-platformer/Tilemap/tilemap-backgrounds_packed.png');
    this.load.spritesheet('spriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap-characters_packed.png', {
      frameWidth: 24, 
      frameHeight: 24
    });
    this.load.tilemapTiledJSON('level-1', '../assets/tilemaps/level-1.tmj');
    this.load.tilemapTiledJSON('level-2', '../assets/tilemaps/level-2.tmj');
    this.load.tilemapTiledJSON('level-3', '../assets/tilemaps/level-3.tmj');
  }

  create() {
    // Punktestand in registry speichern, sodass auch in gameover Szene Zugriff
    this.registry.set("points", 0);
    this.registry.set("lives", 3);
    this.currentQuizIndex = 0;
    // wird aktiviert um level zu wechseln.
    this.levelTransitionActive = false;
    // Flag Variable fürs Punkte abziehen
    this.pointsDecreaseBlocked = false;
    // Music dem Sound Manager hinzufügen
    this.coinSound = this.sound.add("coinSound");
    this.wrongAnswerSound = this.sound.add("wrongAnswerSound");
    this.alienLanding = this.sound.add("alienLanding");
    // Erstellt Spielwelt basierend auf Tilemap
    this.tilemapKeys = ['level-1', 'level-2', 'level-3'];
    this.addMap();
    // Spieler hinzufügen
    this.addPlayer();
    // verschiebe Player hinter den foregroundLayer
    this.children.moveTo(this.player, this.children.getIndex(this.foregroundLayer));
    this.addQuiz();
    // Kollision zwischen Player und Landscape Layer
    this.physics.add.collider(this.player, this.map.getLayer("Landscape").tilemapLayer);
    // um auf User Eingaben zu hören
    this.cursor = this.input.keyboard.createCursorKeys();
    // Anzeige Leben
    this.livesDisplay = this.add.sprite(sizes.width - 30, 10, 'itemsSpriteSheet', 44).setOrigin(0.5, 0).setScale(2).setScrollFactor(0);
    // Anzeige Punkte
    this.diamondDisplay = this.add.sprite(sizes.width - 70, 10, 'itemsSpriteSheet', 67).setOrigin(0.5, 0).setScale(2).setScrollFactor(0);
    this.pointsDisplay = this.add.text(sizes.width - 100, 13, "0", {font: "28px Arial", fill: "#000000"}).setOrigin(0.5, 0).setScrollFactor(0);

    this.diamondEmitter = this.add.particles(0, 0, 'itemsSpriteSheet', {
      frame: 67,
      speed: 100,
      gravity: 50,
      scale: 2,
      duration: 100,
      emitting: false
    });

    this.diamondEmitter.startFollow(this.player, 10, 10, true);
    // setze Anfangsposition von Kamera oben links damit das gesamte Spiel sichtbar ist
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.startFollow(this.player, true, 1, 0, -150, 0);

    this.setCameraAndWorldBounds();
  }

  update() {
    if (this.cursor.up.isDown) {
      this.player.setVelocityY(-this.playerSpeedUp);
    } else if (this.cursor.down.isDown) {
      this.player.setVelocityY(this.playerSpeedDown);
    } else if (this.cursor.right.isDown) {
      this.player.setVelocityX(this.playerSpeedX);
    } else if (this.cursor.left.isDown) {
      this.player.setVelocityX(-this.playerSpeedX);
    } else {
       // falls Avatar in Wasser, treibe nach links
      if (this.player.y > sizes.height - 72) {
        this.player.setVelocityX(-50);
      } else {
        // mache Player 10% langsamer, wenn keine Taste gedrückt damit langsam anhaltend
        this.player.setVelocityX(this.player.body.velocity.x * 0.9);
      }
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
    this.playerSpeedUp = 200;
    this.playerSpeedDown = 100;
    this.playerSpeedX = 150;
    this.player = this.physics.add.sprite(sizes.width / 3, 0, 'spriteSheet', 4); // Extract character at frame 1
    this.player.setOrigin(0.5, 0.5).setScale(2);
    // Play the animation for a specific character
    this.player.play('player_walk');
    // wie stark Player zurückprallen soll bei Zusammenstoß mit anderem Objekt
    this.player.setBounce(0.5);
    // should not move when collided with by other objects
    this.player.setImmovable(true);
    // macht collision box kleiner als player
    this.player.setSize(20, 20);
    // Kamera kann nicht über den Bereich hinausgehen damit player nicht über diesen Bereich hinausgehen kann
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBoundsCollision(true, true, false, true);
    // für berühren von Stacheln
    this.physics.add.overlap(this.player, this.spikeGroup, this.losePoints, null, this);
    // Musik abspielen, sobald Player hinzugefügt wurde
    this.alienLanding.play();
  }

  addQuiz() {
    // DOM Elemente zur Darstellung des Quiz
    this.quizWrapperElement = document.getElementById("quiz");
    this.questionElement = document.getElementById("quiz-question");
    this.answersElement = document.getElementById("quiz-answers");
    this.quizWrapperElement.style.display = "block";
    // init Werte
    this.quiz = this.registry.get("quiz");
    this.answerObjects = this.physics.add.staticGroup();
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
        // x muss verschoben werden wegen endless runner Effekt
        let xPosition = (sizes.width * this.currentQuizIndex) + currentBox.x * 2;
        let yPosition = currentBox.y * 2;
        // erstelle Boxinhalt je nachdem ob richtige oder falsche Antwort
        let answerSurprise;
        let answerIsCorrect = currentQuiz.answers[i].correct;
        if (answerIsCorrect) {
          answerSurprise = this.answerObjects.create(xPosition, yPosition, 'itemsSpriteSheet', 27).setOrigin(0, 1).setScale(1.5);
        } else {
          answerSurprise = this.answerObjects.create(xPosition, yPosition, 'spriteSheet', 8).setOrigin(0, 1).setScale(1.5);
        }
        // erstelle Box
        const answerBox = this.answerObjects
          .create(xPosition, yPosition, "itemsSpriteSheet", 9) // Frame 9 enthält Box
          .setOrigin(0, 1)
          .setScale(2)
          .setSize(32, 32)
          .setOffset(8, -26);
        // erstelle Zahl
        const answerOption = this.answerObjects.create(xPosition, yPosition, 'itemsSpriteSheet', imageIndex).setOrigin(0, 1).setScale(2);
        // nächste Antwort kriegt nächstes Bild (sind in der tilemap aufsteigend sortiert)
        imageIndex++;
        // füge overlap detection hinzu
        this.physics.add.overlap(this.player, answerBox, (player, answerBox) => this.onCollideWithAnswer(player, answerBox, answerIsCorrect, answerOption, answerSurprise), null, this);
    }
  }

  onCollideWithAnswer(player, answerBox, answerIsCorrect, answerOption, answerSurprise) {
    if (answerIsCorrect) {
      // lösche alle Antwortboxen
      this.answerObjects.clear(true, true);
      this.diamondEmitter.explode(10);
      // spiele Punkte gesammelt Musik ab
      this.coinSound.play();
      // erhöhe Punkte
      const newPoints = this.registry.get("points") + 5;
      this.registry.set("points", newPoints);
      this.pointsDisplay.setText(newPoints);

      // Schlüssel erscheint - Symbol um ins nächste Level aufzusteigen
      const keySymbol = this.add.image(player.x + 10, player.y + 10, 'itemsSpriteSheet', 27).setScale(2);
      this.tweens.add({
        targets: keySymbol,      
        x: player.x + 30,      
        y: player.y - 20,                
        duration: 2000 // Dauer der Animation in ms
      });

      // erhöhe quiz index
      this.currentQuizIndex++;
      // check ob Quiz durchgespielt
      if (this.currentQuizIndex < this.quiz.length) {
        this.transitionToNewLevel();
      } else {
        this.registry.set("quizCompleted", true);
        this.gameOver();
      }
    } else {
      const newLivesCount = this.registry.get("lives") - 1;
      this.registry.set("lives", newLivesCount);
      if (newLivesCount == 2) {
        this.livesDisplay.setTexture('itemsSpriteSheet', 45);
      } else if (newLivesCount == 1) {
        this.livesDisplay.setTexture('itemsSpriteSheet', 46);
      }
      if (newLivesCount === 0) {
        this.registry.set("quizCompleted", false);
        this.gameOver();
      }
      // verstecke das Sprite sobald animation fertig
      this.wrongAnswerSound.play();
      // lösche falsche Antwortbox, answerSurprise (Bombe) bleibt da
      answerOption.destroy();
      answerBox.destroy();
      // falls Avatar Bombe nochmal berührt: Punktabzug
      this.physics.add.overlap(this.player, answerSurprise, this.losePoints, null, this);
    }
  }

  losePoints() {
    this.wrongAnswerSound.play();
    // innerhalb der nächsten 3 Sekunden werden nur einmal Punkte abgezogen damit Spieler Zeit hat Position zu verändern
    if (!this.pointsDecreaseBlocked) {
      const newPoints = this.registry.get("points") - 2;
      this.registry.set("points", newPoints);
      this.pointsDisplay.setText(newPoints);
      this.pointsDecreaseBlocked = true;
      this.time.addEvent({
        delay: 3000, // 3 Sekunden
        callback: function(){ this.pointsDecreaseBlocked = false },
        callbackScope: this // callback scope
      });
    }
    
  }

  // erzeugt Übergang zum nächsten Level
  transitionToNewLevel() {
    // update map
    this.addMap();
    // verschiebe Player nach vorne hinter den foregroundLayer
    this.children.moveTo(this.diamondEmitter, this.children.getIndex(this.foregroundLayer));
    this.children.moveTo(this.diamondDisplay, this.children.getIndex(this.foregroundLayer));
    this.children.moveTo(this.pointsDisplay, this.children.getIndex(this.foregroundLayer));
    this.children.moveTo(this.player, this.children.getIndex(this.foregroundLayer));
    this.children.moveTo(this.livesDisplay, this.children.getIndex(this.foregroundLayer));
    this.physics.add.collider(this.player, this.map.getLayer("Landscape").tilemapLayer);
    this.physics.add.overlap(this.player, this.spikeGroup, this.losePoints, null, this);
    // aktualisiere Quiz
    this.updateQuiz();
   
    this.setCameraAndWorldBounds();
  }

  addMap() {
    // wählt eine zufällige Landschaft aus
    const randomMapKey = this.tilemapKeys[Math.floor(Math.random() * this.tilemapKeys.length)];

    this.map = this.make.tilemap({key: randomMapKey});
    // Argumente: name der in Tiled verwendet wurde, key der in preload
    const tileset = this.map.addTilesetImage('tileset', 'itemsSpriteSheet');
    const backgroundTileset = this.map.addTilesetImage('background', 'tilesBg');

    const offsetX = this.currentQuizIndex * sizes.width;
    // 1. Argument name von tiled
    this.map.createLayer("Background", backgroundTileset, offsetX).setScale(2);
    this.landscapeLayer = this.map.createLayer("Landscape", tileset, offsetX).setScale(2).setCollision([42, 43, 44, 48, 49, 50, 51, 61, 62, 63, 64], true);
    this.foregroundLayer = this.map.createLayer("Foreground", tileset, offsetX).setScale(2);
    this.spikeGroup = this.physics.add.group({immovable: true, allowGravity: false});
    this.map.getObjectLayer('Objects').objects.forEach(object => {
      if (object.gid === 69) {
        // berechne x und y position
        let xPosition = (sizes.width * this.currentQuizIndex) + object.x * 2;
        let yPosition = object.y * 2;

        this.spikeGroup
          .create(xPosition, yPosition, "itemsSpriteSheet", object.gid - 1) // ziehe 1 ab da frames 0 indexed
          .setOrigin(0, 1) 
          .setScale(2)
          .setSize(18, 8) // da spikes nicht die ganze Kachel füllen
          .setOffset(0, 10)
      }
    })
  }

  createAnimations() {
    this.anims.create({
      key: 'bomb_mobing',
      frames: this.anims.generateFrameNumbers('itemsSpriteSheet', { start: 44, end: 46 }),
      frameRate: 1 ,
      repeat: -1
    });
  }

  setCameraAndWorldBounds() {
    this.cameras.main.setBounds(0, 0, (this.currentQuizIndex + 1) * sizes.width, sizes.height);
    this.physics.world.setBounds(0, 0, sizes.width * (this.currentQuizIndex + 1), sizes.height - 15);
  }
}