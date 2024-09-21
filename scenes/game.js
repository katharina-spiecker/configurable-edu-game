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
    this.createTileBackground();
    this.createTileLandscape();

    this.player = this.physics.add.sprite(80, sizes.height - 150, 'spriteSheet', 4); // Extract character at frame 1
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
    this.player.setBounce(0, 1);

    // should not move when collided with by other objects
    this.player.setImmovable(true);

    // add points to global point registry in order to access scene
    this.registry.set("points", 0)
    // this.add.image(0, 0, "tiles").setOrigin(0, 0);
  
    
    
    // // ensure that apple falls into basket not on it by making the outer bound which will trigger the win smaller
    // this.player.setSize(80, 20);

    // this.target = this.physics.add.image(0, 0, "apple").setOrigin(0, 0);
    // this.target.setMaxVelocity(0, speedDown);

    // this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);

    // for listening to moving left and right in update method
    this.cursor = this.input.keyboard.createCursorKeys();

    this.textScore = this.add.text(0, 10, "Punkte: 0", {font: "25px Arial", fill: "#000000"});

    this.textTime = this.add.text(sizes.width - 300, 10, "Remaining Time", {font: "25px Arial", fill: "#000000"});
  
    // this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);

    // music
    // this.coinMusic = this.sound.add("coinMusic");
    // this.bgMusic = this.sound.add("bgMusic");
    // this.bgMusic.play();
  
  }

  update() {
    // let remainingTime = this.timedEvent.getRemainingSeconds();
    // this.textTime.setText(`Remaining time: ${Math.floor(remainingTime)}`);

    // bounce player up if too low
    if (this.player.y >= sizes.height - 90) {
      this.player.setVelocityY(-this.playerSpeed);
    }

    if (this.cursor.right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else if (this.cursor.up.isDown) {
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
    const tilemapArr = [
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ],
      [ -1, -1, -1, -1, 1, 2, 3, -1, -1, -1 ],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ],
      [ -1, -1, -1, -1, -1, -1, -1, 1, 2, 3 ],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ],
      [ -1, -1, 88, 107, 126, -1, 107, 110, 108, -1 ],
      [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ]
    ]
    // Create the tilemap from the 2D array
    const map = this.make.tilemap({ data: tilemapArr, tileWidth: 18, tileHeight: 18 });
    // Add the tileset image to the map
    const tileset = map.addTilesetImage('tiles');
    // Create a layer for the map, passing in the name of the tileset
    const layer2 = map.createLayer(0, tileset, 0, 0);
    // Scale the layer to increas the size
    const layer2Scale = sizes.width / (18 * tilemapArr.length);
    layer2.setScale(layer2Scale);
  }
}