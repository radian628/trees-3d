let loadAsset = makeAssetLoader();



let keyboard = createKeyHandler();


let player = {
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  rotation: [0, 1, 0, 0],
  smoothness: 0.9
};
let mousePos = { x: 0, y: 0 };
document.addEventListener("mousemove", e => {
  mousePos = {
    x: e.clientX,
    y: e.clientY
  };
  let xRotation = quatAngleAxis(e.movementX * 0.01, vectorQuaternionMultiply(player.rotation, [0, 1, 0]));
  let yRotation = quatAngleAxis(e.movementY * 0.01, vectorQuaternionMultiply(player.rotation, [1, 0, 0]));

  //let rotations = scalarMultiply(player.rotation, rmSettings.values.cameraSmoothness);

  player.rotation = quatMultiply(xRotation, player.rotation);
  player.rotation = quatMultiply(yRotation, player.rotation);
  player.rotation = normalize(player.rotation);
});





(async () => {
  let c = document.getElementById("canvas");
  let gl = c.getContext("webgl2", { antialias: 0 });
  if (!gl.getExtension("EXT_float_blend")) alert("Missing extension EXT_float_blend!");
  if (!gl.getExtension("EXT_color_buffer_float")) alert("Missing extension EXT_color_buffer_float!");

    
  c.requestPointerLock = c.requestPointerLock ||
  c.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock ||
  document.mozExitPointerLock;

  c.onclick = function () {
    c.requestPointerLock();
  }

  var pointerLockEnabled = false;

  document.addEventListener('pointerlockchange', pointerLockHandler, false);
  document.addEventListener('mozpointerlockchange', pointerLockHandler, false);

  function pointerLockHandler(e) {
    pointerLockEnabled = document.pointerLockElement === c ||
    document.mozPointerLockElement === c;
  }

  let highBitDepthFramebuffer;
  let highBitDepthTexture;
  window.addEventListener("resize", e => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    gl.viewport(0, 0, c.width, c.height);
    highBitDepthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, highBitDepthFramebuffer);
    
    highBitDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, highBitDepthTexture)
    setTexFilters(gl, highBitDepthTexture, gl.NEAREST);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA32F, c.width, c.height, 0, gl.RGBA, gl.FLOAT, null
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, highBitDepthTexture, 0
    );
  });
  window.dispatchEvent(new Event("resize"));



  let vShader = await loadAsset("vertex.vert");
  let fShader = await loadAsset("fragment.frag");

  let program = buildShaderProgram(gl, vShader, fShader);

  let blitVShader = await loadAsset("blit.vert");
  let blitFShader = await loadAsset("blit.frag");

  let blitProgram = buildShaderProgram(gl, blitVShader, blitFShader);


  let fullscreenQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_QUAD, gl.STATIC_DRAW);

  let treeQuats = [
    quatAngleAxis(Math.random() * Math.PI * 2, normalize([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5])),
    quatAngleAxis(Math.random() * Math.PI * 2, normalize([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5])),
    quatAngleAxis(Math.random() * Math.PI * 2, normalize([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]))
  ];

  let treeDeltaQuats = [];
  for (let i = 0; i < 3; i++) {
    treeDeltaQuats.push(quatAngleAxis(Math.random() * 0.0003 - 0.00015, normalize([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5])));
  }

  const ITERATIONS = 15;

  function loop() {



    gl.useProgram(program);

    //  gl.enable(gl.GL_ALPHA_TEST);
    gl.enable( gl.BLEND );
    gl.blendFunc(gl.ONE, gl.ONE);
    
    var acceleration = [0, 0, 0];
          
    if (keyboard.s) {
        acceleration[2] += -0.0001;
    }
    if (keyboard.a) {
        acceleration[0] += -0.0001;
    }
    if (keyboard.w) {
        acceleration[2] += 0.0001;
    }
    if (keyboard.d) {
        acceleration[0] += 0.0001;
    }
    if (keyboard.shift) {
        acceleration[1] += -0.0001;
    }
    if (keyboard[" "]) {
        acceleration[1] += 0.0001;
    }

    acceleration = acceleration.map(e => { return e * 1.1; });

    acceleration = vectorQuaternionMultiply(player.rotation, acceleration);
    player.velocity = player.velocity.map((e, i) => { return e + acceleration[i]; });
    player.position = player.position.map((e, i) => { return e + player.velocity[i]; });
    player.velocity = player.velocity.map(e => { return e * player.smoothness; });




    setUniform(gl, program, "cameraPosition", "3fv", player.position);
    setUniform(gl, program, "cameraRotation", "4fv", player.rotation);

    setUniform(gl, program, "quat1", "4fv", treeQuats[0]);
    setUniform(gl, program, "quat2", "4fv", treeQuats[1]);
    setUniform(gl, program, "quat3", "4fv", treeQuats[2]);

    setUniform(gl, program, "iterations", "1ui", ITERATIONS);

    for (let i = 0; i < 3; i++) {
      treeQuats[i] = quatMultiply(treeDeltaQuats[i], treeQuats[i]);
    }

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, highBitDepthFramebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.POINTS, 0, Math.pow(3, ITERATIONS));
    
    gl.disable(gl.BLEND);
    //gl.readBuffer(gl.COLOR_ATTACHMENT0);
    //gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    //gl.bindFramebuffer(gl.READ_FRAMEBUFFER, highBitDepthFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    //gl.blitFramebuffer(0, 0, c.width, c.height, 0, 0, c.width, c.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    
    gl.useProgram(blitProgram);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, highBitDepthTexture);
    setUniform(gl, blitProgram, "tex", "1i", 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(blitProgram, "position"));
    gl.vertexAttribPointer(gl.getAttribLocation(blitProgram, "position"), 2, gl.FLOAT, false, 8, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(loop);
  }
  loop();
})();