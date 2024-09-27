import Phaser from 'phaser';
import { sizes } from '../gameConfig';

export default class MainGame extends Phaser.Scene {
  constructor() {
    super("MainGame");
    this.player = null;
    this.cursor = null;
    // player should move a little faster than the apples falling down otherwise too hard to catch
    this.playerSpeed = 300;
    this.target = null;

    this.timedEvent = null;
    // where info is displayed
    this.textScore = null;
    this.textTime = null; // display remaining time here

    this.obstaclesLayer = null;

    // 107: mushroom, 108: big mushroom, 128: tiny mushroom
    this.surpriseObstacles = [-1, -1, -1, 107, 108, 128, 127];

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
    // TODO make this dependent on amount of questions
    // how long the game should stretch in unit of screens (one game screen is sizes.with wide)
    this.gameFramesAmount = 10;

    this.addPlayer();
    this.createTileBackground();
    this.createTileLandscape();
    this.addQuiz();
    // just for testing
    this.addAnswerBoxes()

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

    this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);
  }

  update() {
    let remainingTime = this.timedEvent.getRemainingSeconds();
    this.textTime.setText(`Remaining time: ${Math.floor(remainingTime)}`);

    // bounce player up if too low
    if (this.player.y >= sizes.height - 90) {
      this.player.setVelocityY(-50);
    }

    
    if (this.cursor.up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (this.cursor.down.isDown) {
      this.player.setVelocityY(this.playerSpeed)
    } else if (this.cursor.right.isDown) {
      this.player.setVelocityX(80);
    }
  }

  gameOver() {
    this.sound.stopAll();
    this.scene.start('GameOver');
  }

  addPlayer() {
    this.player = this.physics.add.sprite(sizes.width / 3, 0, 'spriteSheet', 4); // Extract character at frame 1
    this.player.setOrigin(0.5, 0.5).setScale(3);

    this.anims.create({
      key: 'character1_walk',
      frames: this.anims.generateFrameNumbers('spriteSheet', { start: 4, end: 5 }),
      frameRate: 3,
      repeat: -1
    });

    // Play the animation for a specific character
    this.player.play('character1_walk');

    // Set a bounce factor so the sprite bounces off the ground
    this.player.setBounce(0.3);

    // should not move when collided with by other objects
    this.player.setImmovable(true);

    this.player.setDepth(1);

    // making the outer bound smaller than the actual size
    this.player.setSize(20, 20);

    // Geschwindigkeit mit der sich Player nach rechts bewegt
    this.player.setVelocityX(80);
    // Kamera folgt dem Spieler auf der x Achse. Verikale Position bleibt konstant
    this.cameras.main.startFollow(this.player, true, 1, 0, -150, 0);
    // setze Anfangsposition von Kamera oben links damit das gesamte Spiel sichtbar ist
    this.cameras.main.setScroll(0, 0); 
  }

  createTileBackground() {
    // green background
    // const tilemapArr = [
    //   [6, 7, 6],
    //   [14, 15, 14],
    //   [23, 23, 23]
    // ]

    const tilemapArr = [[],[],[]];

    const middleLayerSelection = [8, 9, 10];

    const tileSize = 24;
    // Scale the layer to increase the size: height of game divided by size of tile times amount of rows
    const tileScale = sizes.height / (tileSize * tilemapArr.length);
    const totalSize = this.gameFramesAmount * sizes.width;
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
    this.obstaclesLayer = obstaclesMap.createLayer(0, tileset, 0, 0);
    
    this.obstaclesLayer.setScale(tileScale);
    // Enable collisions on the ground and obstacle layers, -1 is for excluding empty tiles
    this.obstaclesLayer.setCollisionByExclusion([-1]);
    // Enable collision between player and tilemap layers
    this.physics.add.collider(this.player, this.obstaclesLayer);
  }

  addLandscapeTileColumn(tilemapArr) {
    tilemapArr.forEach((row, index) => {
      // if lowest level
      if (index === tilemapArr.length - 1) {
        row.push(2);
        // if second lowest level
      } else if (index === tilemapArr.length - 2) {
        const randIndex = Math.floor(Math.random() * this.surpriseObstacles.length);
        row.push(this.surpriseObstacles[randIndex]);
      } else {
        // TODO: you could add clouds
        // TODO randomly add platforms or empty tiles
        row.push(-1);
      }
    })
  }

  addQuiz() {
    const quiz = this.registry.get("quiz");
    if (!quiz || quiz.length == 0) {
      return;
    }

    let currentQuizIndex = 0;
    this.quizWrapperElement.style.display = "block";

    this.updateQuiz(currentQuizIndex, quiz);

    // adjust time, currently just short for testing
    let intervalId = setInterval(() => {
      currentQuizIndex++;
      if (currentQuizIndex === quiz.length) {
        clearInterval(intervalId);
        return;
      }
      
      this.updateQuiz(currentQuizIndex, quiz);
    }, 3000)
    
  }

  updateQuiz(currentQuizIndex, quiz) {
    // mapping for max 4 answers to show infront of answer
    const indexLetterMapping = {
      0: "a",
      1: "b",
      2: "c",
      3: "d"
    }
    
    const currentQuiz = quiz[currentQuizIndex];
    this.questionElement.innerText = currentQuiz.question;
    // clear previous content
    this.answersElement.innerText = "";
    // append answers
    for (let i = 0; i < currentQuiz.answers.length; i++) {
      const pElement = document.createElement("p");
      pElement.innerText = `${indexLetterMapping[i]}) ${currentQuiz.answers[i].text}`;
      this.answersElement.appendChild(pElement);
    }

    this.addAnswerBoxes();

  }

  addAnswerBoxes() {
    // Get the camera's current scroll position
    const camScrollX = this.cameras.main.scrollX;
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // Define the position within the visible screen
    const obstacleX = camScrollX + camWidth * 0.8; // 80% of the way across the visible area
    const obstacleY = camHeight - 100; // Fixed vertical position near the bottom

    // Add an image (obstacle) at the calculated position
    const obstacle = this.add.image(obstacleX, obstacleY, 'spriteSheet', 17);
    obstacle.setOrigin(0.5, 0.5); // Set the origin point if needed (center-bottom)


    // let target1 = this.physics.add.sprite(400, 300, 'spriteSheet', 17).setOrigin(0, 0);
    // target1.body.setGravityY(0); 
    // target1.setVelocityX(-10);
    // let answer2 = this.physics.add.image(400, 300, 'spriteSheet', 20);
    // let answer3 = this.physics.add.image(400, 300, 'spriteSheet', 27);

    // this.physics.add.overlap(target1, this.player, this.targetHit, null, this);
    // TODO: dont use image use tiles in tilemap otherwise does not move towards left?
    // TODO: test
    // this.obstaclesLayer.putTileAt(9, 7, 1);
 
  }


}