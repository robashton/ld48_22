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
  ;

  self.id = function() {
    return "current-level";
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

    for(var x = 0; x < texture.width; x++) {
      for(var y = 0; y < texture.height; y++) {
        var pixel = context.getImageData(x, y, 1, 1).data;
        mapData[x + y * texture.width] = pixel.r;
      }
    }
  };

  self.on('addedToScene', onAddedToScene);
};
});
