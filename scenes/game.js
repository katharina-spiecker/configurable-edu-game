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

    // tilemaps
    this.obstaclesMap = null;
  }

  preload() {
    this.load.audio("coinSound", "../assets/audio/coin.mp3");
    this.load.audio("wrongAnswerSound", "../assets/audio/kenney_sci-fi-sounds/Audio/impactMetal_002.ogg");
    this.load.audio("alienLanding", "../assets/audio/kenney_sci-fi-sounds/Audio/doorOpen_001.ogg");
  
    // this.load.audio("bgMusic", "/assets/bgMusic.mp3");

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
  }

  create() {
    // how long the game should stretch in unit of screens (one game screen is sizes.with wide)
    // a question should last for 4 frames -> total frames = amount of questions times 4
    const quiz = this.registry.get("quiz");
    if (quiz && quiz.length > 0) {
      this.gameFramesAmount = quiz.length * 4;
    } else {
      this.gameFramesAmount = 3;
    }

    this.createTileBackground();
    this.createTileClouds();
    this.createTileLandscape();

    // music
    this.coinSound = this.sound.add("coinSound");
    this.wrongAnswerSound = this.sound.add("wrongAnswerSound");
    this.alienLanding = this.sound.add("alienLanding");

    this.addPlayer();
    this.alienLanding.play();

    this.answerObjects = this.physics.add.staticGroup();

    // Enable collision between player and tilemap layers
    // TODO this.physics.add.collider(this.player, obstaclesLayer);


    this.addQuiz();

    // add points to global point registry in order to access scene
    this.registry.set("points", 0);

    // for listening to moving left and right in update method
    this.cursor = this.input.keyboard.createCursorKeys();

    // this.textScore = this.add.text(10, 10, "Punkte: 0", {font: "16px Arial", fill: "#000000"});

    // this.textTime = this.add.text(sizes.width - 300, 10, "Remaining Time", {font: "16px Arial", fill: "#000000"});

    
    // this.bgMusic = this.sound.add("bgMusic");
    // this.bgMusic.play();

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
    this.player.setOrigin(0.5, 0.5).setScale(3);
    // this.player.body.setAllowGravity(false);

    this.anims.create({
      key: 'character1_walk',
      frames: this.anims.generateFrameNumbers('spriteSheet', { start: 4, end: 5 }),
      frameRate: 3,
      repeat: -1
    });

    // Play the animation for a specific character
    this.player.play('character1_walk');

    // wie stark Player zurückprallen soll bei Zusammenstoß mit anderem Objekt
    this.player.setBounce(0.5);

    // should not move when collided with by other objects
    this.player.setImmovable(true);

    // this.player.setDepth(1); wie z-index

    // macht collision box kleiner als player
    this.player.setSize(20, 20);

    // Geschwindigkeit mit der sich Player nach rechts bewegt
    // this.player.setVelocityX(this.playerSpeedX);
    // Kamera folgt dem Spieler auf der x Achse. Verikale Position bleibt konstant
    // this.cameras.main.startFollow(this.player, true, 1, 0, -150, 0);
    // setze Anfangsposition von Kamera oben links damit das gesamte Spiel sichtbar ist
    this.cameras.main.setScroll(0, 0); 
    this.cameras.main.setBounds(0, 0, this.obstaclesMap.widthInPixels, sizes.height); // Kamera kann nicht über den Bereich hinausgehen
    // damit player nicht über diesen Bereich hinausgehen kann
    this.physics.world.setBounds(0, 0, sizes.width, sizes.height - 54); // Höhe minus 54 px damit nicht tiefer als "Erde" möglich
    this.physics.world.setBoundsCollision(true, true, false, true);
    this.player.setCollideWorldBounds(true);
  }

  createTileBackground() {
    // Hintergrund bewegt sich langsamer
    const scrollFactor = 0.3;
    const tilemapArr = [[],[],[]];

    const middleLayerSelection = [8, 9, 10];

    const tileSize = 24;
    // Scale the layer to increase the size: height of game divided by size of tile times amount of rows
    const tileScale = sizes.height / (tileSize * tilemapArr.length);
    // multipliziere mit scroll factor, da wenn weniger schnell, muss weniger generiert werden
    const totalSize = this.gameFramesAmount * sizes.width * scrollFactor;
    const columnsNeeded = Math.ceil(totalSize / (tileSize * tileScale));

    for (let i = 0; i < columnsNeeded; i++) {
      tilemapArr.forEach((row, index) => {
        // zweite Zeile kriegt ein zufälliges Bild
        if (index === 1) {
          // generiert 0, 1 oder 2
          let randomIndex = Math.floor(Math.random() * 3)
          row.push(middleLayerSelection[randomIndex]);
          // letzte Zeile
        } else if (index === 2) {
          row.push(16);
          // erste Zeile
        } else {
          row.push(0);
        }
      })
    }

    // create tilemap for background
    const bgMap = this.make.tilemap({data: tilemapArr, tileWidth: tileSize, tileHeight: tileSize})

    const bgTileset = bgMap.addTilesetImage('tilesBg');
    const bgLayer = bgMap.createLayer(0, bgTileset, 0, 0);
    bgLayer.setScale(tileScale);
    bgLayer.setScrollFactor(0.5);
  }

  createTileClouds() {
    // Wolken sollen Mittel Layer sein und daher schneller als Hintergrund, aber langsamer als Vordergrund
    const scrollFactor = 0.6;

    const tileSize = 18;
    // Scale the layer to increase the size: height of game divided by size of tile times amount of rows
    const tileScale = 5;
    // multipliziere mit scroll factor, da wenn weniger schnell, muss weniger generiert werden
    const totalSize = this.gameFramesAmount * sizes.width * scrollFactor;
    const columnsNeeded = Math.ceil(totalSize / (tileSize * tileScale));

    // muss 2D Array sein für tilemap, allerdings brauchen wir nur eine Zeile
    const tilemapArr = [[]];
    let isGeneratingCloud = false;
    const cloudTiles = [153, 154, 155];
    let cloudIndex = 0;

    for (let i = 0; i < columnsNeeded; i++) {
      if (isGeneratingCloud) {
        // komplette Wolke wurde generiert
        if (cloudIndex == cloudTiles.length) {
          // setze Werte zurück
          cloudIndex = 0;
          isGeneratingCloud = false;
        } else {
          tilemapArr[0].push(cloudTiles[cloudIndex]);
          cloudIndex++;
        }
        //
      } else {
        // leere Tile hinzufügen
        tilemapArr[0].push(-1);
        if (Math.random() > 0.8) {
          isGeneratingCloud = true;
        }
      }
    }

    // Create the tilemap from the 2D array
    let map = this.make.tilemap({ data: tilemapArr, tileWidth: tileSize, tileHeight: tileSize });
    // Add the tileset image to the map
    const tileset = map.addTilesetImage('tiles');
    // Create a layer for the map, passing in the name of the tileset
    map.createLayer(0, tileset, 0, 0).setScale(tileScale).setScrollFactor(0.5);
  }

  createTileLandscape() {
    let tilemapArr = [
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [ -1, -1, -1, -1, 146, -1, -1, -1, -1, -1],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1,  -1],
      [ -1, -1, -1, -1, -1, -1, -1, 146, -1, -1],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, 146],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [ -1, 88, -1, 107, 126, -1, -1, -1, 108, -1],
      [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ]

    const tileSize = 18;
    // Scale the layer to increase the size: height of game divided by size of tile times amount of rows
    const tileScale = sizes.height / (tileSize * tilemapArr.length);
    console.log(tileScale * 18)
    const totalSize = this.gameFramesAmount * sizes.width;
    const columnsNeeded = Math.ceil(totalSize / (tileSize * tileScale));

    for (let i = 0; i < columnsNeeded; i++) {
      this.addLandscapeTileColumn(tilemapArr);
    }

    // Create the tilemap from the 2D array
    this.obstaclesMap = this.make.tilemap({ data: tilemapArr, tileWidth: tileSize, tileHeight: tileSize });
    // Add the tileset image to the map
    const tileset = this.obstaclesMap.addTilesetImage('tiles');
    // Create a layer for the map, passing in the name of the tileset
    const obstaclesLayer = this.obstaclesMap.createLayer(0, tileset, 0, 0);
    
    obstaclesLayer.setScale(tileScale);
    // Enable collisions on the ground and obstacle layers, -1 is for excluding empty tiles
    obstaclesLayer.setCollisionByExclusion([-1]);
  }

  addLandscapeTileColumn(tilemapArr) {
    // 107: mushroom, 108: big mushroom, 128: tiny mushroom
    const surpriseObstacles = [107, 108, 128];

    tilemapArr.forEach((row, index) => {
      // if lowest level
      if (index === tilemapArr.length - 1) {
        row.push(2);
        // if second lowest level
      } else if (index === tilemapArr.length - 2) {
        // nur ein kleiner Teil des Bodens soll befüllt werden
        if (Math.random() > 0.8) {
          // wähle zufällig aus
          const randIndex = Math.floor(Math.random() * surpriseObstacles.length);
          row.push(surpriseObstacles[randIndex]);
        } else {
          row.push(-1);
        }
      } else {
        row.push(-1);
      }
    })
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
    // clear previous content
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
    // wie weit x gescrollt ist
    const camScrollX = this.cameras.main.scrollX;
    
    const usedXPositions = [];
    let imageIndex = 161; // Bild für die 1 auf dem spritesheet

    for (let i = 0; i < currentQuiz.answers.length; i++) {
      // wähle zufällige random position für x und y aus
      let obstacleY = Math.floor(Math.random() * sizes.height); 
      // let obstacleX = Math.floor(Math.random() * sizes.width);
      let obstacleX = camScrollX + sizes.width * Math.random(); 
      console.log("obstacleX", obstacleX);

      // falls zu nahe x position schon verwendet - generiere neu
      while(checkPositionOverlap(obstacleX)) {
        obstacleX = camScrollX + sizes.width * Math.random(); 
      }

      usedXPositions.push(obstacleX);
      
      let answerSurprise;
      // markiere Objekt mit richtiger Antwort
      if (currentQuiz.answers[i].correct) {
        answerSurprise = this.answerObjects.create(obstacleX, obstacleY, 'itemsSpriteSheet', 27).setScale(1.5).setOrigin(0.5, 0.5);
        answerSurprise.correct = true;
      } else {
        answerSurprise = this.answerObjects.create(obstacleX, obstacleY, 'spriteSheet', 8).setScale(1.5).setOrigin(0.5, 0.5);
        answerSurprise.correct = false;
      }
      const answerBackground = this.answerObjects.create(obstacleX, obstacleY, 'itemsSpriteSheet', 9).setScale(2).setOrigin(0.5, 0.5);
      const answerOption = this.answerObjects.create(obstacleX, obstacleY, 'itemsSpriteSheet', imageIndex).setScale(2).setOrigin(0.5, 0.5);
     
      // füge overlap detection hinzu
      this.physics.add.overlap(this.player, answerSurprise, (player, answerSurprise) => this.onCollideWithAnswer(player, answerSurprise, answerBackground, answerOption), null, this);
      // nächste Antwort kriegt nächstes Bild (sind in der tilemap aufsteigend sortiert)
      imageIndex++; 
    }

    function checkPositionOverlap(newXPosition) {
      for (let i = 0; i <= usedXPositions.length; i++) {
        let usedX = usedXPositions[i];
        // if within 50 px radius of existing one
        if (newXPosition >= usedX - 50 && newXPosition <= usedX + 50) {
          console.log(`${newXPosition} zu nah an ${usedX}`)
          return true;
        }
      }
      return false;
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
        x: 30,      
        y: 30,                
        duration: 2000 // Dauer der Animation in ms
      });

      // move to next level
     

      // sound should appear - reset physics reset camera (steige zum nächsten Level auf)
      // this.updateQuiz();
    } else {
      this.wrongAnswerSound.play();
      // entferne falsche Antwort
      console.log(answerOption)
      answerOption.destroy();
      answerBackground.destroy();
      
      // falls falsch signalisiere Punktabzug
      this.pointsLoseAnim.setVisible(true);
      this.pointsLoseAnim.play('lose_points');

      // verstecke das Sprite sobald animation fertig
      this.pointsLoseAnim.on('animationcomplete', () => {
        this.pointsLoseAnim.setVisible(false);
      });

    }
  }


}