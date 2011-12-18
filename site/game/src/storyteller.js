define(function(require) {

var MessageDisplay = require('./messagedisplay');
var Entity = require('../libs/layers/scene/entity');
var Rabbit = require('./rabbit');
var RenderEntity = require('./renderentity');
var SmashyMan = require('./smashyman');
var Npc = require('./npc');
var Demon = require('./demon');
var Player = require('./player');

var PLAYER_AVATAR = "img/playeravatar.png";
var RABBIT_AVATAR = "img/rabbitavatar.png";
var SMASHY_AVATAR = "img/smashyavatar.png";
var WIZARD_AVATAR = "img/wizardavatar.png";

return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   world = null
  ,   messages = []
  ,   currentMessage = null
  ,   messageDisplay = null
  ,   currentWaiter = null
  ,   currentHooks = {}
  ,   player = null
  ,   playerHasGun = false
  ,   playerHasArmedGun = false
  ,   lastCheckpoint = 0
  ,   checkpoints = [
        [20, 20],
        [1513, 67],
        [97, 272],
        [1253, 553],
        [165, 562 ],
        [86, 1149]
  ]
  ;

  self.id = function() { return 'storyteller' };
  self.tick = function() {
    for(var i in currentHooks)
      currentHooks[i]();
    checkIfPlayerIsAtNextCheckpoint();
  };

  var onWorldReady = function() {
    addMessageDisplay();
    startGame();
    playerHasGun = true;
    playerHasArmedGun = true;
    player.notifyHasGun();
    player.armGun();
    player.setPosition(790, 1139);
    addEnemiesToScene();
    whenPlayerReaches(scene.getEntity('final_barrier'), tellPlayerToFightDemon);
  };

  var startGame = function(laughAtPunyHuman) {
    addSmashyManToScene();
    addPlayer();
/*
    if(laughAtPunyHuman) {
      showMessage("HAhahaah, if only it were so easy, back in your cage mortal.", WIZARD_AVATAR );
    } else { 
      showMessage("I have been in this room since I can remember", PLAYER_AVATAR );
      showMessage("I am fed, I have somewhere to sleep and it is warm", PLAYER_AVATAR );
      showMessage("There is no exit, this is all I know", PLAYER_AVATAR );
      showMessage("I am... alone"); 
    }

    onMessagesFinished(function() {
      setTimeout(addRabbitToScene, 2000);
    });  */
  };

  var rabbit = null;
  var addRabbitToScene = function() {
    rabbit = new Rabbit(8.0);
    rabbit.setPosition(90, 100);
    scene.addEntity(rabbit);
    setTimeout(tellPlayerHereToRescueHim, 500);
  };

  var smashyMan = null;
  var addSmashyManToScene = function() {
    smashyMan = new SmashyMan(8.0);
    smashyMan.setPosition(310, 110);
    scene.addEntity(smashyMan);
  };

  var tellPlayerHereToRescueHim = function() {
    showMessage("Hi, I am here to get you out", RABBIT_AVATAR);
    showMessage("What... what.... who are you?", PLAYER_AVATAR);
    showMessage("That doesn't matter, just come down here when I open the door", RABBIT_AVATAR);
    onMessagesFinished(moveRabbitToFirstLever);
  };

  var moveRabbitToFirstLever = function() {
    moveEntityTo(rabbit, 40, 118, openCellDoor);
  };

  var openCellDoor = function() {
    removeEntity("first_door");
    updateEntityState("first_lever", "open");
    whenPlayerReaches(rabbit, tellHimAboutThePlan);
  };  

  var tellHimAboutThePlan = function() {
    showMessage("Hi, my name is rabbit", RABBIT_AVATAR);
    showMessage("Will.. will you be my friend?", PLAYER_AVATAR);
    showMessage("Er.. sure, why not - I've never had a friend before", RABBIT_AVATAR);
    showMessage("Anyway, we need to get out of here - I don't know what is going on but I don't want to end up in a cell again.", RABBIT_AVATAR);
    onMessagesFinished(moveRabbitToSecondLever);   
  };

  var moveRabbitToSecondLever = function() {
    moveEntityTo(rabbit, 252, 40, tryPullLeverForBox);
  };

  var tryPullLeverForBox = function() {
    var player = scene.getEntity('player');
    if(player.bounds().x > 130) {
       showMessage("Hang on, get out of the way a second", RABBIT_AVATAR);
       onMessagesFinished(waitForPlayerToMoveOutWayOfFirstBox);   
    } else {
      pullLeverForFirstBox();
    }
  };

  var waitForPlayerToMoveOutWayOfFirstBox = function() {
    whenPlayerReaches(scene.getEntity('first_lever'), tryPullLeverForBox);
  };

  var pullLeverForFirstBox = function() {
    updateEntityState("second_lever", "open");
    addFirstBoxToScene();
    whenPlayerReaches(rabbit, rabbitAcknowledgeSmashyMan);
  };

  addFirstBoxToScene = function() {
    var box = new RenderEntity('first_box', 'img/box.png', 186, 110, 8.0, 30, 30);
    box.setSolidity(true);
    scene.addEntity(box);
  };

  rabbitAcknowledgeSmashyMan = function() {
    showMessage("Look, another person - you say hello and I'll hop up there and find the way out", RABBIT_AVATAR);
    moveEntityTo(rabbit, 405, 40, tryPullLeverForSecondBox);
    whenPlayerReaches(smashyMan, startConversationWithSmashyMan);
  }; 

  var startConversationWithSmashyMan = function() {
    showMessage("Will.. will you be my friend too?", PLAYER_AVATAR);
    showMessage("Rawr, ME SMASH THINGS AND BE FRIEND FOR YOU", SMASHY_AVATAR);
    showMessage("Er... thanks I think?", PLAYER_AVATAR);
    onMessagesFinished(moveSmashyManToBrickWall);
  };

  var tryPullLeverForSecondBox = function() {
    updateEntityState("third_lever", "open");
    addSecondBoxToScene();
  };
  
  var addSecondBoxToScene = function() {
    var box = new RenderEntity('second_box', 'img/box.png', 352, 104, 8.0, 30, 30);
    box.setSolidity(true);
    scene.addEntity(box);
  };

  var moveSmashyManToBrickWall = function() {
    moveEntityTo(smashyMan, 565, 60, smashBrickWall);
  };

  var smashBrickWall = function() {
    removeEntity('first_wall');
    moveEntityTo(rabbit, 690, 90, function(){});
    moveEntityTo(smashyMan, 670, 90, function(){});
  };

  var onGunPickedUp = function() {
    if(playerHasGun) return;
    playerHasGun = true;
    showMessage("Ooh, careful with that - it's a laser mega blaster 9000?", RABBIT_AVATAR);
    showMessage("ME SMASH YOU SHOOT, LETS GO", SMASHY_AVATAR);
    showMessage("Okay, let's get out of here", PLAYER_AVATAR);
    onMessagesFinished(moveNpcsToEnergyBarrier);
  };

  var moveNpcsToEnergyBarrier = function() {
    moveEntityTo(rabbit, 840, 64, function(){});
    moveEntityTo(smashyMan, 840, 64, talkAboutEnergyBarrier);
  };

  var talkAboutEnergyBarrier = function() {
    showMessage("If you could kindly smash through that for us mr smashy?", RABBIT_AVATAR);
    showMessage("ME NO SMASH THROUGH LIGHT, LIGHT HURT SMASHY", SMASHY_AVATAR);
    showMessage("I guess that's it, we have to give up", PLAYER_AVATAR);
    showMessage("All of that for nothing?!", RABBIT_AVATAR);
    showMessage("At least we met each other, I forgot what it was like to have friends", PLAYER_AVATAR);
    showMessage("SMASHY GET EMOTIONAL NOW", SMASHY_AVATAR);
    onMessagesFinished(spawnWizardBehindBarrier);
  };

  var wizard = null;
  var spawnWizardBehindBarrier = function() {
    wizard = new Npc("wizard", 8.0);
    wizard.setPosition(990, 40);
    scene.addEntity(wizard);
    setTimeout(tellPlayersAboutEvilPlan, 1000);
  };

  var tellPlayersAboutEvilPlan = function() {
    showMessage("Oh ho ho, what do we have here?", WIZARD_AVATAR);
    showMessage("Hello sir, would you mind helping us out?", RABBIT_AVATAR);
    showMessage("Helping you out? Ha Ha Ha - I'm the one who put you in here!", WIZARD_AVATAR);
    showMessage("Tell you what, I'll let the strongest of you run the gauntlet. You just have to kill the others and I'll lower the barrier", WIZARD_AVATAR);
    showMessage("NEVER!", RABBIT_AVATAR);
    showMessage("NEVER!", SMASHY_AVATAR);
    showMessage("...", PLAYER_AVATAR);
    showMessage("...", PLAYER_AVATAR);
    onMessagesFinished(letPlayerDecideWhatherToContinue);
  };

  var letPlayerDecideWhatherToContinue = function() {
    scene.withEntity('player', function(player) {
      player.armGun();
      playerHasArmedGun = true;
    });
    rabbit.on('killed', onRabbitKilled);
    smashyMan.on('killed', onSmashyManKilled);
  };

  var onRabbitKilled = function() {
    scene.removeEntity(rabbit);
    rabbit = null;
    onFriendyKilled();
  };

  var onSmashyManKilled = function() {
    scene.removeEntity(smashyMan);
    smashyMan = null;
    onFriendyKilled();
  };
  
  var onFriendyKilled = function() {
    if(smashyMan || rabbit) return;
    tellPlayerHeCanProceed();
  };

  var tellPlayerHeCanProceed = function() {
     showMessage("Bwahahaa, very well then - you may proceed now you are ALONE...", WIZARD_AVATAR);
     onMessagesFinished(takeDownBarrier);
  };

  var takeDownBarrier = function() {  
    removeEntity('energy_barrier');
    scene.removeEntity(wizard);
    wizard = null;
    addEnemiesToScene();
    whenPlayerReaches(scene.getEntity('final_barrier'), spawnWizardAgainToTellPlayerToFightDemon);
  };

  var spawnWizardAgainToTellPlayerToFightDemon = function() {
    wizard = new Npc("wizard", 8.0);
    wizard.setPosition(1990, 1060);
    scene.addEntity(wizard);
    setTimeout(tellPlayerToFightDemon, 1000);
  };

  var tellPlayerToFightDemon = function() {
    showMessage("Well you're an ambitious one aren't you?! Let's see if you can make it past my old friend here..", WIZARD_AVATAR);
    onMessagesFinished(spawnDemon);
  };

  var demon = null;
  var spawnDemon = function() {
    demon = new Demon(8.0);
    demon.setPosition(1053, 1030);
    scene.addEntity(demon);
    demon.on('killed', spawnWizardToCongratulate);
    scene.removeEntity(wizard);
    wizard = null;
  };

  var spawnWizardToCongratulate = function() {
    scene.removeEntity(demon);
    demon = null;
    wizard = new Npc("wizard", 8.0);
    wizard.setPosition(1990, 1060);
    scene.addEntity(wizard);
    setTimeout(congratulatePlayerOnKillingDemon, 1000);
  };

  var congratulatePlayerOnKillingDemon = function() {
    showMessage("Very well, you killed your friends, killed my friends, leave me alone and leave", WIZARD_AVATAR);
    onMessagesFinished(openFinalBarrier);
  };

  var openFinalBarrier = function() {
    removeEntity('final_barrier');  
    whenPlayerReaches(scene.getEntity('portal_to_leave'), restartAndGoBackToTheBeginningMwaHaHaHaHaHa);
  };

  var restartAndGoBackToTheBeginningMwaHaHaHaHaHa = function() {
   var level = scene.getEntity('current-level');
   level.reset();
   reset();
   startGame(true);
  };

  var reset = function() {
    if(wizard) {
      scene.removeEntity(wizard);
      wizard = null;    
    }
    if(player) {
      scene.removeEntity(player);
      player = null;
    }
    if(rabbit) {
      scene.removeEntity(rabbit);
      rabbit = null;
    }
    if(smashyMan) {
      scene.removeEntity(smashyMan);
      smashyMan = null;
    }
    if(demon) {
      scene.removeEntity(demon);  
      demon = null;
    }
    removeEntity('first_box');
    removeEntity('second_box');
    currentHooks = {};
    lastCheckpoint = 0;
  };

  var addPlayer = function() {
    player = new Player(8.0);
    player.setPosition(20, 20);
    scene.addEntity(player);
    player.on('player-death', onPlayerDied);
  };

  var onPlayerDied = function() {
    removePlayer();
    setTimeout(tellPlayerDeathIsNotTheEnd, 1000);
  };

  var tellPlayerDeathIsNotTheEnd = function() {
    showMessage("Hahaaha, I'll not allow *that* to happen mortal", WIZARD_AVATAR);
    onMessagesFinished(spawnPlayerAtLastCheckpoint);
  };

  var spawnPlayerAtLastCheckpoint = function() {
    var enemies = scene.getEntity('enemies');
    enemies.generateEnemies();
    addPlayer();
    
    if(playerHasGun)
      player.notifyHasGun();
    if(playerHasArmedGun) 
      player.armGun();

    player.setPosition(checkpoints[lastCheckpoint][0], checkpoints[lastCheckpoint][1]);
  };

  var removePlayer = function() {
    scene.removeEntity(player);
    player = null;
  };

  var removeEnemiesFromScene = function() {
    scene.withEntity('enemies', function(enemies) {
      enemies.removeAllEnemies();
    });
  };

  var addEnemiesToScene = function() {
    scene.withEntity('enemies', function(enemies) {
      enemies.generateEnemies();
    });
  };
  
  var moveEntityTo = function(entity, x, y, callback) {
    if(!entity) {
      console.warn('Move on entity that does not exist');
      return;
    }
    entity.moveTo(x, y);
    whenEntityReachesTarget(entity, callback);
  };

  var whenEntityReachesTarget = function(entity, callback) {
    var listener = function() {
      entity.off('reached-destination', listener);
      callback();
    };
    entity.on('reached-destination', listener);
  };

  var whenPlayerReaches = function(entity, callback) {
    currentHooks["player_reached_target"] = function() {
      var player = scene.getEntity('player');
      if(distanceBetweenEntities(entity, player) > 30) return;
      delete currentHooks["player_reached_target"];
      callback();
    };
  };
  
  var checkIfPlayerIsAtNextCheckpoint = function() {
    if(lastCheckpoint === checkpoints.length-1) return;
    if(!player) return;
    var bounds = player.bounds();
    var playerPoint = vec3.create([bounds.x + bounds.width / 2.0, bounds.y + bounds.height / 2.0, 0]);
    var checkPoint = vec3.create([checkpoints[lastCheckpoint+1][0],checkpoints[lastCheckpoint+1][1] , 0]);
    vec3.subtract(checkPoint, playerPoint);
    var distance = vec3.length(checkPoint);

    if(distance < 100) {
      self.raise('checkpoint-reached');
      lastCheckpoint += 1;
    }    
  };

  var distanceBetweenEntities = function(one, two) {
    if(!one.bounds || !two.bounds) { console.warn("Distance between entities without bounds"); return 0; }

    var boundsOne = one.bounds();
    var boundsTwo = two.bounds();
    
    var pOne = vec3.create([boundsOne.x + boundsOne.width / 2.0, boundsOne.y + boundsOne.height / 2.0, 0]);
    var pTwo = vec3.create([boundsTwo.x + boundsTwo.width / 2.0, boundsTwo.y + boundsTwo.height / 2.0, 0]);
    
    vec3.subtract(pTwo, pOne);
    return vec3.length(pTwo);
  };

  var updateEntityState = function(entity, newState) {
    console.warn("Not implemented");
  };

  var removeEntity = function(id) {
    var entity = scene.getEntity(id);
    if(entity)
      scene.removeEntity(entity);
  };

  var onMessagesFinished = function(callback) {
    currentWaiter = callback;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    world = scene.getEntity('world');
    world.on('ready', onWorldReady);
    hookPlayerEvents();
  };

  var hookPlayerEvents = function() {
    scene.on('gun-picked-up', onGunPickedUp);
  };

  var addMessageDisplay = function() {
    messageDisplay = new MessageDisplay();
    messageDisplay.on('messageclosed', onMessageClosed);
  };

  var showMessage = function(text) {
    messages.push({text: text});
    tryShowNextMessage();
  };

  var tryShowNextMessage = function() {
    if(currentMessage) return;
    if(messages.length === 0) return;

    currentMessage = messages.shift();
    messageDisplay.setMessage(currentMessage.text);
  };

  var onMessageClosed = function() {
    currentMessage = null;
    if(messages.length === 0) {
      if(currentWaiter) {
        var callback = currentWaiter;
        currentWaiter = null;
        callback();
      }  
    } else {
      tryShowNextMessage();
    }
  };
  
  self.on('addedToScene', onAddedToScene);
};

});
