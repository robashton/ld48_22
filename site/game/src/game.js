define(function(require) {

var Driver = require('../libs/layers/driver');
var Eventable = require('../libs/layers/shared/eventable');
var World = require('./world');
var PickupController = require('./pickupcontroller');

return function() {
  Eventable.call(this); 

  var self = this
  ,   driver = new Driver()
  ,   pickupController = null;
  ;

  self.start = function() {
    driver.start();
  };

  self.stop = function() {
    driver.stop();
    self.raise('game-ended');
  };

  var populateScene = function() {
    var scene = driver.scene();  
   
    var world = new World();
    world.on('ready', onWorldReady);
    scene.addEntity(world);
    world.loadLevel('irrelevant');
    pickupController = new PickupController(scene);
  };

  var onDriverStarted = function() {
    populateScene();
  };

  var onDriverStopped = function() {
  
  };

  var onWorldReady = function() {
    self.raise('ready');
  };

  driver.on('started', onDriverStarted);
  driver.on('stopped', onDriverStopped);

};

});
