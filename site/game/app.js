
define('libs/layers/render/material',[],function() {
  return function(r, g, b) {
    var self = this;
    var image = null;


    self.rgba = function() {
      return 'rgba(' + r + ', ' + g + ', ' + b + ', 255)'; 
    };

    self.scale = function(scaleFactor) {
      return new Material(
        parseInt(r * scaleFactor), 
        parseInt(g * scaleFactor), 
        parseInt(b * scaleFactor));
    };

    self.setImage = function(img) {
      image = img;
    };

    self.image = function() { return image ? image.get() : null; }
  };
});



define('libs/layers/render/canvasrenderstage',[],function() {
  return function (colourElement, depthElement, nearestPoint) {
    var self = this;

    var colourBuffer = null;
    var depthBuffer = null;

    var currentTranslation = [0,0];

    self.fillRect = function (x, y, z, rotation, width, height, material) {
      fillColourBuffer(x, y, z, rotation, width, height, material);
      fillDepthBuffer(x, y, z, rotation, width, height, material);
    };

    self.translate = function(x, y) {
      currentTranslation[0] = x;
      currentTranslation[1] = y;
    };

    var fillColourBuffer = function (x, y, z, rotation, width, height, material) {
      colourBuffer.fillStyle = material.rgba();
      applyTransforms(colourBuffer, x, y, rotation, width, height);

      if(material.image()) {
        colourBuffer.drawImage(material.image(), x, y, width, height);
      } else {
        colourBuffer.fillRect(x, y, width, height);
      }
      clearTransforms(colourBuffer);
    };

    var applyTransforms = function(ctx, x, y, rotation, width, height) {
      var middlex = x + (width / 2.0) - currentTranslation[0];
      var middley = y + (width / 2.0) -currentTranslation[1];
    
      ctx.save();
      ctx.translate(middlex, middley);
      ctx.rotate(rotation);
      ctx.translate(-middlex, -middley);
      ctx.translate(-currentTranslation[0], -currentTranslation[1]);
    };

    var clearTransforms = function(ctx) {
      ctx.restore();
    };

    var fillDepthBuffer = function (x, y, z, rotation, width, height, material) {
      if(!depthBuffer) return;
      var depthComponent = (z / nearestPoint);
      depthBuffer.globalAlpha = depthComponent;    

      if(material.image()) {
        depthBuffer.drawImage(material.image(), x, y, width, height);
      } else {
        depthBuffer.fillRect(x, y, width, height);
      }
    };

    var createBuffers = function () {
      colourBuffer = colourElement.getContext('2d');
      if(depthElement)
        depthBuffer = depthElement.getContext('2d');
    };

    createBuffers();
  };
});



define('libs/layers/render/rendertarget',[],function() {
  return function(gl, width, height) {
    var self = this;
    var width = width;
    var height = height;
    var rttFramebuffer = null;
    var rttTexture = null;
    var renderbuffer  = null;

    self.upload = function() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    };

    self.clear = function() {
     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    self.getTexture = function() {
      return rttTexture;
    };

    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  
  };
});



define('libs/layers/render/screenrendertarget',[],function() {
  return function(gl) {
    var self = this;

    self.upload = function() {
       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    self.clear = function() {};
    self.getTexture = function() { throw "Not supported"; }

  };
});




define('libs/layers/render/effect',[],function() {
  return function(gl, program) {
    var self = this;

    var aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    var aTextureCoords = gl.getAttribLocation(program, 'aTextureCoords');
    var uProjection = gl.getUniformLocation(program, 'uProjection');
    var uView = gl.getUniformLocation(program, 'uView');
    var uWorld = gl.getUniformLocation(program, 'uWorld');
    var uResolution = gl.getUniformLocation(program, 'uResolution');
    var uColourSampler = gl.getUniformLocation(program, 'uColourSampler');
    var uDepthSampler = gl.getUniformLocation(program, 'uDepthSampler');

    self.begin = function() {
      gl.useProgram(program);
    };  

    self.buffers = function(vertexBuffer, textureBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aVertexPosition);

      gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
      gl.vertexAttribPointer(aTextureCoords, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aTextureCoords);
    };

    self.camera = function(camera) {
      gl.uniformMatrix4fv(uProjection, false, camera.projection);
      gl.uniformMatrix4fv(uView, false, camera.view);
      gl.uniformMatrix4fv(uWorld, false, camera.world);
      gl.uniform2f(uResolution, false, camera.resolution);
    };

    self.inputTextures = function(inputColour, depth) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputColour);
      gl.uniform1i(uColourSampler, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depth);
      gl.uniform1i(uDepthSampler, 1);
    };

    self.render = function() {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
  };
});



define('libs/layers/render/effectbuilder',['./effect'], function(Effect) {
  return function(gl) {
    var self = this;
    var shaders = [];

    self.addVertexShaderFromElementWithId = function(id) {
      var vertexText = document.getElementById(id).innerText;
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexText);
      gl.compileShader(vertexShader);
      shaders.push(vertexShader);
      return self;
    };

    self.addFragmentShaderFromElementWithId = function(id) {
      var fragmentText = document.getElementById(id).innerText;
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentText);
      gl.compileShader(fragmentShader);
      shaders.push(fragmentShader);
      return self;
    };

    self.build = function() {
      var builtProgram = buildProgram();
      return new Effect(gl, builtProgram);
    }; 

    var buildProgram = function() {
      var program = gl.createProgram();

      for(var i = 0 ; i < shaders.length; i++)
        gl.attachShader(program, shaders[i]);

      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw "Couldn't create program";
      }
      return program;
    };

  };
});



define('libs/layers/render/webglrenderer',['./rendertarget', './screenrendertarget', './effectbuilder'], 
function(RenderTarget, ScreenRenderTarget, EffectBuilder) {
  return function (target, shaderFactory) {
    var self = this;

    var gl = null;
    var vertexBuffer = null;
    var textureBuffer = null;

    var renderWidth = 0;
    var renderHeight = 0;
    var camera = new Camera();

    var effects = [];

    var colourInput = null;
    var depthInput = null;
    var currentColourInput = null;
    var currentDepthInput = null;
    var memoryTargetOne = null;
    var memoryTargetTwo = null;
    var screenTarget = null;

    self.render = function (colourCanvas, depthCanvas) { 
      if(effects.length === 0)
        throw "No effects were specified before calling render!";

      fillTextureFromCanvas(colourInput, colourCanvas);
      fillTextureFromCanvas(depthInput, depthCanvas);

      currentColourInput = colourInput;
      currentDepthInput = depthInput;
      var currentRenderTarget = effects.length === 1 ? screenTarget : memoryTargetOne;

      for(var i = 0; i < effects.length; i++) {
        currentRenderTarget.upload();
        renderPass(effects[i]);
        currentRenderTarget.clear();

        if(i < effects.length - 1) {
          currentColourInput = currentRenderTarget.getTexture();
          currentRenderTarget = i === (effects.length-2) ? screenTarget : (currentRenderTarget === memoryTargetOne ? memoryTargetTwo : memoryTargetOne);       
        }
      }   
    };

    var renderPass = function(effect) {
      gl.viewport(0, 0, renderWidth, renderHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      camera.update(renderWidth, renderHeight);

      effect.begin();
      effect.buffers(vertexBuffer, textureBuffer);
      effect.camera(camera);
      effect.inputTextures(currentColourInput, currentDepthInput);
      effect.render();
    };

    var createBuffers = function () {
      createGlContext();
      createGeometry();
      createRenderTargets();
      setupInitialState();
    };

    var createRenderTargets = function() {
      colourInput = createTextureForCopyingInto();
      depthInput = createTextureForCopyingInto();
      memoryTargetOne = new RenderTarget(gl, renderWidth, renderHeight);
      memoryTargetTwo = new RenderTarget(gl, renderWidth, renderHeight);
      screenTarget = new ScreenRenderTarget(gl);
    };

    var setupInitialState = function () {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
    };

    var createGeometry = function () {
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

      textureBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadTextureCoords), gl.STATIC_DRAW);
    };

    self.addPass = function(builderFunction) {
      var builder = new EffectBuilder(gl);
      builderFunction(builder);
      var effect = builder.build();
      effects.push(effect);
    };

    var createTextureForCopyingInto = function() {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };

    var fillTextureFromCanvas = function (texture, canvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasElement);
    };

    var createGlContext = function () {
      gl = target.getContext("experimental-webgl", 
            { antialias: false });

      renderWidth = target.width;
      renderHeight = target.height;
    };

    var quadVertices = [
         0.0, 0.0, 0.0,
         1.0, 0.0, 0.0,
         0.0, 1.0, 0.0,
         1.0, 1.0, 0.0
    ];

    var quadTextureCoords = [
         0.0, 1.0,
         1.0, 1.0,
         0.0, 0.0,
         1.0, 0.0,
    ];

    createBuffers();
  };
});

define('libs/layers/render/webglrenderstage',['./webglrenderer'], function(WebglRenderer) {
  return function(target) {
    var self = this;

    var renderer = new WebglRenderer(target);

    renderer.addPass(function(builder) {
        builder
        .addVertexShaderFromElementWithId('shared-vertex')
        .addFragmentShaderFromElementWithId('depth-fragment');
    });

    self.renderScene = function(colour, depth) {
        renderer.render(colour, depth);
    };
  };
});

define('libs/layers/shared/eventcontainer',[],function() {
  return function() {
    var self = this;
    var handlers = [];

    self.raise = function(source, data) {
      for(var i = 0; i < handlers.length; i++)
        handlers[i].call(source, data);
    };
   
    self.add = function(handler) {
      handlers.push(handler);
    };

    self.remove = function(handler) {
      var newItems = [];
      for(var i = 0; i < handlers.length; i++)
          if(handlers[i] !== handler) 
            newItems.push(handlers[i]);
      handlers = newItems;
    };
  };
});


define('libs/layers/shared/eventable',['./eventcontainer'], function(EventContainer) {
  return function() {
    var self = this;
    var eventListeners = {};
    var allContainer = new EventContainer();

    self.on = function(eventName, callback) {
      eventContainerFor(eventName).add(callback);
    };

    self.off = function(eventName, callback) {
      eventContainerFor(eventName).remove(callback);
    }; 

    self.onAny = function(callback) {
      allContainer.add(callback);
    };

    self.raise = function(eventName, data) {
      var container = eventListeners[eventName];

      if(container)
        container.raise(self, data);

      allContainer.raise(self, {
        event: eventName,
        data: data
      });
    };

    var eventContainerFor = function(eventName) {
      var container = eventListeners[eventName];
      if(!container) {
        container =  new EventContainer();
        eventListeners[eventName] = container;
      }
      return container;
    };
  };
});


define('libs/layers/resources/texture',['../shared/eventable'], function(Eventable) {
  return function(url) {
    Eventable.call(this);  

    var self = this;
    var image = null;

    self.load = function() {
      image = new Image();
      image.onload = onInitialLoadCompleted;
      image.src = url;
    };


    self.get = function() {
      return image;
    };

    var onInitialLoadCompleted = function() {
      self.raise('loaded');
    };
  };
});



define('libs/layers/resources/texturehandler',['./texture'], function(Texture) {
  return function() {   
    var self = this;

    self.handles = function(url) {
      return url.indexOf('.png') > 0;
    };
    
    self.get = function(url) {
      return new Texture(url);
    };
  };
});



define('libs/layers/resources/sound',['../shared/eventable'], function(Eventable) {
  return  function(url) {
    Eventable.call(this);  

    var self = this;
    
    self.load = function() {
      var audio = new Audio(url);
      audio.loadeddata = onInitialLoadCompleted;
    };

    var onInitialLoadCompleted = function() {
      self.raise('loaded');
    };

    self.play = function(volume) {
      var audio = new Audio(url);
      audio.volume = volume;
      audio.play();
    };  
  };
});


define('libs/layers/resources/soundhandler',['./sound'], function(Sound) {
  return function() {
    var self = this;

    self.handles = function(path) {
      return path.indexOf('.wav') > 0;
    };

    self.get = function(path) {
      return new Sound(path);
    };
  };
});


define('libs/layers/resources/resourceloader',['../shared/eventable'], function(Eventable) {
  return function(handlers) {
    Eventable.call(this);

    var self = this,
        pendingResourceCount = 0;

    self.get = function(name) {
      var handler = findHandlerForResource(name);
      if(!handler) {
        console.error("Failed to find handler for resource: " + name);
      }
      return loadResourceFromHandler(handler, name);    
    };

    var loadResourceFromHandler = function(handler, name) {
      pendingResourceCount++;
      var resource = handler.get(name);
      resource.on('loaded', onResourceLoaded);
      resource.load();
      return resource;
    };

    var onResourceLoaded = function() {
      pendingResourceCount--;
      if(pendingResourceCount === 0)
        self.raise('all-resources-loaded');
    };

    var findHandlerForResource = function(name) {
      for(var i = 0; i < handlers.length; i++) {
        if(handlers[i].handles(name)) return handlers[i];
      }
      return null;
    };  
  };
});



define('libs/layers/scene/scene',['../shared/eventable'], function(Eventable) {
  return function(world, resources) {
   Eventable.call(this); var self = this;

    var layers = {};
    var entitiesById = {};
    var entitiesByIndex = [];
    self.resources = resources;

    self.addLayer = function(depth) {
      layers[depth] = world.addLayer(depth);
    };

    self.getLayer = function(depth) {
      return layers[depth];
    };

    self.addEntity = function(entity) {
      entitiesById[entity.id()] = entity;
      entitiesByIndex.push(entity);
      entity.setScene(self);
    };

    self.removeEntity = function(entity) {
      delete entitiesById[entity.id()];
      var newEntities = [];
      for(var i = 0 ; i < entitiesByIndex.length; i++)
        if(entitiesByIndex[i] !== entity) 
          newEntities.push(entitiesByIndex[i]);
      entitiesByIndex = newEntities;
      entity.clearScene();
    };

    self.getEntity = function(id, callback) {
      return entitiesById[id];
    };

    self.tick = function() {
       self.each(function(entity) {
          if(entity.tick) entity.tick();
       });
    };

    self.withEntity = function(id, callback) {
      var entity = entitiesById[id];
      if(entity) callback(entity);
    };

    self.eachLayer = function(callback) {
      for(var i in layers) {
        callback(layers[i]);
      }
    };

    self.each = function(callback) {
      for(var i = 0; i < entitiesByIndex.length; i++)
        callback(entitiesByIndex[i]);
    };

    self.crossEach = function(callback) {
      for(var i = 0; i < entitiesByIndex.length; i++) {
        for(var j = i; j < entitiesByIndex.length; j++) {
           if(i === j) continue;
           callback(i,j,entitiesByIndex[i], entitiesByIndex[j]);
        }
      }
    };
  };
});




define('libs/layers/render/layer',['require','../shared/eventable'],function(require) {
  var Eventable = require('../shared/eventable');

  return function (config) {
    Eventable.call(this);
    var self = this;
    var items = [];

    var depth = config.depth,
        distanceScaleFactor = config.distanceScaleFactor, 
        renderScaleFactor = config.renderScaleFactor,
        sceneWidth = config.sceneWidth,
        sceneHeight = config.sceneHeight,
        transformX = 0,
        transformY = 0;

    self.addRenderable = function (renderable) {
      items.push(renderable);
      renderable.setLayer(self);
    };

    self.removeRenderable = function(renderable) {
      var newItems = [];
      for(var i = 0; i < items.length; i++) {
          if(renderable !== items[i])
            newItems.push(items[i]);
      }
      items = newItems;
    };

    self.render = function (context) {
      context.translate(transformX * renderScaleFactor, transformY * renderScaleFactor);
      for (var i = 0; i < items.length; i++)
        renderItem(context, i);
      context.translate(0, 0);
    };

    self.getDepth = function() {
      return depth;
    };

    self.getRight = function() {
      return self.getWidth() + transformX;
    };

    self.getLeft = function() {
      return transformX;
    };

    self.getWidth = function() {
      return sceneWidth / distanceScaleFactor;
    };

    self.getHeight = function() {
      return sceneHeight / distanceScaleFactor;
    };

    self.getRenderScaleFactor = function() {
      return renderScaleFactor;
    };

    self.transformX = function(x) {
      transformX = x;
      self.raise('onTransformed', { x: x });
    };

    self.transformY = function(y) {
      transformY = y;
      self.raise('onTransformed', { y: y });
    };

    self.browserToGameWorld = function(points) {
      points[0] = transformX + (points[0] / renderScaleFactor);
      points[1] = transformY + (points[1] / renderScaleFactor);
      return points;
    };

    var renderItem = function (context, i) {
      var item = items[i];   
      item.render(context);
    };
  };
});


define('libs/layers/render/world',['./layer'], function(Layer) {
  return function (sceneWidth, sceneHeight, nearestPoint, renderScaleFactor) {
    var self = this;
    var layers = [];

    self.render = function (context) {
      for (var i = 0; i < layers.length; i++)
        layers[i].render(context);
    };

    self.addLayer = function(distance) {
      var distanceScaleFactor = distance / nearestPoint;
      var layer = new Layer({
        depth: distance,
        distanceScaleFactor: distanceScaleFactor,
        renderScaleFactor: distanceScaleFactor * renderScaleFactor,
        sceneWidth: sceneWidth,
        sceneHeight: sceneHeight
      });

      layers.push(layer);
      return layer;
    };
  };
});

define('libs/layers/render/renderengine',['./material', './world', './canvasrenderstage', './webglrenderstage'], 
  function(Material, World, CanvasRenderStage, WebglRenderStage) {

  return function(config) {     
    var self = this;

    var baseScaleFactor = config.colourElement.width / config.sceneWidth,     
        world = new World(config.sceneWidth, config.sceneHeight, config.nearestPoint, baseScaleFactor),
        backFillMaterial = new Material(config.backgroundColour.r, config.backgroundColour.g, config.backgroundColour.b),  
        canvasRenderStage = new CanvasRenderStage(config.colourElement, config.depthElement, config.nearestPoint),
        webglRenderStage = null;

    if(config.depthElement && config.glElement)
      webglRenderStage = new WebglRenderStage(config.glElement);

    self.render = function() {
      canvasRenderStage.fillRect(0, 0, 0, 0, config.colourElement.width, config.colourElement.height, backFillMaterial);
      world.render(canvasRenderStage);
      if(webglRenderStage)
        webglRenderStage.renderScene(config.colourElement, config.depthElement);
    };

    self.world = function() { return world; }
  };

});

define('libs/layers/render/renderenginebuilder',['./renderengine'], function(Engine) {

  return function(colourId, depthId, webglId) {
    var self = this;
    var config = {};
    
    self.nearestPoint = function(value) {
      config.nearestPoint = value;
      return self;
    };

    self.sceneWidth = function(value) {
      config.sceneWidth = value;
      return self;
    };

    self.sceneHeight = function(value) {
      config.sceneHeight = value;
      return self;
    };

    self.backgroundColour = function(r,g,b) {
      config.backgroundColour = { r: r, g: g, b: b };
      return self;
    };
    
    self.build = function() {    
      config.colourElement = document.getElementById(colourId);
      config.depthElement = document.getElementById(depthId);
      config.glElement = document.getElementById(webglId);
      config.sceneWidth = config.sceneWidth || colourElement.width;
      config.sceneHeight = config.sceneHeight || colourElement.height;
      config.backgroundColour = config.backgroundColour || { r: 0, g: 0, b: 0 }; 
      config.nearestPoint = config.nearestPoint || 8.0;
      return new Engine(config);
    };  
  };

});

define('libs/layers/driver',['require','./resources/texturehandler','./resources/soundhandler','./resources/resourceloader','./scene/scene','./render/renderenginebuilder','./shared/eventable'],function(require) {
  var TextureHandler = require('./resources/texturehandler');
  var SoundHandler = require('./resources/soundhandler');
  var ResourceLoader = require('./resources/resourceloader');
  var Scene = require('./scene/scene');
  var EngineBuilder = require('./render/renderenginebuilder');
  var Eventable = require('./shared/eventable');

  var findRequestAnimationFrame = function() {
    return window.requestAnimationFrame        || 
      window.webkitRequestAnimationFrame  || 
      window.mozRequestAnimationFrame     || 
      window.oRequestAnimationFrame       || 
      window.msRequestAnimationFrame      ||
      function(callback, element){
        window.setTimeout(callback, 1000 / 30);
      };
  };  

  return function() {
    Eventable.call(this);

    var self = this,
        requestAnimationFrame = findRequestAnimationFrame(),
        engine = null,
        scene = null,
        tickTimerId = null;

    self.start = function() {
     createAssets();
     startTimers();
     self.raise("started");
    };

    self.stop = function() {
     stopTimers();
     destroyAssets();
     self.raise("stopped");
    };

    self.scene = function() { return scene; }
    self.engine = function() { return engine; }

    var createAssets = function() {
        engine = new EngineBuilder('colour')
                  .nearestPoint(8.0)
                  .sceneWidth(640)
                  .sceneHeight(480)
                  .backgroundColour(10, 10, 150)
                  .build();

      var world = engine.world();
      var resources = new ResourceLoader([new TextureHandler(), new SoundHandler()]);
      scene = new Scene(world, resources);   
    };

    var destroyAssets = function() {
      engine = null;
      scene = null; 
      hud = null;
    };

    var startTimers = function() {
      tickTimerId = setInterval(doLogic, 1000 / 30);
      renderScene();
    };

    var doLogic = function() {
      scene.tick();
    };

    var renderScene = function() {
      if(engine === null) return;
      engine.render();
      requestAnimationFrame(renderScene);
    };
    
    var stopTimers = function() {
      clearInterval(tickTimerId);
      tickTimerId = null;
    };
  };

});

define('libs/layers/scene/entity',['../shared/eventable'], function(Eventable) {
  return function() {
    Eventable.call(this); var self = this;
    var scene = null;
    var eventListeners = {};

    self.setScene = function(nscene) {
      scene = nscene;
      raiseAddedToScene();
    };

    self.clearScene = function() {
      scene = null;
      raiseRemovedFromScene();
    };

    var raiseAddedToScene = function() {
      self.raise('addedToScene', {scene: scene });
    };

    var raiseRemovedFromScene = function() {
      self.raise('removedFromScene');
    };

    var onAnyEventRaised = function(data) {
      if(scene)
        scene.raise(data.event, data.data);
    };

    self.onAny(onAnyEventRaised);
  };
});


define('libs/layers/render/renderable',[],function() {
  return function(x, y, width, height, material) {
    var self = this;

    var rx = 0;
    var ry = 0;
    var z = 0;
    var rwidth = 0;
    var rheight = 0;
    var layer = null;
    var rotation = 0;

    self.setLayer = function(nlayer) {
      layer = nlayer;
      updateRenderCoords();
      updateRenderSize();
    };  

    self.position = function(nx, ny) {
      x = nx;
      y = ny;
      updateRenderCoords();
    };

    self.rotation = function(value) {
      rotation = value;
    };

    self.render = function(context) {
      context.fillRect(rx, ry, layer.getDepth(), rotation, rwidth, rheight, material);
    };

    var updateRenderCoords = function() {
      rx = x * layer.getRenderScaleFactor();
      ry = y * layer.getRenderScaleFactor();
    };

    var updateRenderSize = function() {
      rwidth = width * layer.getRenderScaleFactor();
      rheight = height * layer.getRenderScaleFactor();
    };
  };
});



define('src/person',['require','../libs/layers/scene/entity','../libs/layers/render/material','../libs/layers/render/renderable'],function(require) {
var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(id, depth) {
  Entity.call(this);

  var self = this,
      scene = null
  ,   layer = null
  ,   renderable = null
  ,   position = vec3.create([0,0,0])
  ,   velocity = vec3.create([0,0,0])
  ,   friction = 0.98
  ,   gravity = 0.08
  ,   speed = 1.0
  ,   maxSpeed = 2.0
  ,   width = 20
  ,   height = 20
  ,   jumpHeight = -4.0
  ,   issolid = true
  ,   physicsAdjust = vec3.create([0,0,0]);
  ;

  self.id = function() { return id; }

  self.tick = function() {
    applyGravity();
    applyFriction();
    applyVelocity();
    applyMapBounds();
    applyPhysics();
    updateRenderable();
  };

  self.setPosition = function(x, y) {
    position[0] = x;
    position[1] = y;
  };

  self.setMaxSpeed = function(value) {
    maxSpeed = value;
  };

  self.setSpeed = function(value) {
    speed = value;
  }
  
  self.getPosition = function() {
    return position;
  };

  self.moveLeft = function() {
    if(velocity[0] > -maxSpeed)
      velocity[0] -= speed;
    self.raise('turnLeft');
  };

  self.moveRight = function() {
    if(velocity[0] < maxSpeed)
      velocity[0] += speed;
    self.raise('turnRight');
  };

  self.moveUp = function() {
    if(velocity[1] === 0)
      velocity[1] = jumpHeight;
  };

  self.lookUp = function() {
    self.raise('turnUp');
  };

  self.lookDown = function() {
    self.raise('turnDown');
  };

  self.bounds = function() {
    return {
      x: position[0],
      y: position[1],
      width: width,
      height: height
    }
  }

  self.issolid = function() {
    return issolid;
  };  

  self.notifyCollide = function(x, y, otherEntity) {
    if(otherEntity.issolid() && self.issolid()) {
      if(x)
        physicsAdjust[0] += x;
      if(y) {
        physicsAdjust[1] += y;
      }
    }
  };

  self.setJumpHeight = function(height) {
    jumpHeight = height;
  };

  self.setSolidity = function(value) {
    issolid = value;
  };

  var applyGravity = function() {
    velocity[1] += gravity;
  };

  var applyFriction = function() {
    velocity[0] *= (friction * 0.7);
    velocity[1] *= friction;

    if(Math.abs(velocity[0]) < 0.01)
      velocity[0] = 0;
    if(Math.abs(velocity[1]) < 0.01)
      velocity[1] = 0;
  };

  var applyVelocity = function() {
    position[0] += velocity[0];
    position[1] += velocity[1];
  };

  var updateRenderable = function() {
    renderable.position(position[0], position[1]);
  };

  var applyMapBounds = function() {
    scene.withEntity('current-level', function(level) {
      level.clip(position, velocity, width, height);
    });
  };

  var applyPhysics = function() {
    if(physicsAdjust[0])
      position[0] += physicsAdjust[0];
    if(physicsAdjust[1]) {
      position[1] += physicsAdjust[1];
      if(physicsAdjust[1] < 0)
        velocity[1] = 0;
    }

    physicsAdjust[0] = 0;
    physicsAdjust[1] = 0;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    addRenderable();
  };

  var onRemovedFromScene = function() {
    layer.removeRenderable(renderable);
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get('img/player.png');
    material.setImage(texture);
    renderable = new Renderable(0,0, width, height, material);
    layer.addRenderable(renderable);
  };

  self.on('removedFromScene', onRemovedFromScene);
  self.on('addedToScene', onAddedToScene);
};
});

define('src/player',['require','../libs/layers/scene/entity','../libs/layers/render/material','./person'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(depth) {
  Person.call(this, "player", depth);

  var self = this
  ,   hasGun = false
  ,   gunArmed = false
  ,   direction = "right"
  ,   firingRate = 5
  ,   ticks = 0
  ;

  self.setMaxSpeed(3.0);
  self.setSpeed(1.5);

  var oldTick = self.tick;
  self.tick = function() {
    oldTick();
    ticks++;
  };

  self.notifyHasGun = function() {
    hasGun = true;
    self.raise('gun-picked-up');
  };

  self.armGun = function() {
    gunArmed = true
  };

  self.fire = function() {
    if(!gunArmed || !hasGun) return;
    if(ticks % firingRate !== 0) return;
    var bounds = self.bounds();    
    self.raise('fired', {
      sender: self.id(),
      x: bounds.x,
      y: bounds.y,
      direction: direction,
      size: 5
    });
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
  };

  var onEntityTurnedLeft = function() {
    direction = "left";
  };  

  var onEntityTurnedRight = function() {
    direction = "right";
  };

  var onEntityTurnedUp  =function() {
   direction = "up";
  };

  var onEntityTurnedDown  =function() {
   direction = "down";
  };
 
  
  self.on('addedToScene', onAddedToScene);
  self.on('turnLeft', onEntityTurnedLeft);
  self.on('turnRight', onEntityTurnedRight);
  self.on('turnUp', onEntityTurnedUp);
  self.on('turnDown', onEntityTurnedDown);
};
});

define('src/renderentity',['require','../libs/layers/scene/entity','../libs/layers/render/material','../libs/layers/render/renderable'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(id, imagePath, x, y, depth, width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   renderable = null
  ,   issolid = false
  ;

  self.id = function() { return id; }

  self.setSolidity = function(value) {
    issolid = value;
  }

  self.bounds = function() {
    return {
      x: x,
      y: y,
      width: width,
      height: height
    }
  }

  self.issolid = function() {
    return issolid;
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get(imagePath);
    material.setImage(texture);
    renderable = new Renderable(x, y, width, height, material);
    layer.addRenderable(renderable);
  };

  var removeRenderable = function() {
    layer.removeRenderable(renderable);
    renderable = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    addRenderable();
  };

  var onRemovedFromScene = function() {
    removeRenderable();
  };

  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);
};

});

define('src/pickup',['require','../libs/layers/scene/entity','../libs/layers/render/renderable','../libs/layers/render/material'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Renderable = require('../libs/layers/render/renderable')
var Material = require('../libs/layers/render/material');  

return function(id, texture, x,y, z, width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   renderable = null  
  ;

  self.id = function() {
    return id;
  };

  self.bounds = function() {
     return {
      x: x,
      y: y,
      width: width,
      height: height
     };
  };

  self.issolid = function() { return false; }

  self.notifyCollide = function(x, y, otherEntity) {
    if(otherEntity.id() !== 'player') return;
    otherEntity.notifyHasGun();
    self.raise('collected', { 
      pickup: self
    });
  };

  
  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(z);
    addRenderable();
  };

  var onRemovedFromScene = function() {
    removeRenderable();
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    material.setImage(scene.resources.get(texture));
    var renderable = new Renderable( x, y, width, height, material);
    layer.addRenderable(renderable);
  };

  var removeRenderable = function() {
    layer.removeRenderable(renderable);
    renderable = null;
  };

  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);
};


});

define('src/level',['require','../libs/layers/scene/entity','../libs/layers/render/material','../libs/layers/render/renderable','./renderentity','./pickup'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');
var RenderEntity = require('./renderentity');
var Pickup = require('./pickup');

return function(name) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   foregroundLayer = null
  ,   foregroundImages = {}
  ,   foregroundRenderables = {}
  ,   mapData = {}
  ,   levelWidth = 0
  ,   levelHeight = 0
  ,   numWidth = 0
  ,   numHeight = 0
  ,   chunkWidth = 0 
  ,   chunkHeight = 0
  ,   path = 'img/' + name + '/';
  ;

  self.id = function() {
    return "current-level";
  };

  self.clip = function(position, velocity, clipWidth, clipHeight) {
    clipLeft(position, velocity, clipWidth, clipHeight);
    clipRight(position, velocity, clipWidth, clipHeight);

    clipDown(position, velocity, clipWidth, clipHeight);
    clipUp(position, velocity, clipWidth, clipHeight);
  };

  self.isPointInWall = function(x, y) {
    return solidAt(parseInt(x),parseInt(y));
  };

  var clipRight = function(position, velocity, clipWidth, clipHeight) {
     var pointToTest = {
      x: parseInt(position[0] + clipWidth),
      y: parseInt(position[1] + (clipHeight / 2.0))
    };

    if(!solidAt(pointToTest.x + 1, pointToTest.y)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.x -= 1;
    }  
    position[0] = parseFloat(pointToTest.x) - clipWidth - 0.1;
    velocity[0] = -Math.abs(velocity[0] * 0.5);  
    
  };
  
  var clipLeft = function(position, velocity, clipWidth, clipHeight) {
     var pointToTest = {
      x: parseInt(position[0]),
      y: parseInt(position[1] + (clipHeight / 2.0))
    };

    if(!solidAt(pointToTest.x - 1, pointToTest.y)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.x += 1;
    }  
    position[0] = parseFloat(pointToTest.x) + 1.0;
    velocity[0] = Math.abs(velocity[0] * 0.5);
  };

  var clipUp = function(position, velocity, clipWidth, clipHeight) {
    var pointToTest = {
      x: parseInt(position[0] + (clipWidth / 2.0)),
      y: parseInt(position[1])
    };
    if(!solidAt(pointToTest.x, pointToTest.y - 1)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.y += 1;
    }  
    position[1] = parseFloat(pointToTest.y) + 1.0;
    velocity[1] = Math.abs(velocity[1] * 0.2);  
  };

  var clipDown = function(position, velocity, clipWidth, clipHeight) {
    var pointToTest = {
      x: parseInt(position[0] + (clipWidth / 2.0)),
      y: parseInt(position[1] + clipHeight)
    };

    if(!solidAt(pointToTest.x, pointToTest.y + 1)) return;

    while(solidAt(pointToTest.x, pointToTest.y)) {
      pointToTest.y -= 1;
    }
  
    position[1] = parseFloat(pointToTest.y) - clipHeight;
    velocity[1] = 0;   
  };

  var solidAt = function(x,y) {
    var i = parseInt(x / chunkWidth);
    var j = parseInt(y / chunkHeight);
    x = (x % chunkWidth);
    y = (y % chunkHeight);

    if(i < 0 || i >= numWidth || j < 0 || j >= numHeight) {
     return false;
    }
    
    return mapData[i + j * numWidth][x + y * chunkWidth] > 0; 
  };
 

  var onAddedToScene = function(data) {
    scene = data.scene;
    foregroundLayer = scene.getLayer(8.0);
    loadData();
  };

  var loadData = function() {
    $.get(path + name + '.png.rcm', function(data) {
      processData(data);
    });
  };

  var processData = function(data) {
    var lines = data.split('\n');
    levelWidth = parseInt(lines[1]);
    levelHeight = parseInt(lines[2]);
    numWidth = parseInt(lines[3]);
    numHeight = parseInt(lines[4]);

    chunkWidth = levelWidth / numWidth;
    chunkHeight = levelHeight / numHeight;

    loadChunks();    
  };

  var loadChunks = function() {
    var countWaiting = 0;
    for(var i = 0; i < numWidth; i++) {
      for(var j = 0; j < numHeight; j++) {
        countWaiting++;
        loadChunk(i, j, function() {
          countWaiting--;
          if(countWaiting === 0)
            createMapDataFromChunks();
        });
      }
    }
  };

  var loadChunk = function(i, j, callback) {
    var imgPath = path + name + '.png' + (i+1) + '-' + (j+1) + '.png';
    var image = scene.resources.get(imgPath);
    foregroundImages[j + i * numWidth] = image; 
    image.on('loaded', callback);   
  };

  var createMapDataFromChunks = function() {
    var memoryCanvas = document.createElement('canvas');
    memoryCanvas.setAttribute('width', chunkWidth);  
    memoryCanvas.setAttribute('height', chunkHeight); 
    var memoryContext = memoryCanvas.getContext('2d');

    for(var i = 0; i < numWidth; i++) {
      for(var j = 0; j < numHeight; j++) {        

        var texture = foregroundImages[i + j * numWidth].get();
        memoryContext.clearRect(0,0, chunkWidth, chunkHeight);
        memoryContext.drawImage(texture, 0, 0);

        var chunkData = new Array(chunkWidth * chunkHeight);
        for(var x = 0; x < chunkWidth; x++) {
          for(var y = 0; y < chunkHeight; y++) {
            var pixel = memoryContext.getImageData(x, y, 1, 1).data;
            chunkData[x + y * chunkWidth] = pixel[3];
          }
        }
        mapData[i + j * numWidth] = chunkData;
      }
    }
    createRenderables();
  };

  var createRenderables = function() {
    for(var i = 0; i < numWidth; i++) {
      for(var j = 0; j < numHeight; j++) {
        var material = new Material(255,255,255);
        material.setImage(foregroundImages[i + j * numWidth]);
        var renderable = new Renderable(i * chunkWidth , j * chunkHeight, chunkWidth, chunkHeight, material);
        foregroundLayer.addRenderable(renderable);   
        foregroundRenderables[i + j * numWidth] = renderable;      
      }
    }
    loadStaticObjects();        
  };

  var loadStaticObjects = function() {

    var entity = new RenderEntity('first_door', 'img/door.png', 103, 12, 8.0, 15, 30);
    entity.setSolidity(true);
    scene.addEntity(entity);

    entity = new RenderEntity('first_lever', 'img/lever_off.png', 40, 118, 8.0, 15, 15);
    scene.addEntity(entity);

    entity = new RenderEntity('second_lever', 'img/lever_off.png', 252, 42, 8.0, 15, 15);
    scene.addEntity(entity);

    entity = new RenderEntity('third_lever', 'img/lever_off.png', 405, 42, 8.0, 15, 15);
    scene.addEntity(entity);

    entity = new RenderEntity('first_wall', 'img/wall.png', 565, 30, 8.0, 10, 60);
    scene.addEntity(entity);

    entity = new Pickup('gun', 'img/gun-pickup.png', 723, 73, 8.0, 16, 16);
    scene.addEntity(entity);

    entity = new RenderEntity("energy_barrier", "img/energybarrier.png", 935, 30, 8.0, 15, 30);
    entity.setSolidity(true);
    scene.addEntity(entity);

    self.raise('loaded');
  };

  self.on('addedToScene', onAddedToScene);
};
});

define('src/controller',['require','../libs/layers/scene/entity'],function(require) {

var Entity = require('../libs/layers/scene/entity');

return function() {
  Entity.call(this); var self = this;

  var inputElement = document
  ,   scene = null
  ,   layer = null
  ,   impulseLeft = false
  ,   impulseRight = false
  ,   impulseUp = false
  ,   firing = false
  ,   lookUp = false
  ,   lookDown = false
  ;

  self.id = function() { return 'controller'; }

  self.tick = function() {
    scene.withEntity('player', function(player) {    
      if(impulseLeft) 
        player.moveLeft();
      if(impulseRight)
        player.moveRight();
      if(impulseUp)
        player.moveUp();
      if(lookUp)
        player.lookUp();
      if(lookDown)
        player.lookDown();
      if(firing)
        player.fire();
    });
  };

  var onKeyDown = function(e) {
    switch(e.keyCode) {
      case 32:
        impulseUp = true;
        break;
      case 37:
        impulseLeft = true;
        break;
      case 38:
        lookUp = true;
        break;
      case 39:
        impulseRight = true;
        break;
      case 40:
        lookDown = true;
        break;
      case 88:
        firing = true;
        break;
      default:
        return;
    }
    return false;
  };

  var onKeyUp = function(e) {
    switch(e.keyCode) {
      case 32:
        impulseUp = false;
        break;
      case 37:
        impulseLeft = false;
        break;
      case 38:
        lookUp = false;
        break;
      case 39:
        impulseRight = false;
        break;
      case 40:
        lookDown = false;
        break;
      case 88:
        firing = false;
        break;
      default:
        return;
    }
    return false;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(8.0);
  };

  inputElement.onkeydown = onKeyDown;
  inputElement.onkeyup  = onKeyUp;
  self.on('addedToScene', onAddedToScene);
};
});

define('src/layerscroller',['require','../libs/layers/scene/entity'],function(require) {

var Entity = require('../libs/layers/scene/entity');

return function(){
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   topLayer = null
  ;
    
  self.id = function() { return "scroller"; }
  
  self.tick = function() {
    scene.withEntity('player', function(player) {
    
      var position = player.getPosition();

      scrollx = position[0] - (topLayer.getWidth() / 2.0); 
      scrolly = position[1] - (topLayer.getHeight() / 2.0);

      scene.eachLayer(function(layer) {
        layer.transformX(scrollx);
        layer.transformY(scrolly);
      });

    });
  };


  var onAddedToScene = function(data) {
    scene = data.scene;
    topLayer = scene.getLayer(8.0);
  };
  
  self.on('addedToScene', onAddedToScene);  
};

});

define('src/messagedisplay',['require','../libs/layers/shared/eventable'],function(require) {

var Eventable = require('../libs/layers/shared/eventable');

// In case you're wondering.. BREAKFAST #2
return function() {
  Eventable.call(this);

  var self = this;

  self.setMessage = function(text) {
    $('#messagebox').fadeIn("slow");
    $('#messagebox-text').text(text);
  };
 
  var hideMessage = function(text) {
    $('#messagebox').fadeOut("fast", function(){
      self.raise('messageclosed');
    });
  };

  $('#messagebox-accept').click(hideMessage);

};

});

define('src/npc',['require','../libs/layers/scene/entity','../libs/layers/render/material','./person'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Person = require('./person');

return function(id, depth) {
  Person.call(this, id, depth);

  var self = this
  ,   destx = 0
  ,   desty = 0
  ,   seeking = false
  ,   lastBounds = null
  ;
  
  var oldTick = self.tick;
  self.tick = function() {

    if(seeking)
      moveTowardsTarget();

    oldTick();

    if(seeking) {
      var newBounds = self.bounds();

      if(Math.abs(lastBounds.x - newBounds.x) < 0.5)
        self.moveUp();
    
      lastBounds = newBounds; 
    }   
  };

  var moveTowardsTarget = function() {
    var bounds = self.bounds();

    if(bounds.x > destx) {
      self.moveLeft();
    }
    else {
      self.moveRight();  
    }
    
    if(distanceFromTarget() < bounds.width) {
      seeking = false;
      self.raise('reached-destination');
    }   
  };

  self.moveTo = function(x, y) {
    seeking = true;
    destx = x;
    desty = y;
    lastBounds = self.bounds();
  };

  var distanceFromTarget = function() {
    var bounds = self.bounds();
    var pOne = vec3.create([bounds.x + bounds.width / 2.0, bounds.y + bounds.height / 2.0, 0]);
    var pTwo = vec3.create([destx, desty, 0]);
    vec3.subtract(pTwo, pOne);
    return vec3.length(pTwo);
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
  };

  self.on('addedToScene', onAddedToScene);
};
});

define('src/rabbit',['require','./npc'],function(require) {

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

define('src/smashyman',['require','./npc'],function(require) {

var Npc = require('./npc');

return function(depth) {
  Npc.call(this, "rabbit", depth);
  var self = this;

  self.setJumpHeight(-4.0);
  self.setSolidity(true);

  self.notifyBulletHit = function() {
    self.raise('killed');
  };
};

});

define('src/storyteller',['require','./messagedisplay','../libs/layers/scene/entity','./rabbit','./renderentity','./smashyman','./npc'],function(require) {

var MessageDisplay = require('./messagedisplay');
var Entity = require('../libs/layers/scene/entity');
var Rabbit = require('./rabbit');
var RenderEntity = require('./renderentity');
var SmashyMan = require('./smashyman');
var Npc = require('./npc');

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
  ;

  self.id = function() { return 'storyteller' };
  self.tick = function() {
    for(var i in currentHooks)
      currentHooks[i]();
  };

  var onWorldReady = function() {
    addMessageDisplay();
    addSmashyManToScene();


    player = scene.getEntity('player');
    player.notifyHasGun();
    player.armGun();
    player.setPosition(800, 30);
    addEnemiesToScene();
    removeEntity('energy_barrier');
/*
    showMessage("I have been in this room since I can remember", PLAYER_AVATAR );
    showMessage("I am fed, I have somewhere to sleep and it is warm", PLAYER_AVATAR );
    showMessage("There is no exit, this is all I know", PLAYER_AVATAR );
    showMessage("I am... alone");
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
  };

  var addEnemiesToScene = function() {
    scene.withEntity('enemies', function(enemies) {
      enemies.generateEnemies();
    });
  };
  
  var moveEntityTo = function(entity, x, y, callback) {
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










define('src/collision',['require','../libs/layers/scene/entity'],function(require) {

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

    // Clip bottom
    if(one.x + (one.width / 2.0) > two.x && 
       one.x + (one.width / 2.0) < two.x + two.width &&
       one.y + one.height > two.y &&
       one.y + one.height < two.y + two.height) {

      intersectResult.y =  two.y - (one.y + one.height); // Return a negative value indicating the desired change
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

define('src/bullets',['require','../libs/layers/scene/entity','../libs/layers/render/material'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');

return function(depth, maxBullets) {
  Entity.call(this);

  var self = this
  ,   layer = null
  ,   scene = null  
  ,   bullets = []
  ,   ticks = 0
  ,   bulletMaterial = new Material(255,255,255)
  ;

  self.id = function() { return 'bullets'; }

  self.tick = function() {
    ticks++;
    updateBullets();
  };

  self.setLayer = function(ignored) {};

  self.render = function(context) {
    for(var i = 0 ; i < maxBullets; i++) {
      var bullet = bullets[i];
      if(!bullet.active) continue;
      context.fillRect(bullet.x * layer.getRenderScaleFactor(), bullet.y * layer.getRenderScaleFactor(), depth, 0, bullet.size, bullet.size, bulletMaterial);
    }
  };

  var updateBullets = function() {
    var level = scene.getEntity('current-level');

    for(var i = 0 ; i < maxBullets; i++) {
      var bullet = bullets[i];
      if(!bullet.active) continue;
      if(bullet.lifetime < (ticks - bullet.started)) {
        bullet.active = false;
        continue;
      }
      bullet.x += bullet.velx;
      bullet.y += bullet.vely;

      if(level.isPointInWall(bullet.x, bullet.y)) {
        bullet.active = false;
        continue;
      }
    
      scene.each(function(entity) {
        if(!entity.bounds) return;
        if(entity.id() === bullet.sender) return;

        var bounds = entity.bounds();
        if(bullet.x > bounds.x + bounds.width) return;
        if(bullet.y > bounds.y + bounds.height) return;
        if(bullet.x + bullet.size < bounds.x) return;
        if(bullet.y + bullet.size < bounds.y) return;
        
        bullet.active = false;
        self.raise('bullet-hit', {
          x: bullet.x,
          y: bullet.y        
        });          

        if(entity.notifyBulletHit) 
          entity.notifyBulletHit();    
      });  
    }
  };

  var onEntityFired = function(data) {
    addBulletToScene(data.x, data.y, data.sender, data.direction, data.size);
  };

  var addBulletToScene = function(x, y, sender, direction, size) {
    for(var i = 0 ; i < maxBullets; i++) {
      var bullet = bullets[i];
      if(bullet.active) continue;

      bullet.x = x;
      bullet.y = y;
      bullet.sender = sender;
      bullet.size = size;
      bullet.started = ticks;

      switch(direction) {
        case "left":
          bullet.velx = -10.0;
          bullet.vely = 0;
          break;
        case "right":
          bullet.velx = 10.0;
          bullet.vely = 0;
          break;
        case "down":
          bullet.velx = 0;
          bullet.vely = 10.0;
          break;
        case "up":
          bullet.velx = 0;
          bullet.vely = -10.0;
          break;
        default:
          return;
      }
      bullet.active = true;
      return;
    }
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    layer.addRenderable(self);
    scene.on('fired', onEntityFired);
    createInitialBullets();
  };

  var createInitialBullets = function() {
    for(var i = 0 ; i < maxBullets; i++) {
      bullets.push({
        active: false,
        id: i,
        x: 0,
        y: 0,
        size: 0,
        vely: 0,
        velx: 0,
        lifetime: 30,
        started: 0
      });
    };
  };

  self.on('addedToScene', onAddedToScene); 

};

});

define('src/enemy',['require','../libs/layers/scene/entity','../libs/layers/render/material','../libs/layers/render/renderable'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');


return function(id, imagePath, x , y , depth,  width, height) {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   renderable = null
  ,   position = vec3.create([x,y,0])
  ,   velocity = vec3.create([0,0,0])
  ,   speed = 1.5
  ;

  self.id = function() { return id; }

  self.tick = function() {
    scene.withEntity('player', function(player) {
      adjustTowardsEntity(player);
    });
    scene.withEntity('current-level', function(level) {
       level.clip(position, velocity, width, height);
    });
    applyVelocity();
    updateRenderable();
  };

  self.bounds = function() {
    return {
      x: position[0],
      y: position[1],
      width: width,
      height: height
    }
  }

  self.issolid = function() {
    return false;
  };

  self.notifyBulletHit = function() {
    self.raise('enemy-killed', {
      enemy: self
    });
  };

  var applyVelocity = function() {
    position[0] += velocity[0];
    position[1] += velocity[1];
  };  

  var updateRenderable = function() {
    renderable.position(position[0], position[1]);
  };

  var difference = vec3.create([0,0,0]);
  var adjustTowardsEntity = function(entity) {
    var otherBounds = entity.bounds();

    difference[0] = otherBounds.x - position[0];
    difference[1] = otherBounds.y - position[1];

    var distance = vec3.length(difference);
    if(distance < 400) {
      vec3.normalize(difference);
      if(canSeePlayer(difference, distance)) {
        velocity[0] = difference[0] * speed;
        velocity[1] = difference[1] * speed;
      } else
      {
        velocity[1] += (Math.random() * 0.2) - 0.1;
        velocity[1] *= 0.99;
      }
    }
  }; 

  var canSeePlayer = function(direction, distance) {
    var level = scene.getEntity('current-level');

    for(var i = 0.0; i < distance; i += 10.0) {
      var x = position[0] + direction[0] * i;
      var y = position[1] + direction[1] * i;
      if(level.isPointInWall(x, y))
        return false;
    } 
    return true;
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get(imagePath);
    material.setImage(texture);
    renderable = new Renderable(position[0], position[1], width, height, material);
    layer.addRenderable(renderable);
  };

  var removeRenderable = function() {
    layer.removeRenderable(renderable);
    renderable = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    addRenderable();
  };

  var onRemovedFromScene = function() {
    removeRenderable();
  };

  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);  
};

});

define('src/enemies',['require','../libs/layers/scene/entity','./enemy'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Enemy = require('./enemy');

  
return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   trackedEnemies = {}
  ;

  self.id = function() { return "enemies"; }

  self.generateEnemies = function() {
    removeExistingEnemies();
    addEnemiesRandomlyToScene();
  };

  var addEnemiesRandomlyToScene = function() {
    for(var i = 0 ; i < 300; i++) {
      var x = Math.random() * 1500;
      var y = (Math.random() * 900) + 300;
      var enemy = new Enemy('enemy-' + i, 'img/basicenemy.png', x , y , 8.0,  20, 20);
      trackedEnemies[enemy.id()] = enemy;
      scene.addEntity(enemy);      
    }
  };  

  var removeExistingEnemies = function() {
    for(var i in trackedEnemies) {
      scene.removeEntity(trackedEnemies[i]);
      delete trackedEnemies[i];
    };
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(8.0);
    scene.on('enemy-killed', onEnemyKilled);
  };

  var onRemovedFromScene= function() {
    removeExistingEnemies();
  };

  var onEnemyKilled = function(data) {
    var enemy = data.enemy;
    delete trackedEnemies[enemy.id()];
    scene.removeEntity(enemy);
  };
   
  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);
};    

});

define('src/world',['require','../libs/layers/scene/entity','./player','./level','./controller','./layerscroller','./storyteller','./collision','./bullets','./enemies'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Player = require('./player');
var Level = require('./level');
var Controller = require('./controller');
var Scroller = require('./layerscroller');
var StoryTeller = require('./storyteller');
var Collision = require('./collision');
var Bullets = require('./bullets');
var Enemies = require('./enemies');


return function() {
  Entity.call(this);

  var self = this
  ,   loadedLevel = null
  ,   scene = null
  ,   player = null
  ,   controls = null
  ,   scroller = null
  ,   story = null
  ,   collision = null
  ,   bullets = null
  ,   enemies = null
  ;

  self.id = function() { return 'world'; }

  self.loadLevel = function(path) {
    loadedLevel = new Level('main');
    scene.addEntity(loadedLevel);
    loadedLevel.on('loaded', onLevelLoaded);
  };

  self.unloadLevel = function() {
    if(loadedLevel) {
      scene.removeEntity(loadedLevel);
      loadedLevel = null;
    }
    removePlayer();    
    removeControls();
    removeScroller();
    removeStoryTeller();
    removeCollision();
    removeBullets();
    removeEnemies();
  };

  var onLevelLoaded = function() {
    addPlayer();
    addControls();
    addScroller();
    addStoryTeller();
    addCollision();
    addBullets();
    addEnemies();
    self.raise('ready');
  };
  
  var addPlayer = function() {
    player = new Player(8.0);
    player.setPosition(20, 20);
    scene.addEntity(player);
  };

  var addControls = function() {
    controls = new Controller();
    scene.addEntity(controls);
  };

  var removeControls = function() {
    scene.removeEntity(controls);
    controls = null;
  };

  var removePlayer = function() {
    scene.removeEntity(player);
    player = null;
  };
  
  var addScroller = function() {
    scroller = new Scroller();
    scene.addEntity(scroller);
  };

  var removeScroller = function() {
    scene.removeEntity(scroller);
    scroller = null;
  };

  var addStoryTeller = function() {
    story = new StoryTeller();
    scene.addEntity(story);
  };

  var removeStoryTeller = function() {
    scene.removeEntity(story);
    story = null;
  };

  var addCollision = function() {
    collision = new Collision();
    scene.addEntity(collision);
  };

  var removeCollision = function() {
    scene.removeEntity(collision);
    collision = null;
  };

  var addBullets = function() {
    bullets = new Bullets(8.0, 250);
    scene.addEntity(bullets);
  };

  var removeBullets = function() {
    scene.removeEntity(bullets);
    bullets = null;
  };

  var addEnemies = function() {
    enemies = new Enemies();
    scene.addEntity(enemies);
  };

  var removeEntities = function() {
    scene.removeEntity(enemies);
    enemies = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.addLayer(8.0);
  };

  self.on('addedToScene', onAddedToScene); 
};

}); 

define('src/pickupcontroller',[],function() {

return function(scene) {
  var self = this;

  var onPickupCollected = function(data) {
    var pickup = data.pickup;
    scene.removeEntity(pickup);
  }; 

  scene.on('collected', onPickupCollected);
};

});

define('src/game',['require','../libs/layers/driver','../libs/layers/shared/eventable','./world','./pickupcontroller'],function(require) {

var Driver = require('../libs/layers/driver');
var Eventable = require('../libs/layers/shared/eventable');
var World = require('./world');
var PickupController = require('./pickupcontroller');

return function() {
  Eventable.call(this); 

  var self = this
  ,   driver = new Driver()
  ,   pickupController = null
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

define('app',['require','./src/game'],function(require) {
  var Game = require('./src/game');

  var currentGame = null;

  var onGameReady = function() {
    $('#game-container').show();
    $('#loading').hide();
    $('#splash').hide();
  };

  var startGame = function() {
    $('#game-container').hide();
    $('#loading').show();
    $('#splash').hide();
    currentGame = new Game();
    currentGame.on('ready', onGameReady);
    currentGame.start();
  };

  var showInstructions = function() {
    
  };

  $(document).ready(function() {
    $('#game-container').hide();
    $('#loading').hide();
    $('#splash').show();

    $('#start-game').click(startGame);
    $('#instructions').click(showInstructions);
  });
 });
