define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');


return function(id, imagePath, x , y , depth,  width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   renderable = null
  ,   position = vec3.create([x,y,0])
  ,   velocity = vec3.create([0,0,0])
  ,   speed = 1.5
  ;

  self.id = function() { return id; }

  self.tick = function() {
    scene.withEntity('player', function(player) {
      adjustTowardsEntity(player);
    });
    scene.withEntity('current-level', function(level) {
       level.clip(position, velocity, width, height);
    });
    applyVelocity();
    updateRenderable();
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
    return false;
  };

  self.notifyBulletHit = function() {
    self.raise('enemy-killed', {
      enemy: self
    });
  };

  var applyVelocity = function() {
    position[0] += velocity[0];
    position[1] += velocity[1];
  };  

  var updateRenderable = function() {
    renderable.position(position[0], position[1]);
  };

  var difference = vec3.create([0,0,0]);
  var adjustTowardsEntity = function(entity) {
    var otherBounds = entity.bounds();

    difference[0] = otherBounds.x - position[0];
    difference[1] = otherBounds.y - position[1];

    var distance = vec3.length(difference);
    if(distance < 400) {
      vec3.normalize(difference);
      if(canSeePlayer(difference, distance)) {
        velocity[0] = difference[0] * speed;
        velocity[1] = difference[1] * speed;
      } else
      {
        velocity[1] += (Math.random() * 0.2) - 0.1;
        velocity[1] *= 0.99;
      }
    }
  }; 

  var canSeePlayer = function(direction, distance) {
    var level = scene.getEntity('current-level');

    for(var i = 0.0; i < distance; i += 10.0) {
      var x = position[0] + direction[0] * i;
      var y = position[1] + direction[1] * i;
      if(level.isPointInWall(x, y))
        return false;
    } 
    return true;
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get(imagePath);
    material.setImage(texture);
    renderable = new Renderable(position[0], position[1], width, height, material);
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
