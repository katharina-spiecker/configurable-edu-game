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

    this.timedEvent = null;
    // where info is displayed
    this.textScore = null;
    this.textTime = null; // display remaining time here

    this.coinMusic = null;
    this.bgMusic = null;

    // get elements for displaying quiz and answers
    this.quizWrapperElement = document.getElementById("quiz");
    this.questionElement = document.getElementById("quiz-question");
    this.answersElement = document.getElementById("quiz-answers");
  }

  preload() {
    this.load.audio("coinMusic", "/assets/coin.mp3");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");

    // Lade tilemaps: Objekte, Hintergründe, Charaktere
    this.load.image('tiles', '../assets/kenney_pixel-platformer/Tilemap/tilemap_packed.png');
    this.load.image('tilesBg', '../assets/kenney_pixel-platformer/Tilemap/tilemap-backgrounds_packed.png');
    this.load.spritesheet('spriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap-characters_packed.png', {
      frameWidth: 24,  // Width of each character frame
      frameHeight: 24  // Height of each character frame
    });
  }

  create() {
    // how long the game should stretch in unit of screens (one game screen is sizes.with wide)
    // a question should last for 4 frames -> total frames = amount of questions times 4
    const quiz = this.registry.get("quiz");
    if (quiz && quiz.length > 0) {
      this.gameFramesAmount = quiz.length * 4;
    } else {
      this.gameFramesAmount = 10;
    }

    this.addPlayer();
    this.createTileBackground();
    this.createTileClouds();
    this.createTileLandscape();
    this.addQuiz();

    // add points to global point registry in order to access scene
    this.registry.set("points", 0);

    // for listening to moving left and right in update method
    this.cursor = this.input.keyboard.createCursorKeys();

    this.textScore = this.add.text(10, 10, "Punkte: 0", {font: "16px Arial", fill: "#000000"});

    this.textTime = this.add.text(sizes.width - 300, 10, "Remaining Time", {font: "16px Arial", fill: "#000000"});

    // music
    this.coinMusic = this.sound.add("coinMusic");
    this.bgMusic = this.sound.add("bgMusic");
    this.bgMusic.play();
  }

  update() {
    // let remainingTime = this.timedEvent.getRemainingSeconds();
    // this.textTime.setText(`Remaining time: ${Math.floor(remainingTime)}`);

    // bounce player up if too low
    if (this.player.y >= sizes.height - 90) {
      this.player.setVelocityY(-50);
    }
    
    if (this.cursor.up.isDown) {
      this.player.setVelocityY(-this.playerSpeedY);
    } else if (this.cursor.down.isDown) {
      this.player.setVelocityY(this.playerSpeedY)
    } else if (this.cursor.right.isDown) {
      this.player.setVelocityX(this.playerSpeedX * 3);
    } else {
      this.player.setVelocityX(this.playerSpeedX);
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

    this.player.setDepth(1);

    // macht collision box kleiner als player
    this.player.setSize(20, 20);

    // Geschwindigkeit mit der sich Player nach rechts bewegt
    this.player.setVelocityX(this.playerSpeedX);
    // Kamera folgt dem Spieler auf der x Achse. Verikale Position bleibt konstant
    this.cameras.main.startFollow(this.player, true, 1, 0, -150, 0);
    // setze Anfangsposition von Kamera oben links damit das gesamte Spiel sichtbar ist
    this.cameras.main.setScroll(0, 0); 
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
    const layer = map.createLayer(0, tileset, 0, 0);
    
    layer.setScale(tileScale);
    layer.setScrollFactor(0.5);
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
    const totalSize = this.gameFramesAmount * sizes.width;
    const columnsNeeded = Math.ceil(totalSize / (tileSize * tileScale));

    for (let i = 0; i < columnsNeeded; i++) {
      this.addLandscapeTileColumn(tilemapArr);
    }

    // Create the tilemap from the 2D array
    let obstaclesMap = this.make.tilemap({ data: tilemapArr, tileWidth: tileSize, tileHeight: tileSize });
    // Add the tileset image to the map
    const tileset = obstaclesMap.addTilesetImage('tiles');
    // Create a layer for the map, passing in the name of the tileset
    const obstaclesLayer = obstaclesMap.createLayer(0, tileset, 0, 0);
    
    obstaclesLayer.setScale(tileScale);
    // Enable collisions on the ground and obstacle layers, -1 is for excluding empty tiles
    obstaclesLayer.setCollisionByExclusion([-1]);
    // Enable collision between player and tilemap layers
    this.physics.add.collider(this.player, obstaclesLayer);
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

    let currentQuizIndex = 0;
    this.quizWrapperElement.style.display = "block";
    // setzte Anfangsquiz
    this.updateQuiz(currentQuizIndex, quiz);

    // adjust time, currently just short for testing
    let intervalId = setInterval(() => {
      currentQuizIndex++;
      if (currentQuizIndex === quiz.length) {
        clearInterval(intervalId);
        this.gameOver();
      } else {
        this.updateQuiz(currentQuizIndex, quiz);
      }
      
    }, 5000)
    
  }

  updateQuiz(currentQuizIndex, quiz) {
    const currentQuiz = quiz[currentQuizIndex];
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
    // Get the camera's current scroll position
    const camScrollX = this.cameras.main.scrollX;
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // Define the position within the visible screen
    const obstacleX = camScrollX + camWidth * 0.8; // 80% of the way across the visible area
    
    const usedPositions = [];
    for (let i = 0; i < currentQuiz.answers.length; i++) {
      let obstacleY = Math.floor(Math.random() * camHeight); // zufällige random position
      // todo to also take height of box into account - answers should not overlap
      while(usedPositions.includes(obstacleY)) {
        obstacleY = Math.floor(Math.random() * camHeight);
      }
      usedPositions.push(obstacleY);
      // Add an image (obstacle) at the calculated position
      const obstacle = this.add.image(obstacleX, obstacleY, 'spriteSheet', 12);
      obstacle.setScale(2);
      obstacle.setOrigin(0.5, 0.5); // Set the origin point if needed (center-bottom)
    }


    // let target1 = this.physics.add.sprite(400, 300, 'spriteSheet', 17).setOrigin(0, 0);
    // target1.body.setGravityY(0); 
    // target1.setVelocityX(-10);
    // let answer2 = this.physics.add.image(400, 300, 'spriteSheet', 20);
    // let answer3 = this.physics.add.image(400, 300, 'spriteSheet', 27);

    // this.physics.add.overlap(target1, this.player, this.targetHit, null, this);
    // TODO: dont use image use tiles in tilemap otherwise does not move towards left?
    // TODO: test
 
  }


}