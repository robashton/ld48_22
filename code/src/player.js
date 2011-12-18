define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(depth) {
  Person.call(this, "player", depth);

  var self = this
  ,   hasGun = false
  ,   gunArmed = false
  ,   direction = "right"
  ,   firingRate = 5
  ,   ticks = 0
  ;

  self.setMaxSpeed(3.0);
  self.setSpeed(1.5);

  var oldTick = self.tick;
  self.tick = function() {
    oldTick();
    ticks++;
  };

  self.notifyHasGun = function() {
    hasGun = true;
    self.raise('gun-picked-up');
  };

  self.armGun = function() {
    gunArmed = true
  };

  self.fire = function() {
    if(!gunArmed || !hasGun) return;
    if(ticks % firingRate !== 0) return;
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

  var onEntityTurnedUp  =function() {
   direction = "up";
  };

  var onEntityTurnedDown  =function() {
   direction = "down";
  };
 
  
  self.on('addedToScene', onAddedToScene);
  self.on('turnLeft', onEntityTurnedLeft);
  self.on('turnRight', onEntityTurnedRight);
  self.on('turnUp', onEntityTurnedUp);
  self.on('turnDown', onEntityTurnedDown);
};
});
