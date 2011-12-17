define(function(require) {

var Npc = require('./npc');

return function(depth) {
  Npc.call(this, "rabbit", depth);
  var self = this;

  self.setJumpHeight(-4.0);
  self.setSolidity(true);
};

});
