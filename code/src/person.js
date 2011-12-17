define(function(require) {
var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(id, depth) {
  Entity.call(this);

  var self = this,
      scene = null
  ,   layer = null
  ,   renderable = null
  ,   position = vec3.create([0,0,0])
  ,   velocity = vec3.create([0,0,0])
  ,   friction = 0.98
  ,   gravity = 0.08
  ,   width = 20
  ,   height = 20
  ,   jumpHeight = -4.0
  ,   issolid = true
  ;

  self.id = function() { return id; }

  self.tick = function() {
    applyGravity();
    applyFriction();
    applyVelocity();
    applyMapBounds();
    updateRenderable();
  };

  self.setPosition = function(x, y) {
    position[0] = x;
    position[1] = y;
  };
  
  self.getPosition = function() {
    return position;
  };

  self.moveLeft = function() {
    if(velocity[0] > -2.0)
      velocity[0] -= 1.0;
  };

  self.moveRight = function() {
    if(velocity[0] < 2.0)
      velocity[0] += 1.0;
  };

  self.moveUp = function() {
    if(velocity[1] === 0)
      velocity[1] = jumpHeight;
  };

  self.bounds = function() {
    return {
      x: position[0],
      y: position[1],
      width: width,
      height: height
    }
  }

  self.issolid = function() {
    return issolid;
  };  

  self.notifyCollide = function(x, y, otherEntity) {
    if(x && otherEntity.issolid() && self.issolid()) {
      position[0] += x;
    }
  };

  self.setJumpHeight = function(height) {
    jumpHeight = height;
  };

  self.setSolidity = function(value) {
    issolid = value;
  };

  var applyGravity = function() {
    velocity[1] += gravity;
  };

  var applyFriction = function() {
    velocity[0] *= (friction * 0.7);
    velocity[1] *= friction;

    if(Math.abs(velocity[0]) < 0.01)
      velocity[0] = 0;
  };

  var applyVelocity = function() {
    position[0] += velocity[0];
    position[1] += velocity[1];
  };

  var updateRenderable = function() {
    renderable.position(position[0], position[1]);
  };

  var applyMapBounds = function() {
    scene.withEntity('current-level', function(level) {
      level.clip(position, velocity, width, height);
    });
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    addRenderable();
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get('img/player.png');
    material.setImage(texture);
    renderable = new Renderable(0,0, width, height, material);
    layer.addRenderable(renderable);
  };

  self.on('addedToScene', onAddedToScene);
};
});
