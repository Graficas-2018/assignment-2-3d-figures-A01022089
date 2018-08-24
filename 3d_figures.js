var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute,
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 5000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource =
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try
    {
        gl = canvas.getContext("experimental-webgl");
    }
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -10]);

}

// TO DO: Create the functions for each of the figures.

function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);

    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs)
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs)
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}

// Create the vertex, color and index data for a multi-colored pyramid
function createPyramid(gl, translation, rotationAxis)
{
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [

      //face 1
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      0.0, 2.0, 0.0, //punta 1
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),


      //face 2
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      0.0, 2.0, 0.0, //punta 1
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),

      //face 3 //frente
      0.0, 2.0, 0.0, //punta 1
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),

      //face 4
      0.0, 2.0, 0.0, //punta 1
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),


      //face 5
      0.0, 2.0, 0.0, //punta 1
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),

      //base
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),

      //double for the colors

      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180)

       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // face 1
        [0.0, 1.0, 0.0, 1.0], // face 2
        [0.0, 0.0, 1.0, 1.0], // face 3
        [1.0, 1.0, 0.0, 1.0], // face 4
        [1.0, 0.0, 1.0, 1.0], // face 5
        [0.0, 1.0, 1.0, 1.0], // base
        [0.0, 1.0, 1.0, 1.0]  // base second part

    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the pyramid's face.
    var vertexColors = [];
    // for (var i in faceColors)
    // {
    //     var color = faceColors[i];
    //     for (var j=0; j < 4; j++)
    //         vertexColors = vertexColors.concat(color);
    // }
    for (const color of faceColors)
    {
        for (var j=0; j < 4; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var pyramidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidIndexBuffer);
    var pyramidIndices = [
        0, 1, 2,      0, 2, 3,    // face 1
        4, 5, 6,      4, 6, 7,    // face 2
        8, 9, 10,     8, 10, 11,  // face 3
        12, 13, 14,   12, 14, 15, // face 4
        16, 17, 18,   16, 18, 19, // face 5
        20, 21, 22,   20, 22, 23,  // base
        24, 25, 26,   24, 26, 27
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramidIndices), gl.STATIC_DRAW);

    var pyramid = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:pyramidIndexBuffer,
            vertSize:3, nVerts:28, colorSize:4, nColors: 28, nIndices:42,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);

    pyramid.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return pyramid;
}

//// Create the vertex, color and index data for a multi-colored octahedron
function createOctahedron(gl, translation, rotationAxis)
{
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [

      // UP face 1
      0.0, 1.0, 0.0, //punta 1
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(90 * Math.PI / 180), 0.0, 1.0 * Math.cos(90 * Math.PI / 180),
      1.0 * Math.sin(90 * Math.PI / 180), 0.0, 1.0 * Math.cos(90 * Math.PI / 180),

      //UP face 2
      0.0, 1.0, 0.0, //punta 1
      1.0 * Math.sin(90 * Math.PI / 180), 0.0, 1.0 * Math.cos(90 * Math.PI / 180),
      1.0 * Math.sin(180 * Math.PI / 180), 0.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(180 * Math.PI / 180), 0.0, 1.0 * Math.cos(180 * Math.PI / 180),

      //UP face 3
      0.0, 1.0, 0.0, //punta 1
      1.0 * Math.sin(180 * Math.PI / 180), 0.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(270 * Math.PI / 180), 0.0, 1.0 * Math.cos(270 * Math.PI / 180),
      1.0 * Math.sin(270 * Math.PI / 180), 0.0, 1.0 * Math.cos(270 * Math.PI / 180),

      //UP face 4
      0.0, 1.0, 0.0, //punta 1
      1.0 * Math.sin(270 * Math.PI / 180), 0.0, 1.0 * Math.cos(270 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),

      //DOWN face 1
      0.0, -1.0, 0.0, //punta 1
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(90 * Math.PI / 180), 0.0, 1.0 * Math.cos(90 * Math.PI / 180),
      1.0 * Math.sin(90 * Math.PI / 180), 0.0, 1.0 * Math.cos(90 * Math.PI / 180),

      //DOWN face 2
      0.0, -1.0, 0.0, //punta 1
      1.0 * Math.sin(90 * Math.PI / 180), 0.0, 1.0 * Math.cos(90 * Math.PI / 180),
      1.0 * Math.sin(180 * Math.PI / 180), 0.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(180 * Math.PI / 180), 0.0, 1.0 * Math.cos(180 * Math.PI / 180),

      //DOWN face 3
      0.0, -1.0, 0.0, //punta 1
      1.0 * Math.sin(180 * Math.PI / 180), 0.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(270 * Math.PI / 180), 0.0, 1.0 * Math.cos(270 * Math.PI / 180),
      1.0 * Math.sin(270 * Math.PI / 180), 0.0, 1.0 * Math.cos(270 * Math.PI / 180),

      //DOWN face 4
      0.0, -1.0, 0.0, //punta 1
      1.0 * Math.sin(270 * Math.PI / 180), 0.0, 1.0 * Math.cos(270 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),




    ];


        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        // Color data
        var colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        var faceColors = [
            //UP
            [1.0, 0.0, 0.0, 1.0], // face 1
            [0.0, 1.0, 0.0, 1.0], // face 2
            [0.0, 0.0, 1.0, 1.0], // face 3
            [1.0, 1.0, 0.0, 1.0], // face 4
            //DOWN
            [1.0, 0.0, 1.0, 1.0], // face 1
            [0.0, 1.0, 1.0, 1.0], // face 2
            [1.0, 1.0, 1.0, 1.0],  // face 3
            [0.6, 0.5, 1.0, 1.0] // face 4


        ];

        // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the octahedron's face.
        var vertexColors = [];
        // for (var i in faceColors)
        // {
        //     var color = faceColors[i];
        //     for (var j=0; j < 4; j++)
        //         vertexColors = vertexColors.concat(color);
        // }
        for (const color of faceColors)
        {
            for (var j=0; j < 4; j++)
                vertexColors = vertexColors.concat(color);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

        // Index data (defines the triangles to be drawn).
        var octahedronIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, octahedronIndexBuffer);
        var octahedronIndices = [
                                      //UP
            0, 1, 2,      0, 2, 3,    // face 1
            4, 5, 6,      4, 6, 7,    // face 2
            8, 9, 10,     8, 10, 11,  // face 3
            12, 13, 14,   12, 14, 15, // face 4
                                      //DOWN
            16, 17, 18,   16, 18, 19, // face 1
            20, 21, 22,   20, 22, 23,  // face 2
            24, 25, 26,   24, 26, 27, //face 3
            28, 29, 30,   28, 30, 31  //face 4
        ];

        // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
        // Uint16Array: Array of 16-bit unsigned integers.
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octahedronIndices), gl.STATIC_DRAW);

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octahedronIndices), gl.STATIC_DRAW);

    var octahedron = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:octahedronIndexBuffer,
            vertSize:3, nVerts:32, colorSize:4, nColors: 32, nIndices:48,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(octahedron.modelViewMatrix, octahedron.modelViewMatrix, translation);

    var up = true;
    var movement = 0.00;

    octahedron.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
        if (up == true)
        {
          mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0,0.05,0]);
          movement = movement + 0.05;
        }
        else
        {
          mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0,-0.05,0]);
          movement = movement - 0.05;
        }

        if(movement > 5)
        {
          up = false;
        }
        if(movement < -5)
        {
          up = true;
        }
    };

    return octahedron;
}


//// Create the vertex, color and index data for a multi-colored scutoid
function createScutoid(gl, translation, rotationAxis)
{
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [

      // TOP 5

      // 3 vertex
      1.0 * Math.sin(0 * Math.PI / 180), 2.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(300 * Math.PI / 180), 2.0, 1.0 * Math.cos(300 * Math.PI / 180),
      1.0 * Math.sin(300 * Math.PI / 180), 2.0, 1.0 * Math.cos(300 * Math.PI / 180),

      //middle part 1
      1.0 * Math.sin(300 * Math.PI / 180), 2.0, 1.0 * Math.cos(300 * Math.PI / 180),
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),

      //middle part 2
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),
      1.0 * Math.sin(120 * Math.PI / 180), 2.0, 1.0 * Math.cos(120 * Math.PI / 180),
      1.0 * Math.sin(120 * Math.PI / 180), 2.0, 1.0 * Math.cos(120 * Math.PI / 180),

      //last 3 vertex
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),
      1.0 * Math.sin(120 * Math.PI / 180), 2.0, 1.0 * Math.cos(120 * Math.PI / 180),
      1.0 * Math.sin(180 * Math.PI / 180), 2.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(180 * Math.PI / 180), 2.0, 1.0 * Math.cos(180 * Math.PI / 180),

      //triangle
      1.0 * Math.sin(0 * Math.PI / 180), 2.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(300 * Math.PI / 180), 2.0, 1.0 * Math.cos(300 * Math.PI / 180),
      1.0 * Math.sin(300 * Math.PI / 180), 2.0, 1.0 * Math.cos(300 * Math.PI / 180),

      //atras


      //atras izquierda

      //atras derecha 1

      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),

      //atras derecha 2
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(120 * Math.PI / 180), 2.0, 1.0 * Math.cos(120 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),

      //atras 1

      1.0 * Math.sin(120 * Math.PI / 180), 2.0, 1.0 * Math.cos(120 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),

      //atras 2
      1.0 * Math.sin(180 * Math.PI / 180), 2.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(120 * Math.PI / 180), 2.0, 1.0 * Math.cos(120 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),

      //atras izquierda 1

      1.0 * Math.sin(180 * Math.PI / 180), 2.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),


      //atras izquierda 2
      1.0 * Math.sin(180 * Math.PI / 180), 2.0, 1.0 * Math.cos(180 * Math.PI / 180),
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),

      //frente izquierda

      //1
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),
      1.0 * Math.sin(300 * Math.PI / 180), 2.0, 1.0 * Math.cos(300 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),

      //2
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(240 * Math.PI / 180), 2.0, 1.0 * Math.cos(240 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),

      //3
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),

      //frente derecha

      //1
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),

      //2
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),

      //3
      1.0 * Math.sin(340 * Math.PI / 180), 0.8, 1.5 * Math.cos(340 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 2.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),
      1.0 * Math.sin(60 * Math.PI / 180), 2.0, 1.0 * Math.cos(60 * Math.PI / 180),

      //base1
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180),
      1.0 * Math.sin(72 * Math.PI / 180), 0.0, 1.0 * Math.cos(72 * Math.PI / 180),
      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),

      //base2

      1.0 * Math.sin(144 * Math.PI / 180), 0.0, 1.0 * Math.cos(144 * Math.PI / 180),
      1.0 * Math.sin(216 * Math.PI / 180), 0.0, 1.0 * Math.cos(216 * Math.PI / 180),
      1.0 * Math.sin(288 * Math.PI / 180), 0.0, 1.0 * Math.cos(288 * Math.PI / 180),
      1.0 * Math.sin(0 * Math.PI / 180), 0.0, 1.0 * Math.cos(0 * Math.PI / 180)

    ];


        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        // Color data
        var colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        var faceColors = [
            //UP
            [1.0, 0.0, 0.0, 1.0], // part 1
            [1.0, 0.0, 0.0, 1.0], // part 2
            [1.0, 0.0, 0.0, 1.0], // part 3
            [1.0, 0.0, 0.0, 1.0],  // part 4
            [0.0, 1.0, 0.0, 1.0], // triangle

            [0.0, 0.0, 1.0, 1.0], // atras derecha
            [0.0, 0.0, 1.0, 1.0], // atras derecha

            [1.0, 0.0, 1.0, 1.0],// atras
            [1.0, 0.0, 1.0, 1.0], //atras

            [1.0, 1.0, 0.0, 1.0], //atras izquierda
            [1.0, 1.0, 0.0, 1.0], //atras izquierda

            [0.5, 1.0, 1.0, 1.0], //frente izquierda
            [0.5, 1.0, 1.0, 1.0], //frente izquierda
            [0.5, 1.0, 1.0, 1.0], //frente izquierda

            [1.0, 1.0, 1.0, 1.0], //frente derecha
            [1.0, 1.0, 1.0, 1.0], //frente derecha
            [1.0, 1.0, 1.0, 1.0], //frente derecha

            [0.5, 0.0, 1.0, 1.0], // base
            [0.5, 0.0, 1.0, 1.0] // base

        ];

        // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the scutoid's face.
        var vertexColors = [];
        // for (var i in faceColors)
        // {
        //     var color = faceColors[i];
        //     for (var j=0; j < 4; j++)
        //         vertexColors = vertexColors.concat(color);
        // }
        for (const color of faceColors)
        {
            for (var j=0; j < 4; j++)
                vertexColors = vertexColors.concat(color);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

        // Index data (defines the triangles to be drawn).
        var scutoidIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scutoidIndexBuffer);
        var scutoidIndices = [
                                      //UP
            0, 1, 2,      0, 2, 3,    // face 1
            4, 5, 6,      4, 6, 7,    // face 2
            8, 9, 10,     8, 10, 11,  // face 3
            12, 13, 14,   12, 14, 15, // face 4
            16, 17, 18,   16, 18, 19, //triangle

            20, 21, 22,   20, 22, 23,  //atras derecha
            24, 25, 26,   24, 26, 27,  //atras derecha
            28, 29, 30,   28,30,31, // atras
            32, 33, 34,   32,34,35,  //atras
            36, 37, 38,   36, 38, 39,  //atras izquierda

            40, 41, 42,   40, 42, 43,  //atras izquierda
            44, 45, 46,   44, 46, 47,   //enfrente izquierda
            48, 49, 50,   48, 50, 51,    //enfrente izquierdaa
            52, 53, 54,   52, 54, 55,   //enfrente izquierdaa
            56, 57, 58,   56, 58, 59,   //frente derecha

            60, 61, 62,  60, 62, 63,    //frente derecha
            64, 65, 66,   64, 66, 67,  //frente derecha
            68, 69, 70, 68, 70, 71, //base1
            72, 73, 74, 72, 74, 75  //base2
        ];

        // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
        // Uint16Array: Array of 16-bit unsigned integers.
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scutoidIndices), gl.STATIC_DRAW);

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scutoidIndices), gl.STATIC_DRAW);

    var scutoid = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:scutoidIndexBuffer,
            vertSize:3, nVerts:76, colorSize:4, nColors: 76, nIndices:114,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(scutoid.modelViewMatrix, scutoid.modelViewMatrix, translation);

    scutoid.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return scutoid;
}
