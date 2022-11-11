//calculator
var elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt);

//other vars lol
const maxTriangles = 64; //increasing this will slow the calculator down (a lot)

Initialize();
calculator.setExpression({id: '0', latex: GetTriangleLatex(5, 3, 2, 3, 5, 10), color: '#FF0000'});

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
 * 
 * @param {vector3} i vector3 to be multiplied
 * @param {vector3} o vector3 output
 * @param {mat4x4} m matrix to be multiplied
 */
 function MultiplyMatrixVector(i, o, m)
 {
    temp = new vector3();
    temp.x = i.x * m.m[0][0] + i.y * m.m[1][0] + i.z * m.m[2][0] + m.m[3][0];
	temp.y = i.x * m.m[0][1] + i.y * m.m[1][1] + i.z * m.m[2][1] + m.m[3][1];
	temp.z = i.x * m.m[0][2] + i.y * m.m[1][2] + i.z * m.m[2][2] + m.m[3][2];
	w = i.x * m.m[0][3] + i.y * m.m[1][3] + i.z * m.m[2][3] + m.m[3][3];

	if (w != 0.0)
	{
		temp.x /= w; o.y /= w; o.z /= w;
	}
    return temp;
 }

class mat4x4
{
    constructor()
    {
        this.m = [ [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0] ];
    }
}

class vector3
{
    constructor()
    {
        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;
    }
}

class triangle
{
    constructor()
    {
        this.p = [new vector3(), new vector3(), new vector3()]
    }
}

class mesh 
{
    constructor()
    {
        this.tris = []
    }
}