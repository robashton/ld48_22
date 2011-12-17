define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(id, imagePath, x, y, depth, width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   renderable = null
  ,   issolid = false
  ;

  self.id = function() { return id; }

  self.setSolidity = function(value) {
    issolid = value;
  }

  self.bounds = function() {
    return {
      x: x,
      y: y,
      width: width,
      height: height
    }
  }

  self.issolid = function() {
    return issolid;
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get(imagePath);
    material.setImage(texture);
    renderable = new Renderable(x, y, width, height, material);
    layer.addRenderable(renderable);
  };

  var removeRenderable = function() {
    layer.removeRenderable(renderable);
    renderable = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    addRenderable();
  };

  var onRemovedFromScene = function() {
    removeRenderable();
  };

  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);
};

});
