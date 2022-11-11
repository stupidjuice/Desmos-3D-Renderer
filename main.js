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