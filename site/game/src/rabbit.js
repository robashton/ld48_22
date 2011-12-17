define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(depth) {
  Person.call(this, "rabbit", depth);

  var self = this
  ,   destx = 0
  ,   desty = 0
  ,   seeking = false
  ;

  self.setJumpHeight(-5.0);
  
  var oldTick = self.tick;
  self.tick = function() {
    oldTick();
    if(seeking)
      moveTowardsTarget();
  };

  var moveTowardsTarget = function() {
    var bounds = self.bounds();

    if(bounds.x > destx) {
      self.moveLeft();
      if(pointIsInWall(bounds.x - 5.0, bounds.y + (bounds.height / 2.0)))
        self.moveUp();
    }
    else {
      self.moveRight();  
      if(pointIsInWall(bounds.x + bounds.width + 5.0, bounds.y + (bounds.height / 2.0)))
        self.moveUp();
    }
    
    if(distanceFromTarget() < 30) {
      seeking = false;
      self.raise('reached-destination');
    }   
  };

  var pointIsInWall = function(x, y) {
   var level = scene.getEntity('current-level');
   return level.isPointInWall(x, y);
  };

  self.moveTo = function(x, y) {
    seeking = true;
    destx = x;
    desty = y;
  };

  var distanceFromTarget = function() {
    var bounds = self.bounds();
    var pOne = vec3.create([bounds.x + bounds.width / 2.0, bounds.y + bounds.height / 2.0, 0]);
    var pTwo = vec3.create([destx, desty, 0]);
    vec3.subtract(pTwo, pOne);
    return vec3.length(pTwo);
  };


  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
  };


  self.on('addedToScene', onAddedToScene);
};
});
