define(function(require) {

var Particles = require('../libs/layers/components/particles');
var Entity = require('../libs/layers/scene/entity');  
var Material = require('../libs/layers/render/material');

return function() {
  Entity.call(this);

  var self = this
      scene = null
      particleEngine = null
  ;

  self.id = function() { return 'particle-emitter'; }

  var hookSceneEvents = function() {
    scene.on('enemy-killed', onEnemyKilled);
  };

  var onEnemyKilled = function(data) {
    var enemy = data.enemy;
    var bounds = enemy.bounds();
    self.raise('particles-emitted', {
      x: bounds.x + bounds.width / 2.0,
      y: bounds.y + bounds.height / 2.0,
      z: 8.0,
      id: 'enemy-killed'    
    });    
   };


  var createParticleSystem = function() {
    var config = {
      types: {
        'enemy-killed': {
          burst: 15,
          maxCount: 200,
          material: new Material(255,255,255),
          width: 5,
          height: 5
        }
      }
    };
    particleEngine = new Particles(8.0, config);
    scene.addEntity(particleEngine);
  };



  var onAddedToScene = function(data) {
    scene = data.scene;
    createParticleSystem();
    hookSceneEvents();
  };


  self.on('addedToScene', onAddedToScene);
};

});
