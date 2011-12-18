define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(id, depth) {
  Person.call(this, id, depth);

  var self = this
  ,   destx = 0
  ,   desty = 0
  ,   seeking = false
  ,   lastBounds = null
  ,   speed = 5
  ;
  
  var oldTick = self.tick;
  self.tick = function() {

    if(seeking)
      moveTowardsTarget();

    oldTick();

    if(seeking)
      determineIfNeedsToJump(); 
  };

  var determineIfNeedsToJump = function() {
    if(self.hasPhysics()) {    
      var newBounds = self.bounds();

      if(Math.abs(lastBounds.x - newBounds.x) < 0.5)
        self.moveUp();
    
      lastBounds = newBounds; 
    }
  };

  var moveTowardsTarget = function() {
    var bounds = self.bounds();

    if(self.hasPhysics()) {      
      if(bounds.x > destx) {
        self.moveLeft();
      }
      else {
        self.moveRight();  
      }
    } else {
      var difference = vec3.create([destx - bounds.x, desty - bounds.y,0]);
      vec3.normalize(difference);
      self.setVelocity(speed * difference[0], speed * difference[1]);
    }
    
    if(distanceFromTarget() < bounds.width) {
      seeking = false;
      self.raise('reached-destination');
    }   
  };

  self.moveTo = function(x, y) {
    seeking = true;
    destx = x;
    desty = y;
    lastBounds = self.bounds();
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
