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

    this.playerTileX = 0;
    this.obstaclesMap = null;
    this.obstaclesLayer = null;

    this.tilemapArr = [
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

    // 107: mushroom, 108: big mushroom, 128: tiny mushroom
    this.surpriseObstacles = [-1, -1, -1, 107, 108, 128, 127];

    this.coinMusic = null;
    this.bgMusic = null;

    // get elements for displaying quiz and answers
    this.quizWrapperElement = document.getElementById("quiz");
    this.questionElement = document.getElementById("quiz-question");
    this.answersElement = document.getElementById("quiz-answers");
  }

  /*

Phaser first calls the preload function which gives you the opportunity to preload any external asset you need. 
  */
  preload() {
    // used to load assets
    this.load.image("backgroundImage", "/assets/bg.png");
    this.load.image("basket", "/assets/basket.png");
    this.load.image("apple", "/assets/apple.png");
    this.load.audio("coinMusic", "/assets/coin.mp3");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");

    // Load tilemaps
    this.load.image('tiles', '../assets/kenney_pixel-platformer/Tilemap/tilemap_packed.png');
    this.load.image('tilesBg', '../assets/kenney_pixel-platformer/Tilemap/tilemap-backgrounds_packed.png');
    
    // Load the sprite sheet that contains all characters
    this.load.spritesheet('spriteSheet', '../assets/kenney_pixel-platformer/Tilemap/tilemap-characters_packed.png', {
      frameWidth: 24,  // Width of each character frame
      frameHeight: 24  // Height of each character frame
    });
  }

  create() {
    this.addPlayer();
    this.createTileBackground();
    this.createTileLandscape();
    this.addQuiz();

    // this.cameras.main.startFollow(this.player);

    // add points to global point registry in order to access scene
    this.registry.set("points", 0)

    // TODO: react if answer clicked this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);

    // for listening to moving left and right in update method
    this.cursor = this.input.keyboard.createCursorKeys();

    this.textScore = this.add.text(10, 10, "Punkte: 0", {font: "16px Arial", fill: "#000000"});

    this.textTime = this.add.text(sizes.width - 300, 10, "Remaining Time", {font: "16px Arial", fill: "#000000"});

    // music
    // this.coinMusic = this.sound.add("coinMusic");
    this.bgMusic = this.sound.add("bgMusic");
    this.bgMusic.play();

    this.time.addEvent({
      delay: 300, // Time in milliseconds (1000 ms = 1 second)
      callback: this.moveLandscape, // Function to call
      callbackScope: this, // Scope in which to call the function
      loop: true // Set to true to repeat the event
    });

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
    } else {
      this.player.setVelocityX(0);
      // this.player.setVelocityY(0);
    }
  }

  getRandomX() {
    return Math.floor(Math.random() * (sizes.width - 20));
  }

  targetHit() {
    this.repositionTarget();
    // update global points 
    this.registry.set('points', this.registry.get('points') + 1);

    this.textScore.setText(`Punkte: ${this.registry.get('points')}`);
    this.coinMusic.play();
  }

  // repositionTarget() {
  //   this.target.setY(0);
  //   this.target.setX(this.getRandomX());
  // }

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

    // Ensures the sprite will not move outside the game world's boundaries
    this.player.setCollideWorldBounds(true);
    // Set a bounce factor so the sprite bounces off the ground
    this.player.setBounce(0.3);

    // should not move when collided with by other objects
    this.player.setImmovable(true);

    this.player.setDepth(1);

    // making the outer bound smaller than the actual size
    this.player.setSize(20, 20);
  }

  createTileBackground() {
    const bgTilesArr = [
      [6, 7, 6],
      [14, 15, 14],
      [23, 23, 23]
    ]

    // create tilemap for background
    const bgMap = this.make.tilemap({data: bgTilesArr, tileWidth: 24, tileHeight: 24})

    const bgTileset = bgMap.addTilesetImage('tilesBg');
    const bgLayer = bgMap.createLayer(0, bgTileset, 0, 0);
    const bgScale = sizes.width / (24 * bgTilesArr.length)
    bgLayer.setScale(bgScale);
  }

  createTileLandscape() {
    
    // Create the tilemap from the 2D array
    this.obstaclesMap = this.make.tilemap({ data: this.tilemapArr, tileWidth: 18, tileHeight: 18 });
    // Add the tileset image to the map
    const tileset = this.obstaclesMap.addTilesetImage('tiles');
    // Create a layer for the map, passing in the name of the tileset
    this.obstaclesLayer = this.obstaclesMap.createLayer(0, tileset, 0, 0);
    // Scale the layer to increas the size
    const layer2Scale = sizes.width / (18 * this.tilemapArr.length);
    this.obstaclesLayer.setScale(layer2Scale);
    // Enable collisions on the ground and obstacle layers, -1 is for excluding empty tiles
    this.obstaclesLayer.setCollisionByExclusion([-1]);
    // Enable collision between player and tilemap layers
    this.physics.add.collider(this.player, this.obstaclesLayer);

  }

  // update tile layer: if player goes to right side, replace leftmost column with new tiles
    // move all tiles on to the left -> remove first column & add new column
  moveLandscape() {
    this.tilemapArr.forEach((row, index) => {
      // if lowest level
      if (index === this.tilemapArr.length - 1) {
        row.push(2);
        // if second lowest level
      } else if (index === this.tilemapArr.length - 2) {
        const randIndex = Math.floor(Math.random() * this.surpriseObstacles.length);
        row.push(this.surpriseObstacles[randIndex]);
      } else {
        // TODO randomly add platforms or empty tiles
        row.push(-1);
      }
      
      row.shift();
    })

    this.obstaclesLayer.putTilesAt(this.tilemapArr, 0, 0);
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
  }
}