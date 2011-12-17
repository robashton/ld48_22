define(function(require) {
  var Driver = require('./libs/layers/driver');
  var Eventable = require('./libs/layers/shares/eventable');
  
  return function() {
    Eventable.call(this); 

    var self = this
    ,   driver = new Driver()
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
    };

    var onDriverStarted = function() {
      populateScene();
    };

    var onDriverStopped = function() {
    
    };

    driver.on('started', onDriverStarted);
    driver.on('stopped', onDriverStopped);

  };
});
