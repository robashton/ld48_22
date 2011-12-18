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
    scene.on('wizard-vanished', onWizardVanished);
    scene.on('wizard-appeared', onWizardAppeared);
    scene.on('collected', onPowerupCollected);
  };

  var onPowerupCollected = function(data) {
    var pickup = data.pickup;
    var bounds = pickup.bounds();
    self.raise('particles-emitted', {
      x: bounds.x + bounds.width / 2.0,
      y: bounds.y + bounds.height / 2.0,
      z: 8.0,
      id: 'powerup-collected'    
    });   
  };

  var onWizardAppeared = function(data) {
    self.raise('particles-emitted', {
      x: data.x,
      y: data.y,
      z: 8.0,
      id: 'wizard-magic'
    });
  };

  var onWizardVanished = function(data) {
    self.raise('particles-emitted', {
      x: data.x,
      y: data.y,
      z: 8.0,
      id: 'wizard-magic'
    });
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
        },
        'wizard-magic': {
          burst: 15,
          maxCount: 15,
          material: new Material(255,255,255),
          width: 15,
          height: 15
        },
        'powerup-collected': {
          burst: 15,
          maxCount: 15,
          material: new Material(255,255,255),
          width: 15,
          height: 15
        }
      }
    };

    config.types['enemy-killed'].material.setImage(scene.resources.get('img/enemyparticle.png'));
    config.types['wizard-magic'].material.setImage(scene.resources.get('img/wizardmagic.png'));
    config.types['powerup-collected'].material.setImage(scene.resources.get('img/powerupglow.png'));
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
