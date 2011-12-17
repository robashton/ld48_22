define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(path) {
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
  ;

  self.id = function() {
    return "current-level";
  };

  self.clip = function(position, velocity, clipWidth, clipHeight) {
    clipDown(position, velocity, clipWidth, clipHeight);
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
    $.get(path + 'imageSubdivide.xcf.rcm', function(data) {
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
    var imgPath = path + 'imageSubdivide.xcf' + (i+1) + '-' + (j+1) + '.png';
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
    self.raise('loaded');   
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
  };

  self.on('addedToScene', onAddedToScene);
};
});
