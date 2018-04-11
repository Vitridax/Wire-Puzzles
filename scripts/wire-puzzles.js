let gameScene = new Phaser.Scene('Game');
      
let config = {
type: Phaser.AUTO, // Phaser will decide how to render (WebGL or Canvas)
width: 1280,
height: 720,
scene: gameScene,
pixelArt: true
};

let game = new Phaser.Game(config);


//set parameters
gameScene.init = function() {
    this.playerSpeed = 1.5;
    this.enemySpeed = 2;
    this.enemyMaxY = 280;
    this.enemyMinY = 80;
    this.tileScale = 4;
    this.tilePlaceCooldown = 20;
    this.timeSinceTilePlaced = this.tilePlaceCooldown;
    this.previousSelectedTilePos = {x: 0, y: 0};
}


//load game assets
gameScene.preload = function() {
    this.load.image('room tiles',           'images/wire-puzzle-tiles.png');
    this.load.image('powered wire tiles',   'images/powered-wire-tiles.png');
    this.load.image('unpowered wire tiles', 'images/unpowered-wire-tiles.png');
};


//executed once after preload. Used to set up game entities.
gameScene.create = function() {

    //camera controls
    let cam = this.cameras.main;
    cam.setBackgroundColor(0x555555);
    //         this.cameras.main.setZoom(4);
    //         this.cameras.main.setScroll(-config.width, -config.height);

    var cursors = this.input.keyboard.createCursorKeys();
    var qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    var eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    var controlConfig = {
        camera: this.cameras.main,
        left: cursors.left,
        right: cursors.right,
        up: cursors.up,
        down: cursors.down,
        speed: 0.5,
        zoomOut: qKey,
        zoomIn: eKey
    };

    this.camControls = new Phaser.Cameras.Controls.Fixed(controlConfig);

    //tilemap
    this.map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 10, height: 10 });

    var roomTiles = this.map.addTilesetImage('room tiles');
    var poweredWireTiles = this.map.addTilesetImage('powered wire tiles');
    var unpoweredWireTiles = this.map.addTilesetImage('unpowered wire tiles');

    var ground = this.map.createBlankDynamicLayer('ground', roomTiles);
    var wires = this.map.createBlankDynamicLayer('wires', poweredWireTiles);
    ground.fill(0);

    this.mapScaleGroup = this.add.group();
    this.mapScaleGroup.add(ground);
    this.mapScaleGroup.add(wires);
    Phaser.Actions.ScaleXY(this.mapScaleGroup.getChildren(), this.tileScale, this.tileScale);

    this.marker = this.add.graphics();
    this.marker.lineStyle(3, 0x000000, 1);
    this.marker.strokeRect(0, 0, this.map.tileWidth*(this.tileScale+1), this.map.tileHeight*(this.tileScale+1));

};


gameScene.update = function(time, delta) {

    this.camControls.update(delta);

    var mousePos = this.input.activePointer.positionToCamera(this.cameras.main);
    //get world coords of tile mouse is in.
    var mouseTileX = this.map.worldToTileX(mousePos.x);
    var mouseTileY = this.map.worldToTileY(mousePos.y);
    this.marker.x = this.map.tileToWorldX(mouseTileX);
    this.marker.y = this.map.tileToWorldY(mouseTileY);

    if(this.previousSelectedTilePos.x != mouseTileX || this.previousSelectedTilePos.y != mouseTileY) this.timeSinceTilePlaced = this.tilePlaceCooldown;
    this.previousSelectedTilePos.x = mouseTileX;
    this.previousSelectedTilePos.y = mouseTileY;

    //place wire
    if (this.input.manager.activePointer.isDown && this.timeSinceTilePlaced >= this.tilePlaceCooldown) {
    //           console.log(this.map.getTileAt(mouseTileX, mouseTileY));
        this.toggleWireAt(mouseTileX, mouseTileY);
        this.timeSinceTilePlaced = 0;
    }
    this.timeSinceTilePlaced += 1;
};

gameScene.toggleWireAt = function(x, y) {
    if (this.map.getTileAt(x, y) != null) this.map.putTileAt(-1, x, y);
    else this.map.putTileAt(0, x, y);
    this.updateWireAt(x, y);
    this.updateWireAt(x+1, y);
    this.updateWireAt(x-1, y);
    this.updateWireAt(x, y+1);
    this.updateWireAt(x, y-1);
};

gameScene.updateWireAt = function(x, y) {
    if (this.map.getTileAt(x, y) === null) return;
    
    var tileDirs = {
    '': 0,
    'N': 1,   'S': 1,    'NS': 1,
    'E': 2,   'W': 2,    'EW': 2,
    'ES': 3,  'ESW': 4,  'SW': 5,
    'NES': 6, 'NESW': 7, 'NSW': 8,
    'NE': 9,  'NEW': 10, 'NW': 11
    }
    
    var neighborWires = '';
    if (this.map.getTileAt(x, y-1) != null) neighborWires += 'N';
    if (this.map.getTileAt(x+1, y) != null) neighborWires += 'E';
    if (this.map.getTileAt(x, y+1) != null) neighborWires += 'S';
    if (this.map.getTileAt(x-1, y) != null) neighborWires += 'W';
    
    var tileId = tileDirs[neighborWires];
    if (tileId == undefined) tileId = 0;
    
    this.map.putTileAt(tileId, x, y);
};