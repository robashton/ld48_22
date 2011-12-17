define(function(require) {
var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(depth) {
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
  ;

  self.id = function() { return 'player'; }

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

  self.moveLeft = function() {
    if(velocity[0] > -2.0)
      velocity[0] -= 0.1;
  };

  self.moveRight = function() {
    if(velocity[0] < 2.0)
      velocity[0] += 0.1;
  };

  self.moveUp = function() {
    if(velocity[1] === 0)
      velocity[1] = -2.0;
  };

  var applyGravity = function() {
    velocity[1] += gravity;
  };

  var applyFriction = function() {
    velocity[0] *= friction;
    velocity[1] *= friction;
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
