define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Renderable = require('../libs/layers/render/renderable')
var Material = require('../libs/layers/render/material');  

return function(id, texture, x, y, z, width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   renderable = null  
  ;

  self.id = function() {
    return id;
  };

  self.bounds = function() {
     return {
      x: x,
      y: y,
      width: width,
      height: height
     };
  };

  self.issolid = function() { return false; }

  self.notifyCollide = function(x, y, otherEntity) {
    if(otherEntity.id() !== 'player') return;
    otherEntity.notifyHasGun();
    self.raise('collected', { 
      pickup: self
    });
  };

  
  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(z);
    addRenderable();
  };

  var onRemovedFromScene = function() {
    removeRenderable();
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    material.setImage(scene.resources.get(texture));
    renderable = new Renderable( x, y, width, height, material);
    layer.addRenderable(renderable);
  };

  var removeRenderable = function() {
    layer.removeRenderable(renderable);
    renderable = null;
  };

  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);
};


});
