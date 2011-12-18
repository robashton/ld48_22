define(function(require) {

var Npc = require('./npc');

return function(depth) {
  Npc.call(this, "rabbit", depth);
  var self = this;

  self.setJumpHeight(-5.0);
  self.setSolidity(true); 

  self.notifyBulletHit = function() {
    self.raise('killed');
  };

};
});
