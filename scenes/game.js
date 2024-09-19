import Phaser from 'phaser';
import { sizes, speedDown } from '../gameConfig';

export default class MainGame extends Phaser.Scene {
  constructor() {
    super("MainGame");
    this.player = null;
    this.cursor = null;
    // player should move a little faster than the apples falling down otherwise too hard to catch
    this.playerSpeed = speedDown + 50;
    this.target = null;
    this.points = 0;
    this.timedEvent = null;
    // where info is displayed
    this.textScore = null;
    this.textTime = null; // display remaining time here

    this.coinMusic = null;
    this.bgMusic = null;
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
  }

  create() {
    // this.scene.pause("scene-game");
    // adding an image to the canvas
    // 3 arguments
    // x: The x-coordinate where the image will be placed. In this case, it's 0, which is the leftmost position on the screen.
    // y: The y-coordinate where the image will be placed. Here, it's also 0, which is the topmost position on the screen.
    // key: identifies the image to be used. The image associated with this key must be preloaded in the preload() method
    // setOrigin makes sure the top left corner of the image is in the top left corner of the screen
    // per default the image was cut off, because the center of the image was positioned at the top left corner
    this.add.image(0, 0, "backgroundImage").setOrigin(0, 0);
    const startX = 0; // X position (left side of the screen)
    const startY = sizes.height - 100; // Y position (100 pixels from the bottom)
    this.player = this.physics.add.sprite(startX, startY, "basket");
    this.player.setOrigin(0, 0);
    // should not move when collided with by other objects
    this.player.setImmovable(true);
    // object will not fall downwards
    this.player.body.allowGravity = false;
    // Ensures the sprite will not move outside the game world's boundaries
    this.player.setCollideWorldBounds(true);
    // ensure that apple falls into basket not on it by making the outer bound which will trigger the win smaller
    this.player.setSize(80, 20);

    this.target = this.physics.add.image(0, 0, "apple").setOrigin(0, 0);
    this.target.setMaxVelocity(0, speedDown);

    this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);

    this.cursor = this.input.keyboard.createCursorKeys();

    this.textScore = this.add.text(0, 10, "Punkte: 0", {font: "25px Arial", fill: "#000000"});

    this.textTime = this.add.text(sizes.width - 300, 10, "Remaining Time", {font: "25px Arial", fill: "#000000"});
  
    this.timedEvent = this.time.delayedCall(3000, this.gameOver, [], this);

    this.coinMusic = this.sound.add("coinMusic");
    this.bgMusic = this.sound.add("bgMusic");
    this.bgMusic.play();
  
  }

  update() {
    let remainingTime = this.timedEvent.getRemainingSeconds();
    this.textTime.setText(`Remaining time: ${Math.floor(remainingTime)}`);

    const left = this.cursor.left;
    const right = this.cursor.right;

    // if apple has fallen too far
    if (this.target.y >= sizes.height) {
      this.repositionTarget();
    }

    if (left.isDown) {
      // negative value move body to the left
      this.player.setVelocityX(-this.playerSpeed);
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
  }

  getRandomX() {
    return Math.floor(Math.random() * (sizes.width - 20));
  }

  targetHit() {
    this.repositionTarget();
    this.points++;
    this.textScore.setText(`Punkte: ${this.points}`);
    this.coinMusic.play();
  }

  // ensures that target starts at the top at a random x position
  repositionTarget() {
    this.target.setY(0);
    this.target.setX(this.getRandomX());
  }

  gameOver() {
    this.sound.stopAll();
    this.scene.start('GameOver');
  }
}