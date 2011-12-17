define(function(require) {

var Entity = require('../libs/layers/scene/entity');

return function() {
  Entity.call(this);

  var self = this
  ,   scene = null  
  ;

  self.id = function() { return "collision"; }

  self.tick = function() {
    scene.crossEach(function(i, j, entityOne, entityTwo) {
      if(!entityOne.bounds || !entityTwo.bounds) return;
      if(!entityOne.notifyCollide && !entityTwo.notifyCollide) return;

      var boundsOne = entityOne.bounds();
      var boundsTwo = entityTwo.bounds();     

      if(entityOne.notifyCollide) {
        var intersectResult = intersect(boundsOne, boundsTwo);
        if(!intersectResult.intersects) return;
        entityOne.notifyCollide(intersectResult.x, intersectResult.y, entityTwo);
      } 

      if(entityTwo.notifyCollide) {
        var intersectResult = intersect(boundsTwo, boundsOne);
        if(!intersectResult.intersects) return;
        entityTwo.notifyCollide(intersectResult.x, intersectResult.y, entityOne);
      }    
    });
  };

  var intersect = function(one, two ) {
    var intersectResult = {
      x: 0, y: 0, intersects: false
    };
    if(one.x > two.x + two.width) return intersectResult;
    if(one.y > two.y + two.height) return intersectResult;
    if(one.x + one.width < two.x) return intersectResult;
    if(one.y + one.height < two.y) return intersectResult;

    intersectResult.intersects = true;

    // Clip right
    if(one.x + one.width > two.x && 
       one.x + one.width < two.x + two.width &&
       one.y + (one.height / 2.0) > two.y &&
       one.y + (one.height / 2.0) < two.y + two.height) {
        
      intersectResult.x = two.x - (one.x + one.width); // Return a negative value indicating the desired change
      return intersectResult;     
    }
   
    // Clip left
    if(one.x > two.x && 
       one.x < two.x + two.width &&
       one.y + (one.height / 2.0) > two.y &&
       one.y + (one.height / 2.0) < two.y + two.height) {
        
      intersectResult.x = (two.x + two.width) - one.x;  // Return a positive valye indicating the desired change
      return intersectResult;     
    }

    // then top, then bottom (not relevant for the mo')
    return intersectResult;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
  };

  self.on('addedToScene', onAddedToScene);
};

});
