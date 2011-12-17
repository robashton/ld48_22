define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(depth) {
  Person.call(this, "player", depth);

  var self = this
  ,   hasGun = false
  ,   gunArmed = false
  ;

  self.notifyHasGun = function() {
    hasGun = true;
    self.raise('gun-picked-up');
  };

  self.armGun = function() {
    gunArmed = truel
  };

  self.fire = function() {

  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
  };

  self.on('addedToScene', onAddedToScene);
};
});
