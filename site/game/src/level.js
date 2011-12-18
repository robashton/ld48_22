define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');
var RenderEntity = require('./renderentity');
var Pickup = require('./pickup');

return function(name) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   foregroundLayer = null
  ,   foregroundImages = {}
  ,   foregroundRenderables = {}
  ,   mapData = {}
  ,   levelWidth = 0
  ,   levelHeight = 0
  ,   numWidth = 0
  ,   numHeight = 0
  ,   chunkWidth = 0 
  ,   chunkHeight = 0
  ,   path = 'img/' + name + '/';
  ;

  self.id = function() {
    return "current-level";
  };

  self.clip = function(position, velocity, clipWidth, clipHeight) {
    clipLeft(position, velocity, clipWidth, clipHeight);
    clipRight(position, velocity, clipWidth, clipHeight);

    clipDown(position, velocity, clipWidth, clipHeight);
    clipUp(position, velocity, clipWidth, clipHeight);
  };

  self.isPointInWall = function(x, y) {
    return solidAt(parseInt(x),parseInt(y));
  };

  var clipRight = function(position, velocity, clipWidth, clipHeight) {
     var pointToTest = {
      x: parseInt(position[0] + clipWidth),
      y: parseInt(position[1] + (clipHeight / 2.0))
    };

    if(!solidAt(pointToTest.x + 1, pointToTest.y)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.x -= 1;
    }  
    position[0] = parseFloat(pointToTest.x) - clipWidth - 0.1;
    velocity[0] = -Math.abs(velocity[0] * 0.5);  
    
  };
  
  var clipLeft = function(position, velocity, clipWidth, clipHeight) {
     var pointToTest = {
      x: parseInt(position[0]),
      y: parseInt(position[1] + (clipHeight / 2.0))
    };

    if(!solidAt(pointToTest.x - 1, pointToTest.y)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.x += 1;
    }  
    position[0] = parseFloat(pointToTest.x) + 1.0;
    velocity[0] = Math.abs(velocity[0] * 0.5);
  };

  var clipUp = function(position, velocity, clipWidth, clipHeight) {
    var pointToTest = {
      x: parseInt(position[0] + (clipWidth / 2.0)),
      y: parseInt(position[1])
    };
    if(!solidAt(pointToTest.x, pointToTest.y - 1)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.y += 1;
    }  
    position[1] = parseFloat(pointToTest.y) + 1.0;
    velocity[1] = Math.abs(velocity[1] * 0.2);  
  };

  var clipDown = function(position, velocity, clipWidth, clipHeight) {
    var pointToTest = {
      x: parseInt(position[0] + (clipWidth / 2.0)),
      y: parseInt(position[1] + clipHeight)
    };

    if(!solidAt(pointToTest.x, pointToTest.y + 1)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.y -= 1;
    }
  
    position[1] = parseFloat(pointToTest.y) - clipHeight;
    velocity[1] = 0;   
  };

  var solidAt = function(x,y) {
    var i = parseInt((x / chunkWidth));
    var j = parseInt((y / chunkHeight));
    x = (x % chunkWidth);
    y = (y % chunkHeight);
    
    return mapData[i + j * numWidth][x + y * chunkWidth] > 0; 
  };
 

  var onAddedToScene = function(data) {
    scene = data.scene;
    foregroundLayer = scene.getLayer(8.0);
    loadData();
  };

  var loadData = function() {
    $.get(path + name + '.png.rcm', function(data) {
      processData(data);
    });
  };

  var processData = function(data) {
    var lines = data.split('\n');
    levelWidth = parseInt(lines[1]);
    levelHeight = parseInt(lines[2]);
    numWidth = parseInt(lines[3]);
    numHeight = parseInt(lines[4]);

    chunkWidth = levelWidth / numWidth;
    chunkHeight = levelHeight / numHeight;

    loadChunks();    
  };

  var loadChunks = function() {
    var countWaiting = 0;
    for(var i = 0; i < numWidth; i++) {
      for(var j = 0; j < numHeight; j++) {
        countWaiting++;
        loadChunk(i, j, function() {
          countWaiting--;
          if(countWaiting === 0)
            createMapDataFromChunks();
        });
      }
    }
  };

  var loadChunk = function(i, j, callback) {
    var imgPath = path + name + '.png' + (i+1) + '-' + (j+1) + '.png';
    var image = scene.resources.get(imgPath);
    foregroundImages[j + i * numWidth] = image; 
    image.on('loaded', callback);   
  };

  var createMapDataFromChunks = function() {
    var memoryCanvas = document.createElement('canvas');
    memoryCanvas.setAttribute('width', chunkWidth);  
    memoryCanvas.setAttribute('height', chunkHeight); 
    var memoryContext = memoryCanvas.getContext('2d');

    for(var i = 0; i < numWidth; i++) {
      for(var j = 0; j < numHeight; j++) {        

        var texture = foregroundImages[i + j * numWidth].get();
        memoryContext.clearRect(0,0, chunkWidth, chunkHeight);
        memoryContext.drawImage(texture, 0, 0);

        var chunkData = new Array(chunkWidth * chunkHeight);
        for(var x = 0; x < chunkWidth; x++) {
          for(var y = 0; y < chunkHeight; y++) {
            var pixel = memoryContext.getImageData(x, y, 1, 1).data;
            chunkData[x + y * chunkWidth] = pixel[3];
          }
        }
        mapData[i + j * numWidth] = chunkData;
      }
    }
    createRenderables();
  };

  var createRenderables = function() {
    for(var i = 0; i < numWidth; i++) {
      for(var j = 0; j < numHeight; j++) {
        var material = new Material(255,255,255);
        material.setImage(foregroundImages[i + j * numWidth]);
        var renderable = new Renderable(i * chunkWidth , j * chunkHeight, chunkWidth, chunkHeight, material);
        foregroundLayer.addRenderable(renderable);   
        foregroundRenderables[i + j * numWidth] = renderable;      
      }
    }
    loadStaticObjects();        
  };

  var loadStaticObjects = function() {

    var entity = new RenderEntity('first_door', 'img/door.png', 103, 12, 8.0, 15, 30);
    entity.setSolidity(true);
    scene.addEntity(entity);

    entity = new RenderEntity('first_lever', 'img/lever_off.png', 40, 118, 8.0, 15, 15);
    scene.addEntity(entity);

    entity = new RenderEntity('second_lever', 'img/lever_off.png', 252, 42, 8.0, 15, 15);
    scene.addEntity(entity);

    entity = new RenderEntity('third_lever', 'img/lever_off.png', 405, 42, 8.0, 15, 15);
    scene.addEntity(entity);

    entity = new RenderEntity('first_wall', 'img/wall.png', 565, 30, 8.0, 10, 60);
    scene.addEntity(entity);

    entity = new Pickup('gun', 'img/gun-pickup.png', 723, 73, 8.0, 16, 16);
    scene.addEntity(entity);

    entity = new RenderEntity("energy_barrier", "img/energybarrier.png", 935, 30, 8.0, 15, 30);
    scene.addEntity(entity);

    self.raise('loaded');
  };

  self.on('addedToScene', onAddedToScene);
};
});
