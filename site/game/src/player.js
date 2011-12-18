define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(depth) {
  Person.call(this, "player", depth);

  var self = this
  ,   hasGun = true
  ,   gunArmed = true
  ,   direction = "right"
  ;

  self.notifyHasGun = function() {
    hasGun = true;
    self.raise('gun-picked-up');
  };

  self.armGun = function() {
    gunArmed = true
  };

  self.fire = function() {
    var bounds = self.bounds();    
    self.raise('fired', {
      sender: self.id(),
      x: bounds.x,
      y: bounds.y,
      direction: direction,
      size: 5
    });
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
  };

  var onEntityTurnedLeft = function() {
    direction = "left";
  };  

  var onEntityTurnedRight = function() {
    direction = "right";
  };
    
  
  self.on('addedToScene', onAddedToScene);
  self.on('turnLeft', onEntityTurnedLeft);
  self.on('turnRight', onEntityTurnedRight);
};
});
