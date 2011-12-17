
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



define('src/player',['require','../libs/layers/scene/entity','../libs/layers/render/material','../libs/layers/render/renderable'],function(require) {
var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

return function(depth) {
  Entity.call(this);

  var self = this,
      scene = null
  ,   layer = null
  ,   renderable = null
  ,   position = vec3.create([0,0,0])
  ,   velocity = vec3.create([0,0,0])
  ,   friction = 0.98
  ,   gravity = 0.08
  ,   width = 20
  ,   height = 20
  ,   jumpHeight = -4.0
  ;

  self.id = function() { return 'player'; }

  self.tick = function() {
    applyGravity();
    applyFriction();
    applyVelocity();
    applyMapBounds();
    updateRenderable();
  };

  self.setPosition = function(x, y) {
    position[0] = x;
    position[1] = y;
  };
  
  self.getPosition = function() {
    return position;
  };

  self.moveLeft = function() {
    if(velocity[0] > -2.0)
      velocity[0] -= 0.1;
  };

  self.moveRight = function() {
    if(velocity[0] < 2.0)
      velocity[0] += 0.1;
  };

  self.moveUp = function() {
    if(velocity[1] === 0)
      velocity[1] = jumpHeight;
  };

  var applyGravity = function() {
    velocity[1] += gravity;
  };

  var applyFriction = function() {
    velocity[0] *= friction;
    velocity[1] *= friction;
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

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    addRenderable();
  };

  var addRenderable = function() {
    var material = new Material(255,255,255);
    var texture = scene.resources.get('img/player.png');
    material.setImage(texture);
    renderable = new Renderable(0,0, width, height, material);
    layer.addRenderable(renderable);
  };

  self.on('addedToScene', onAddedToScene);
};
});

define('src/level',['require','../libs/layers/scene/entity','../libs/layers/render/material','../libs/layers/render/renderable'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');
var Renderable = require('../libs/layers/render/renderable');

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
    var i = parseInt((x / chunkWidth));
    var j = parseInt((y / chunkHeight));
    x = (x % chunkWidth);
    y = (y % chunkHeight);
    
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
    self.raise('loaded');   
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
    });
  };

  var onKeyDown = function(e) {
    switch(e.keyCode) {
      case 37:
        impulseLeft = true;
        break;
      case 38:
        impulseUp = true;
        break;
      case 39:
        impulseRight = true;
        break;
    }
  };

  var onKeyUp = function(e) {
    switch(e.keyCode) {
      case 37:
        impulseLeft = false;
        break;
      case 38:
        impulseUp = false;
        break;
      case 39:
        impulseRight = false;
        break;
    }
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

define('src/world',['require','../libs/layers/scene/entity','./player','./level','./controller','./layerscroller'],function(require) {

var Entity = require('../libs/layers/scene/entity');
var Player = require('./player');
var Level = require('./level');
var Controller = require('./controller');
var Scroller = require('./layerscroller');

return function() {
  Entity.call(this);

  var self = this
  ,   loadedLevel = null
  ,   scene = null
  ,   player = null
  ,   controls = null
  ,   scroller = null
  ;

  self.id = function() { return 'world'; }

  self.loadLevel = function(path) {
    loadedLevel = new Level('main');
    scene.addEntity(loadedLevel);
    addPlayer();
    addControls();
    addScroller();
  };

  self.unloadLevel = function() {
    if(loadedLevel) {
      scene.removeEntity(loadedLevel);
      loadedLevel = null;
    }
    removePlayer();    
    removeControls();
    removeScroller();
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

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.addLayer(8.0);
  };

  self.on('addedToScene', onAddedToScene); 
};

}); 

define('src/game',['require','../libs/layers/driver','../libs/layers/shared/eventable','./world'],function(require) {

var Driver = require('../libs/layers/driver');
var Eventable = require('../libs/layers/shared/eventable');
var World = require('./world');

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
   
    var world = new World();
    scene.addEntity(world); 
    world.loadLevel('irrelevant');
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

define('app',['require','./src/game'],function(require) {
  var Game = require('./src/game');
  var game = new Game();
  game.start();  
});
