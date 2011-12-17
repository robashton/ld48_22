define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(foregroundPath, width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   foregroundLayer = null
  ,   foregroundImage = null
  ,   mapData = []
  ,   renderable = null
  ,   scalex = 0
  ,   scaley = 0
  ,   levelWidth = 0
  ,   levelHeight = 0
  ;

  self.id = function() {
    return "current-level";
  };

  self.clip = function(position, velocity, clipWidth, clipHeight) {
    clipDown(position, velocity, clipWidth, clipHeight);
  };

  var clipDown = function(position, velocity, clipWidth, clipHeight) {
    var levelCoords = convertToLevelCoords(position[0], position[1] + clipHeight);
    if(!solidAt(levelCoords.x, levelCoords.y)) return;

    while(solidAt(levelCoords.x, levelCoords.y)) {
      levelCoords.y -= 1;
    }
  
    var worldCoords = convertToWorldCoords(levelCoords.x, levelCoords.y);
    position[1] = worldCoords.y - clipHeight;
    velocity[1] = 0;   
  };

  var convertToWorldCoords = function(x, y) {
    return {
      x: x / scalex,
      y: y / scaley
    };
  };

  var convertToLevelCoords = function(x, y) {
    return {
      x: parseInt(x * scalex),
      y: parseInt(y * scaley)
    };
  };

  var solidAt = function(x,y) {
    return mapData[x + y * levelWidth] > 0; 
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    foregroundLayer = scene.getLayer(8.0);
    foregroundImage = scene.resources.get(foregroundPath);
    foregroundImage.on('loaded', onLevelLoaded);
    createRenderable();
  };

  var createRenderable = function() {
    var material = new Material(255,255,255);
    material.setImage(foregroundImage);
    renderable = new Renderable(0,0, width, height, material);
    foregroundLayer.addRenderable(renderable);
  };

  var onLevelLoaded = function() {
    var texture = foregroundImage.get(); 
    var memoryCanvas = document.createElement('canvas');
    memoryCanvas.setAttribute('width', texture.width);  
    memoryCanvas.setAttribute('height', texture.height); 
    var memoryContext = memoryCanvas.getContext('2d');
    memoryContext.drawImage(texture, 0, 0);

    mapData = new Array(texture.width * texture.height);
    scalex = texture.width / width;
    scaley = texture.height / height;
    levelWidth = texture.width;
    levelHeight = texture.height;

    for(var x = 0; x < texture.width; x++) {
      for(var y = 0; y < texture.height; y++) {
        var pixel = memoryContext.getImageData(x, y, 1, 1).data;
        mapData[x + y * texture.width] = 255 - pixel[0];
      }
    }
  };

  self.on('addedToScene', onAddedToScene);
};
});
