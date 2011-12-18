define(function(require) {

var Entity = require('../libs/layers/scene/entity');

return function() {
  Entity.call(this);

  var self = this
      scene = null  
  ;

  self.id = function() { return 'info-display'; }

  var showInfo = function(info) {
    $('#infobox-text').text(info);
    $('#infobox').fadeIn("fast");
    setTimeout(function() {
      $('#infobox').fadeOut("show");
    }, 1000);
  };

  var onCheckpointReached = function() {
    showInfo("Checkpoint reached");
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.on('checkpoint-reached', onCheckpointReached);
  };

  self.on('addedToScene', onAddedToScene);

};

});
