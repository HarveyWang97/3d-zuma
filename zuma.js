//////////Global Variables and Constants Set Up//////////
var canvas, gl;

var points = [];
var colors = [];
var texCoords = [];
var normals = [];
var index = 0;
var lineIndex = 0;

var modelViewTransform;
var pTransform;
var colorTransform;
var zoom;
var textureTransform;

var camera = lookAt([0, 0, 0], [0, 0, 1], [0, 1, 0]);
var checkEndStatus = false;
var checkEndCamera = lookAt([0, 0, -100], [20, 0, 1], [0, 1, 0]);

var sampler;
var textures = [];
var images = [];

var ballCollection = [];
var colliders = [];
var particleEffects = [];
var curve = [];
var curve_points = [];
var drawCurveFuncs = [];

var ball_count, ball_max, ball_interval;
var color_choices = ["red", "green", "blue", "magenta", "pink", "cyan"];

var nextColor = color_choices[Math.floor(Math.random() * color_choices.length)];
var insertMode = false;
var alerted = false;
var over = false;
var insertEvent = null;

var breakings = [];
for (var i = 0; i < 3; i++) {
    breakings.push(new Audio('breaking.mp3'));
}
var breakingCount = 0;
var evil = new Audio('evil.mp3');
var wrongs = [];
for (var i = 0; i < 5; i++) {
    wrongs.push(new Audio('wrong.mp3'));
}
var wrongCount = 0;
var win = new Audio('win.mp3');

var then = 0;
var level = 0;

const COLORS = {
    black: [0.0, 0.0, 0.0, 1.0],
    red: [1.0, 0.0, 0.0, 1.0],
    yellow: [1.0, 1.0, 0.0, 1.0],
    green: [0.0, 1.0, 0.0, 1.0],
    blue: [0.0, 0.0, 1.0, 1.0],
    magenta: [1.0, 0.0, 1.0, 1.0],
    cyan: [0.0, 0.8, 0.8, 1.0],
    random1: [0.3, 0.7, 0.4, 1.0],
    random2: [0.7, 0.4, 0.9, 1.0],
    white: [1.0, 1.0, 1.0, 1.0],
    pink: [1.0, 0.5, 0.5, 1.0]
};

const axis = {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1]
}

//////////Canvas Set Up//////////

function variablesSetUp() {
    points = [];
    colors = [];
    texCoords = [];
    normals = [];
    index = 0;
    lineIndex = 0;

    camera = lookAt([0, 0, 0], [0, 0, 1], [0, 1, 0]);
    checkEndStatus = false;
    checkEndCamera = lookAt([0, 0, -100], [20, 0, 1], [0, 1, 0]);

    ballCollection = [];
    colliders = [];
    particleEffects = [];
    curve = [];
    curve_points = [];

    ball_count = 0,
        ball_max = 100,
        ball_interval = 190;

    nextColor = color_choices[Math.floor(Math.random() * color_choices.length)];
    insertMode = false;
    alerted = false;
    over = false;
    insertEvent = null;
}

function init(thislevel = 1, firstTime = true) {
    level = thislevel;

    if (firstTime) {
        canvas = document.getElementById('gl-canvas');
        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) { alert("WebGL isn't available"); }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        gl.enable(gl.DEPTH_TEST);

        initTextures('ballTex.png', 0);
        initTextures('background.jpg', 1);
        initTextures('end.jpg', 2);
    }

    variablesSetUp();

    if (level == 2) {
        ball_max = 200;
        ball_interval = 178;
        alert("Welcome to Level 2");
    }

    drawSphere(5, false);
    drawCurveFuncs[level - 1]();
    drawCrossHair();
    drawCube();

    setBuffers();

    colliders.push(new Ball(COLORS.white, null, null, "end", curveFunc = function() {
        this.trans = mult(translate(curve_points[curve_points.length - 1]), this.size);
        return this.trans;
    }, 2));


    if (firstTime) render();
}


function setBuffers() {
    var program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var cAttr = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(cAttr, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cAttr);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var tAttr = gl.getAttribLocation(program, "aTextureCoord");
    gl.vertexAttribPointer(tAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tAttr);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewTransform = gl.getUniformLocation(program, "modelViewMatrix");
    pTransform = gl.getUniformLocation(program, "uPMatrix");
    colorTransform = gl.getUniformLocation(program, "colorMatrix");
    sampler = gl.getUniformLocation(program, 'uSampler');
    zoom = gl.getUniformLocation(program, 'zoom');
    textureTransform = gl.getUniformLocation(program, 'texMatrix');
}

//////////Rendering//////////

function render(time) {
    if (level === 2) debugger;

    /////Basic uniforms set up/////
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var my_perspective = perspective(30, 1000 / 600, 0.1, 1000);

    gl.uniformMatrix4fv(pTransform, false, flatten(my_perspective));

    gl.uniform1i(sampler, 0);

    gl.uniform2fv(zoom, [1, 1]);
    gl.uniformMatrix4fv(textureTransform, false, flatten(mat4()));

    /////Determine camera state/////
    var _camera;
    if (checkEndStatus) {
        _camera = checkEndCamera;
    } else {
        _camera = camera;
    }

    /////render static objects/////
    renderLines(_camera);
    renderCrossHair();
    renderNext();

    /////Balls state refresh/////
    if (insertMode) {
        if (insertEvent.monitor()) {
            insertEvent.recover();
        }
    } else {
        var start = ballCollection.length - 1;
        if (ballCollection[start] && ballCollection[start].speed === 0) {
            ballCollection[start].speed = 2;
        }
        var i = start - 1;
        for (; i >= 0; i--) {
            if (ballCollection[i].index - ballCollection[i + 1].index <= ball_interval) {
                ballCollection[i].speed = 2;
            } else {
                break;
            }
        }
        for (; i >= 0; i--) {
            ballCollection[i].speed = 0;
        }
    }

    /////Add New Ball/////
    if (ball_count <= ball_max && (ballCollection.length === 0 || ballCollection[ballCollection.length - 1].index >= ball_interval)) {
        var color = color_choices[Math.floor(Math.random() * color_choices.length)];
        ballCollection.push(new Ball(COLORS[color], curve_points, curve, color));
        ball_count++;
    } else if (ball_count > ball_max && ballCollection.length === 0) {
        if (!alerted) {
            win.play();
            alert("You Win!");
            alerted = true;
            if (level == 1)
                init(2, false);
            else {
                init(1, false);
                alert("Hello Again!");
                alerted = true;
            }
        }
    }

    if (ballCollection.length > 1 && ballCollection[ballCollection.length - 2].index - ballCollection[ballCollection.length - 1].index < ball_interval) {
        ballCollection.splice(ballCollection.length - 1, 1);
        ball_count--;
    }

    /////render balls/////
    for (var i = 0; i < ballCollection.length; i++) {
        var tmp = ballCollection[i];
        renderASphere(mult(_camera, tmp.getTransform()), tmp.color, tmp.texID);
    }

    var toBeRemoved = [];
    for (var i = 0; i < particleEffects.length; i++) {
        var tmp = particleEffects[i];
        tmp.render(_camera);
        if (tmp.finished()) {
            toBeRemoved.push(i);
        }
    }
    for (var i = toBeRemoved.length - 1; i >= 0; i--) {
        particleEffects.splice(toBeRemoved[i], 1);
    }

    /////removed out of space balls (shooted)/////
    toBeRemoved = [];
    for (var i = 0; i < colliders.length; i++) {
        var tmp = colliders[i];
        var trans = tmp.getTransform();
        var x = trans[0][3];
        var y = trans[1][3];
        var z = trans[2][3];
        if (Math.abs(z) > 40 || Math.abs(x) > 40 || Math.abs(y) > 40) {
            toBeRemoved.push(i);
            continue;
        }
        renderASphere(mult(_camera, trans), tmp.color, tmp.texID);
    }
    toBeRemoved.sort();
    for (var i = toBeRemoved.length - 1; i >= 0; i--) {
        colliders.splice(toBeRemoved[i], 1);
    }

    /////collision detection and collision events processing/////
    var collisions = collisionDetection(ballCollection, colliders);

    for (var i = 0; i < collisions.length; i++) {
        var evt = collisions[i];
        if (evt.isLost()) {
            if (!alerted) {
                evil.play();
                alerted = true;
                alert("You Lost!");
                window.location.href = "http://www.google.com";
            }
        } else if (evt.isShootSuccess()) {
            breakings[breakingCount % 3].play();
            breakingCount++;
            console.log(evt.tag1, evt.tag2);
            colliders.splice(evt.index2, 1);
            var pivot = evt.index1;
            var start, end;
            for (start = pivot; start >= 0; start--) {
                if (ballCollection[start].tag !== ballCollection[pivot].tag) {
                    break;
                } else if (ballCollection[start - 1] == undefined) {
                    start--;
                    break
                } else if (ballCollection[start - 1].index - ballCollection[start].index > ball_interval) {
                    start--;
                    break;
                }
            }
            start++;
            for (end = pivot; end < ballCollection.length; end++) {
                if (ballCollection[end].tag !== ballCollection[pivot].tag) {
                    break;
                } else if (ballCollection[end + 1] == undefined) {
                    end++;
                    break
                } else if (ballCollection[end].index - ballCollection[end + 1].index > ball_interval) {
                    end++;
                    break;
                }
            }
            end--;
            for (var p = start; p <= end; p++) {
                particleEffects.push(new ParticleSystem(ballCollection[p].getPosition(), 200, 15, COLORS[ballCollection[p].tag]));
            }
            ballCollection.splice(start, end - start + 1);
            break;
        } else {
            wrongs[wrongCount % 5].play();
            wrongCount++;
            console.log(evt.tag1, evt.tag2);
            insertEvent = new Insert(colliders[evt.index2], evt.index1, ballCollection[evt.index1].index);
            insertEvent.trigger();
            colliders.splice(evt.index2, 1)
            break;
        }
    }

    /////background rendering/////
    renderACube(mult(_camera, scalem(200, 200, 200)), 1);

    var fps = 1 / ((time - then) * 0.001);
    document.getElementById("FPS").innerHTML = Math.floor(fps).toString();
    then = time;

    /////next frame/////
    requestAnimFrame(render);
}

//////////Shape Rendering//////////

function drawSphere(depth, flatShading = false) {
    var pos1 = vec4(0.0, 0.0, -1.0),
        pos2 = vec4(0.0, 0.942809, 0.333333),
        pos3 = vec4(-0.816497, -0.471405, 0.333333),
        pos4 = vec4(0.816497, -0.471405, 0.333333);

    function triangle(a, b, c) {
        points.push(a, b, c);
        if (flatShading) {
            var n = normalize(cross(subtract(a, b), subtract(a, c)), true);
            normals.push(n, n, n);
        } else {
            normals.push(a, b, c);
        }

        colors.push(COLORS.white, COLORS.white, COLORS.white);
        index += 3;
    }

    function divideTriangle(a, b, c, n) {
        if (n > 0) {
            var ab = normalize(mix(a, b, 0.5), true);
            var ac = normalize(mix(a, c, 0.5), true);
            var bc = normalize(mix(b, c, 0.5), true);
            divideTriangle(a, ab, ac, n - 1);
            divideTriangle(ab, b, bc, n - 1);
            divideTriangle(bc, c, ac, n - 1);
            divideTriangle(ab, bc, ac, n - 1);
        } else {
            triangle(a, b, c);
        }
    }

    function tetrahedron(n) {
        var a = pos1;
        var b = pos2;
        var c = pos3;
        var d = pos4;
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }

    tetrahedron(depth);

    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        texCoords.push(vec2(.5 + Math.atan2(p[2], p[0]) / 2 / Math.PI, .5 - 2 * Math.asin(p[1]) / 2 / Math.PI));
    }

}

function renderASphere(mV, color, tex) {
    gl.bindTexture(gl.TEXTURE_2D, textures[tex]);
    gl.uniformMatrix4fv(modelViewTransform, false, flatten(mV));
    gl.uniformMatrix4fv(colorTransform, false, flatten(scalem(color[0], color[1], color[2])));
    gl.drawArrays(gl.TRIANGLES, 0, index);
}

function renderLines(camera) {
    gl.bindTexture(gl.TEXTURE_2D, null);
    var color = COLORS.white;
    gl.uniformMatrix4fv(modelViewTransform, false, flatten(camera));
    gl.uniformMatrix4fv(colorTransform, false, flatten(scalem(color[0], color[1], color[2])));
    gl.drawArrays(gl.LINE_STRIP, index, lineIndex);
}

function renderCrossHair() {
    gl.bindTexture(gl.TEXTURE_2D, null);
    var color = COLORS.white;
    gl.uniformMatrix4fv(modelViewTransform, false, flatten(mat4()));
    gl.uniformMatrix4fv(colorTransform, false, flatten(scalem(color[0], color[1], color[2])));
    gl.drawArrays(gl.LINES, index + lineIndex, 4);
}

function renderNext(tex = 0) {
    gl.bindTexture(gl.TEXTURE_2D, textures[tex]);
    var color = COLORS[nextColor];
    gl.uniformMatrix4fv(modelViewTransform, false, flatten(mult(translate(0, 0, -5), scalem(0.1, 0.1, 0.1))));
    gl.uniformMatrix4fv(colorTransform, false, flatten(scalem(color[0], color[1], color[2])));
    gl.drawArrays(gl.TRIANGLES, 0, index);
}

function drawCube() {
    drawQuad(0, 1, 2, 3);
    drawQuad(3, 2, 6, 7);
    drawQuad(3, 0, 4, 7);
    drawQuad(1, 2, 6, 5);
    drawQuad(7, 6, 5, 4);
    drawQuad(4, 5, 1, 0);
}


function drawQuad(a, b, c, d, material) {

    var vertices = [
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var textureCoords = [
        vec2(1.0, 1.0),
        vec2(1.0, 0.0),
        vec2(0.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 0.0),
        vec2(0.0, 1.0)
    ];

    var indices = [a, b, c, a, c, d];
    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        normals.push(vertices[indices[i]]);
        colors.push(COLORS.white);
        texCoords.push(textureCoords[i]);
    }

}

function renderACube(mV, tex = 0, color = COLORS.white) {
    gl.bindTexture(gl.TEXTURE_2D, textures[tex]);
    gl.uniformMatrix4fv(modelViewTransform, false, flatten(mV));
    gl.uniformMatrix4fv(colorTransform, false, flatten(scalem(color[0], color[1], color[2])));
    gl.drawArrays(gl.TRIANGLES, index + lineIndex + 4, 36);
}


//////////Navigation System//////////

const keys = {
    C: 67,
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    I: 73,
    O: 79,
    J: 74,
    K: 75,
    M: 77,
    R: 82,
    W: 87,
    S: 83,
    A: 65,
    D: 68,
    N: 78,
    U: 85,
    T: 84,
    SPACE: 32,
    SHIFT: 16,
    EQUAL: 187
}

document.addEventListener('keydown', function(event) {
    if (event.keyCode == keys.UP && !checkEndStatus) {
        camera = mult(rotate(-4, axis.x), camera)
    } else if (event.keyCode == keys.DOWN && !checkEndStatus) {
        camera = mult(rotate(4, axis.x), camera)
    } else if (event.keyCode == keys.LEFT && !checkEndStatus) {
        camera = mult(rotate(-4, axis.y), camera)
    } else if (event.keyCode == keys.RIGHT && !checkEndStatus) {
        camera = mult(rotate(4, axis.y), camera)
    } else if (event.keyCode == keys.SPACE && !checkEndStatus) {
        var linearMoveFunc = function(angle, step) {
            var angle = inverse(angle),
                step = step;
            var curDist = mat4();
            return function() {
                curDist = mult(step, curDist);
                this.trans = mult(mult(angle, curDist), this.size);
                return this.trans;
            };
        };
        colliders.push(new Ball(COLORS[nextColor], null, null, nextColor, linearMoveFunc(camera, translate(0, 0, -1))));
        nextColor = color_choices[Math.floor(Math.random() * color_choices.length)];
    } else if (event.keyCode == keys.M) {
        checkEndStatus = !checkEndStatus;
    }
});

//////////Texture Mapping//////////

function initTextures(imgSrc, id = 0) {
    textures[id] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textures[id]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255]));
    images[id] = new Image();
    images[id].crossOrigin = "anonymous";
    images[id].src = imgSrc;
    images[id].onload = function() { handleTextureLoaded(images[id], textures[id], id); }
}

function handleTextureLoaded(image, texture, id) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//////////Ball Class//////////

function Ball(color, curve_points, curve_transforms, tag, curveFunc = null, texID = 0) {
    this.tag = tag;
    this.index = -1;
    this.color = color;
    this.points = curve_points;
    this.curve = curve_transforms;
    this.size = scalem(2, 2, 2);
    this.texID = texID;
    this.trans = mat4();
    this.speed = 2;
    this.rotate = rotate(-2, axis.y);
    this.getTransform = function() {
        this.index += this.speed;
        ax = cross(subtract(this.points[this.index], this.points[this.index + 1]), axis.z);
        this.rotate = mult(rotate(-2 * this.speed, ax), this.rotate);
        if (this.index >= this.curve.length) {
            if (!alerted) {
                evil.play();
                alerted = true;
                alert("You Lost!");
                init(2, false);
            }
            return mult(mult(this.curve[this.curve.length - 1], this.size), this.rotate);
        } else {
            return mult(mult(this.curve[this.index], this.size), this.rotate);
        }
    };
    this.getPosition = function() {
        if (this.index >= this.curve.length) {
            if (!alerted) {
                evil.play();
                alerted = true;
                alert("You Lost!");
                init(2, false);
            }
            return this.points[this.points.length - 1];
        } else {
            return this.points[this.index];
        }
    };
    if (curveFunc) {
        this.getTransform = curveFunc;
        this.getPosition = function() {
            return [this.trans[0][3], this.trans[1][3], this.trans[2][3]];
        };
    }
}

//////////Insert Event//////////
function Insert(ball, index, position) {
    this.ball = ball;
    this.index = index;
    this.position = position;
    this.tmpSpeeds = [];

    this.trigger = function() {
        for (var i = 0; i <= this.index; i++) {
            this.tmpSpeeds.push(ballCollection[i].speed)
            ballCollection[i].speed = 20;
        }
        for (var i = this.index + 1; i < ballCollection.length; i++) {
            this.tmpSpeeds.push(ballCollection[i].speed);
            ballCollection[i].speed = 0;
        }
        insertMode = true;
    }
    this.recover = function() {
        var newBall = new Ball(COLORS[this.ball.tag], curve_points, curve, this.ball.tag);
        newBall.index = this.position;
        for (var i = 0; i < this.tmpSpeeds.length; i++) {
            ballCollection[i].speed = this.tmpSpeeds[i];
        }
        ballCollection.splice(this.index + 1, 0, newBall);
        insertMode = false;
    }
    this.monitor = function() {
        if (ballCollection[this.index].index - this.position >= ball_interval) {
            return true;
        } else {
            return false;
        }
    }
}

//////////Curve Rendering//////////

drawCurveFuncs[0] = function() {
    var limit = 12 * Math.PI,
        t = 0.1;
    var tmp = [0.001, 0.001, 0];
    var z = limit - 0.1;
    var lines = [];
    var Lcolors = [];
    var Lnormals = [];
    var Ltex = [];
    while (z >= 0) {
        //point calculation
        var point = [(limit - z) * Math.cos(t), (limit - z) * Math.sin(t), z];

        //set up curve transformation and points array
        curve_points.push(point);
        curve.push(translate(point));

        //set up curve lines array
        lines.push(vec4(point));
        Lcolors.push(COLORS.white);
        Lnormals.push(vec4(point));
        Ltex.push(vec2(0, 0));
        lineIndex++;

        //step to the next loop
        var r = Math.sqrt(tmp[0] * tmp[0] + tmp[1] * tmp[1]);
        t += 0.02 / r;
        tmp = point;
        z -= 0.005;
    }

    //delete the unnecessary start points
    curve = curve.slice(100);
    curve_points = curve_points.slice(100);

    //do the same for curve lines
    lineIndex -= 100;
    points = points.concat(lines.slice(100));
    colors = colors.concat(Lcolors.slice(100));
    normals = normals.concat(Lnormals.slice(100));
    texCoords = texCoords.concat(Ltex.slice(100));
}

//TODO: level 2 curve
drawCurveFuncs[1] = function() {
    var limit = 12 * Math.PI,
        t = 0.1;
    var tmp = [0.001, 0.001, 0];
    var z = limit - 0.1;
    var lines = [];
    var Lcolors = [];
    var Lnormals = [];
    var Ltex = [];
    var theta = 0;
    var pi = Math.PI;
    var x_prime = Math.cos(theta);
    var y_prime = Math.sin(theta);

    while (z >= -12 * Math.PI) {
        //point calculation
        theta += 0.0007;
        while (theta > 2 * Math.PI)
            theta -= 2 * Math.PI;
        x_prime = Math.cos(theta);
        y_prime = Math.sin(theta);
        var point = [20 * pi * Math.sin(x_prime - pi / 2) * Math.cos(-y_prime / 2 - pi / 2), 20 * pi * Math.cos(x_prime - pi / 2) * Math.cos(-y_prime / 2 - pi / 2), z];
        //set up curve transformation and points array
        curve_points.push(point);
        curve.push(translate(point));

        //set up curve lines array
        lines.push(vec4(point));
        Lcolors.push(COLORS.white);
        Lnormals.push(vec4(point));
        Ltex.push(vec2(0, 0));
        lineIndex++;

        //step to the next loop
        var r = Math.sqrt(tmp[0] * tmp[0] + tmp[1] * tmp[1]);
        t += 0.02 / r;
        tmp = point;
        z -= 0.01;
    }

    //delete the unnecessary start points
    curve = curve.slice(100);
    curve_points = curve_points.slice(100);

    //do the same for curve lines
    lineIndex -= 100;
    points = points.concat(lines.slice(100));
    colors = colors.concat(Lcolors.slice(100));
    normals = normals.concat(Lnormals.slice(100));
    texCoords = texCoords.concat(Ltex.slice(100));
}

//////////CrossHair Rendering//////////

function drawCrossHair() {
    points = points.concat([vec4(-1, 0, -20), vec4(1, 0, -20), vec4(0, 1, -20), vec4(0, -1, -20)]);
    colors = colors.concat([COLORS.white, COLORS.white, COLORS.white, COLORS.white]);
    normals = normals.concat([vec4(-1, 0, 0), vec4(1, 0, 0), vec4(0, 1, 0), vec4(0, -1, 0)]);
    texCoords = texCoords.concat([vec2(0, 0), vec2(0, 0), vec2(0, 0), vec2(0, 0)]);
}
