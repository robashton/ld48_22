define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(depth) {
  Person.call(this, "player", depth);

  var self = this;

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
  };

  self.on('addedToScene', onAddedToScene);
};
});
