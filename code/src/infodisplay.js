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
    }, 3000);
  };

  var onCheckpointReached = function() {
    showInfo("Checkpoint reached");
  };

  var onArrowKeysNeeded = function() {
    showInfo("Use the ARROW KEYS to move around");
  };

  var onJumpKeysNeeded = function() {
    showInfo("Use the SPACEBAR to jump");
  };
  

  var onGunKeysNeeded = function() {
    showInfo("Use 'X' to shoot the gun");
  };  

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.on('checkpoint-reached', onCheckpointReached);
    scene.on('arrow-keys-needed', onArrowKeysNeeded);
    scene.on('jump-keys-needed', onJumpKeysNeeded);
    scene.on('gun-keys-needed', onGunKeysNeeded);
  };

  self.on('addedToScene', onAddedToScene);

};

});
