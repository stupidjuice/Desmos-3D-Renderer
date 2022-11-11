//calculator
var elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt);

//other vars lol
const maxTriangles = 64; //increasing this will slow the calculator down (a lot)
const ScreenHeight = 18.0;
const ScreenWidth = 20.0;
const FrameDelay = 0.01; //seconds

//render vars
var ElapsedTime = 0.0;

class mat4x4
{
    constructor()
    {
        this.m = [ [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0] ];
    }
}

class vector3
{
    constructor(x = 0.0, y = 0.0, z = 0.0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class triangle
{
    constructor(p1 = new vector3(), p2 = new vector3(), p3 = new vector3())
    {
        this.p = [p1,  p2, p3];
    }
}

class mesh 
{
    constructor()
    {
        this.tris = [];
    }
}

//projection matrix
var fNear = 0.1;
var fFar = 1000.0;
var fFov = 90.0;
var fAspectRatio = ScreenHeight / ScreenWidth;
var fFovRad = 1.0 / Math.tan(fFov * 0.5 / 180.0 * Math.PI);

matProj = new mat4x4();

matProj.m[0][0] = fAspectRatio * fFovRad;
matProj.m[1][1] = fFovRad;
matProj.m[2][2] = fFar / (fFar - fNear);
matProj.m[3][2] = (-fFar * fNear) / (fFar - fNear);
matProj.m[2][3] = 1.0;
matProj.m[3][3] = 0.0;

//cube:
meshCube = new mesh();

//south
meshCube.tris.push(GetTriangle([0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [1.0, 1.0, 0.0]));
meshCube.tris.push(GetTriangle([0.0, 0.0, 0.0], [1.0, 1.0, 0.0], [1.0, 0.0, 0.0]));

//east
meshCube.tris.push(GetTriangle([1.0, 0.0, 0.0], [1.0, 1.0, 0.0], [1.0, 1.0, 1.0]));
meshCube.tris.push(GetTriangle([1.0, 0.0, 0.0], [1.0, 1.0, 1.0], [1.0, 0.0, 1.0]));

//north
meshCube.tris.push(GetTriangle([1.0, 0.0, 1.0], [1.0, 1.0, 1.0], [0.0, 1.0, 1.0]));
meshCube.tris.push(GetTriangle([1.0, 0.0, 1.0], [0.0, 1.0, 1.0], [0.0, 0.0, 1.0]));

//west
meshCube.tris.push(GetTriangle([0.0, 0.0, 1.0], [0.0, 1.0, 1.0], [0.0, 1.0, 0.0]));
meshCube.tris.push(GetTriangle([0.0, 0.0, 1.0], [0.0, 1.0, 0.0], [0.0, 0.0, 0.0]));

//top
meshCube.tris.push(GetTriangle([0.0, 1.0, 0.0], [0.0, 1.0, 1.0], [1.0, 1.0, 1.0]));
meshCube.tris.push(GetTriangle([0.0, 1.0, 0.0], [1.0, 1.0, 1.0], [1.0, 1.0, 0.0]));

//bottom
meshCube.tris.push(GetTriangle([1.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 0.0]));
meshCube.tris.push(GetTriangle([1.0, 0.0, 1.0], [0.0, 0.0, 0.0], [1.0, 0.0, 0.0]));

//returns latex of a triangle
function GetTriangleLatex(x1, y1, x2, y2, x3, y3)
{
    return '\\polygon((' + x1.toString() + ', ' + y1.toString() + '), (' + x2.toString() + ', ' + y2.toString() + '), (' + x3.toString() + ', ' + y3.toString() + '))';
}

//creates a bunch of points to use later
function Initialize()
{
    for(let i = 0; i < maxTriangles; i++)
    {
        calculator.setExpression({id: i.toString(), latex: '(-10, 0)'});    
    }
}

/**
 * @param {vector3} i vector3 to be multiplied
 * @param {vector3} o vector3 output
 * @param {mat4x4} m matrix to be multiplied
 */
function MultiplyMatrixVector(i, m)
{
    temp = new vector3();
    temp.x = i.x * m.m[0][0] + i.y * m.m[1][0] + i.z * m.m[2][0] + m.m[3][0];
	temp.y = i.x * m.m[0][1] + i.y * m.m[1][1] + i.z * m.m[2][1] + m.m[3][1];
	temp.z = i.x * m.m[0][2] + i.y * m.m[1][2] + i.z * m.m[2][2] + m.m[3][2];
	w =      i.x * m.m[0][3] + i.y * m.m[1][3] + i.z * m.m[2][3] + m.m[3][3];

	if (w != 0.0)
	{
		temp.x /= w; temp.y /= w; temp.z /= w;
	}
    return temp;
}

/**
 * 
 * @param {List} p1 
 * @param {List} p2 
 * @param {List} p3 
 * @returns 
 */
function GetTriangle(p1, p2, p3)
{
    return new triangle(new vector3(p1[0], p1[1], p1[2]), new vector3(p2[0], p2[1], p2[2]), new vector3(p3[0], p3[1], p3[2]));
}

//---------------------------------------ACTUAL RENDERING CODE---------------------------------------

Initialize();

//main loop
setInterval(function() {
    //update variables
    ElapsedTime += FrameDelay;
    TimeScale = 1;
    console.log(ElapsedTime)

    //render
    matRotZ = new mat4x4();
    matRotX = new mat4x4();

	//rotation Z
	matRotZ.m[0][0] = Math.cos(ElapsedTime * TimeScale);
	matRotZ.m[0][1] = Math.sin(ElapsedTime * TimeScale);
	matRotZ.m[1][0] = -Math.sin(ElapsedTime * TimeScale);
	matRotZ.m[1][1] = Math.cos(ElapsedTime * TimeScale);
	matRotZ.m[2][2] = 1;
	matRotZ.m[3][3] = 1;

	//rotation X
	matRotX.m[0][0] = 1;
	matRotX.m[1][1] = Math.cos(ElapsedTime * 0.5 * TimeScale);
	matRotX.m[1][2] = Math.sin(ElapsedTime * 0.5 * TimeScale);
	matRotX.m[2][1] = -Math.sin(ElapsedTime * 0.5 * TimeScale);
	matRotX.m[2][2] = Math.cos(ElapsedTime * 0.5 * TimeScale);
	matRotX.m[3][3] = 1;

    for(let i = 0; i < meshCube.tris.length; i++)
    {
        //a bunch of triangles that will be used for each transformation/projection
        tri = JSON.parse(JSON.stringify(meshCube.tris[i]));
        triTranslated = new triangle();
        triProjected = new triangle();
        triRotatedZ = new triangle();
        triRotatedZX = new triangle();

        //rotate z
		triRotatedZ.p[0] = MultiplyMatrixVector(tri.p[0], matRotZ);
		triRotatedZ.p[1] = MultiplyMatrixVector(tri.p[1], matRotZ);
		triRotatedZ.p[2] = MultiplyMatrixVector(tri.p[2], matRotZ);

		//rotate x
        triRotatedZX = JSON.parse(JSON.stringify(triRotatedZ));
		triRotatedZX.p[0] = MultiplyMatrixVector(triRotatedZ.p[0], matRotX);
		triRotatedZX.p[1] = MultiplyMatrixVector(triRotatedZ.p[1], matRotX);
		triRotatedZX.p[2] = MultiplyMatrixVector(triRotatedZ.p[2], matRotX);

        //translate forward
        triTranslated = triRotatedZX;
        triTranslated.p[0].z = triRotatedZX.p[0].z + 3.0;
        triTranslated.p[1].z = triRotatedZX.p[1].z + 3.0;
        triTranslated.p[2].z = triRotatedZX.p[2].z + 3.0;

        //project
        triProjected.p[0] = MultiplyMatrixVector(triRotatedZX.p[0], matProj);
        triProjected.p[1] = MultiplyMatrixVector(triRotatedZX.p[1], matProj);
        triProjected.p[2] = MultiplyMatrixVector(triRotatedZX.p[2], matProj);

        //bring the cube into the screen
        triProjected.p[0].x += 1.0; triProjected.p[0].y += 1.0;
	    triProjected.p[1].x += 1.0; triProjected.p[1].y += 1.0;
	    triProjected.p[2].x += 1.0; triProjected.p[2].y += 1.0;
	    triProjected.p[0].x *= 0.5 * ScreenWidth;
	    triProjected.p[0].y *= 0.5 * ScreenHeight;
	    triProjected.p[1].x *= 0.5 * ScreenWidth;
	    triProjected.p[1].y *= 0.5 * ScreenHeight;
	    triProjected.p[2].x *= 0.5 * ScreenWidth;
	    triProjected.p[2].y *= 0.5 * ScreenHeight;
        
        //Draw the thing
        calculator.setExpression({id: i.toString(), latex: GetTriangleLatex(triProjected.p[0].x, triProjected.p[0].y, triProjected.p[1].x, triProjected.p[1].y, triProjected.p[2].x, triProjected.p[2].y), color: '#FF0000'});
    }
}, FrameDelay * 1000);
