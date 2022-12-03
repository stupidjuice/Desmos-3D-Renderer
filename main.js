//calculator
var elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt);

//other vars lol
const ScreenHeight = 20.0;
const ScreenWidth = 20.0;
const FrameDelay = 0.01; //seconds

//render vars
let ElapsedTime = 0.0;
const minBrightness = 10;

//rotation
//conversion between degrees and radians
const Deg2Rad = Math.PI / 180;
const Rad2Deg = 180 / Math.PI;
const FullRotRad = 360 * Deg2Rad;

let autoRotate = true;
let modelRotX = 0;
let modelRotY = 0;
let modelRotZ = 0;

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
        this.col = '#FF0000';    
        this.distanceToCam = 0.0;
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
let fNear = 0.1;
let fFar = 1000.0;
let fFov = 90.0;
let fAspectRatio = ScreenHeight / ScreenWidth;
let fFovRad = 1.0 / Math.tan(fFov * 0.5 / 180.0 * Math.PI);

let matProj = new mat4x4();

matProj.m[0][0] = fAspectRatio * fFovRad;
matProj.m[1][1] = fFovRad;
matProj.m[2][2] = fFar / (fFar - fNear);
matProj.m[3][2] = (-fFar * fNear) / (fFar - fNear);
matProj.m[2][3] = 1.0;
matProj.m[3][3] = 0.0;

//cube
let meshCube = new mesh();
let meshcubeobj = "v 1.000000 1.000000 -1.000000\nv 1.000000 -1.000000 -1.000000\nv 1.000000 1.000000 1.000000\nv 1.000000 -1.000000 1.000000\nv -1.000000 1.000000 -1.000000\nv -1.000000 -1.000000 -1.000000\nv -1.000000 1.000000 1.000000\nv -1.000000 -1.000000 1.000000\nf 5 3 1\nf 3 8 4\nf 7 6 8\nf 2 8 6\nf 1 4 2\nf 5 2 6\nf 5 7 3\nf 3 7 8\nf 7 5 6\nf 2 4 8\nf 1 3 4\nf 5 1 2";
meshCube = GetMeshFromOBJ(meshcubeobj);

//returns latex of a triangle
function GetTriangleLatex(x1, y1, x2, y2, x3, y3)
{
    return '\\polygon((' + x1.toString() + ', ' + y1.toString() + '), (' + x2.toString() + ', ' + y2.toString() + '), (' + x3.toString() + ', ' + y3.toString() + '))';
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

function GetTriangle(p1, p2, p3)
{
    return new triangle(new vector3(p1[0], p1[1], p1[2]), new vector3(p2[0], p2[1], p2[2]), new vector3(p3[0], p3[1], p3[2]));
}

/**
 * @param {string} objStr
 */
function GetMeshFromOBJ(objStr)
{
    let objArray = objStr.split('\n');
    let verts = [];
    let faces = [];
    let returnmesh = new mesh();

    for(let i = 0; i < objArray.length; i++)
    {
        let objLine = objArray[i].split(' ')
        if(objLine[0] == 'v')
        {
            verts.push([objLine[1], objLine[2], objLine[3]]);
        }
        else if (objLine[0] == 'f')
        {
            faces.push(GetTriangle(verts[objLine[1] - 1], verts[objLine[2] - 1], verts[objLine[3] - 1]));
        }
    }

    returnmesh.tris = faces;
    return returnmesh;
}

//adds text box into desmos
function AddComment(id, comment)
{
    let curState = calculator.getState();
    curState.expressions.list.push({id: id, type: 'text', text: comment})
    calculator.setState(curState);
}

function Initialize()
{
    //adds sliders and text boxes so user can control it
    //options 
    AddComment('opt', '   ======DISPLAY OPTIONS======');

    AddComment('opacity', '-------Fill Opacity-------');
    calculator.setExpression({id: 'slid1', latex: 'o = 100', sliderBounds: { min: '0', max: '100', step: '1' }});

    AddComment('thickness', '-------Line Thinckness-------');
    calculator.setExpression({id: 'slid2', latex: 't = 1', sliderBounds: { min: '1', max: '10', step: '1' }});

    AddComment('labelvert', '-------Label Verticies (0 = false, 1 = true)-------')
    calculator.setExpression({id: 'slid3', latex: 'v = 0', sliderBounds: { min: '0', max: '1', step: '1' }});

    AddComment('backcull', '-------Backface Culling-------');
    calculator.setExpression({id: 'slid4', latex: 'b = 1', sliderBounds: { min: '0', max: '1', step: '1' }});

    //rotation
    AddComment('rotopt', '======ROTATION======');

    AddComment('xrot', '-------X Rotation-------');
    calculator.setExpression({id: 'slid5', latex: 'j = 0', sliderBounds: { min: '0', max: '360' }});

    AddComment('yrot', '-------Y Rotation-------');
    calculator.setExpression({id: 'slid6', latex: 'k = 0', sliderBounds: { min: '0', max: '360' }});

    AddComment('zrot', '-------Z Rotation-------');
    calculator.setExpression({id: 'slid7', latex: 'l = 0', sliderBounds: { min: '0', max: '360' }});

    AddComment('autorot', '=====Auto Rotate=====');
    calculator.setExpression({id: 'slid8', latex: 'a = 1', sliderBounds: { min: '0', max: '1', step: '1' }});
}

//---------------------------------------ACTUAL RENDERING CODE---------------------------------------
Initialize();
let vCamera = new vector3();
let light_direction = new vector3(-1.0, 0.5, -1.0);
//normalize light direction (or else the lighting will be extremely overdone)
let len = Math.sqrt(light_direction.x * light_direction.x + light_direction.y * light_direction.y + light_direction.z * light_direction.z);
light_direction.x /= len; light_direction.y /= len; light_direction.z /= len;

let numLabeledVerts = 0;
let prevNumLabeledVerts = 0;

let hasReadFile = false;

//main loop
setInterval(function() {
    let exprs = calculator.getExpressions();
    //----HTML UPDATE----
    let opacity = exprs[3].latex.split(' ')[2];
    let lineThickness = exprs[5].latex.split(' ')[2];
    let labelVerts = exprs[7].latex.split(' ')[2] == 1;
    let backfaceCulling = exprs[9].latex.split(' ')[2] == 1;

    let labeledCoords = [];

    //read upload file
    var fileupload = document.getElementById("uploadfile");
    fileupload.addEventListener('change',function() {
        var fileReader=new FileReader();
        fileReader.onload=function(){
            if(!hasReadFile)
            {
                hasReadFile = true;
                meshCube = GetMeshFromOBJ(fileReader.result.toString());
            }
        }
        fileReader.readAsText(this.files[0]);
    })

    //----RENDER----
    //update variables
    ElapsedTime += FrameDelay;
    let TimeScale = 3;

    //handle rotations
    autoRotate = exprs[18].latex.split(' ')[2] == 1;
    if(autoRotate)
    {
        modelRotX += FrameDelay;
        modelRotY += FrameDelay;
        modelRotZ += FrameDelay;

        //if rotation > 360 degrees, subtract 360 degrees so that it always stays between 0-360 degrees
        if(modelRotX > FullRotRad) { modelRotX -= FullRotRad } if(modelRotX < -FullRotRad) { modelRotX += FullRotRad }
        if(modelRotY > FullRotRad) { modelRotY -= FullRotRad } if(modelRotY < -FullRotRad) { modelRotY += FullRotRad }
        if(modelRotZ > FullRotRad) { modelRotZ -= FullRotRad } if(modelRotZ < -FullRotRad) { modelRotZ += FullRotRad }

        calculator.setExpression({id: 'slid5', latex: 'j = ' + modelRotX * Rad2Deg});
        calculator.setExpression({id: 'slid6', latex: 'k = ' + modelRotX * Rad2Deg});
        calculator.setExpression({id: 'slid7', latex: 'l = ' + modelRotX * Rad2Deg});
    }
    else
    {
        //get rotation from sliders in desmos
        modelRotX = exprs[12].latex.split(' ')[2] * Deg2Rad;
        modelRotY = exprs[14].latex.split(' ')[2] * Deg2Rad;
        modelRotZ = exprs[16].latex.split(' ')[2] * Deg2Rad;
    }

    let matRotZ = new mat4x4();
    let matRotY = new mat4x4();
    let matRotX = new mat4x4();

    //rotation Z
    matRotZ.m[0][0] = Math.cos(modelRotZ);
    matRotZ.m[0][1] = Math.sin(modelRotZ); 
    matRotZ.m[1][0] = -Math.sin(modelRotZ);
    matRotZ.m[1][1] = Math.cos(modelRotZ);
    matRotZ.m[2][2] = 1.0;
    matRotZ.m[3][3] = 1.0;

    //rotation y
    matRotY.m[0][0] = Math.cos(modelRotY)
    matRotY.m[1][1] = 1.0;
    matRotY.m[2][0] = Math.sin(modelRotY) 
    matRotY.m[0][2] = -Math.sin(modelRotY)
    matRotY.m[2][2] = Math.cos(modelRotY)
    matRotY.m[3][3] = 1.0;

    //rotation X
    matRotX.m[0][0] = 1.0;
    matRotX.m[1][1] = Math.cos(modelRotX);
    matRotX.m[1][2] = Math.sin(modelRotX);
    matRotX.m[2][1] = -Math.sin(modelRotX);
    matRotX.m[2][2] = Math.cos(modelRotX);
    matRotX.m[3][3] = 1.0;

    //triangles to sort later
    let vecTrianglesToRaster = [];
    let indicesToDraw = [];

    for(let i = 0; i < meshCube.tris.length; i++)
    {
        //a bunch of triangles that will be used for each transformation/projection
        let tri = JSON.parse(JSON.stringify(meshCube.tris[i]));
        let triTranslated = new triangle();
        let triProjected = new triangle();
        let triRotatedZ = new triangle();
        let triRotatedZY = new triangle();
        let triRotatedZYX = new triangle();

        //rotate z
        triRotatedZ.p[0] = MultiplyMatrixVector(tri.p[0], matRotZ);
        triRotatedZ.p[1] = MultiplyMatrixVector(tri.p[1], matRotZ);
        triRotatedZ.p[2] = MultiplyMatrixVector(tri.p[2], matRotZ);
        
        //rotate y
        triRotatedZY = JSON.parse(JSON.stringify(triRotatedZ));
        triRotatedZY.p[0] = MultiplyMatrixVector(triRotatedZ.p[0], matRotY);
        triRotatedZY.p[1] = MultiplyMatrixVector(triRotatedZ.p[1], matRotY);
        triRotatedZY.p[2] = MultiplyMatrixVector(triRotatedZ.p[2], matRotY);

        //rotate x
        triRotatedZYX = JSON.parse(JSON.stringify(triRotatedZY));
        triRotatedZYX.p[0] = MultiplyMatrixVector(triRotatedZY.p[0], matRotX);
        triRotatedZYX.p[1] = MultiplyMatrixVector(triRotatedZY.p[1], matRotX);
        triRotatedZYX.p[2] = MultiplyMatrixVector(triRotatedZY.p[2], matRotX);

        //translate forward away from camera
        triTranslated = JSON.parse(JSON.stringify(triRotatedZYX));
        triTranslated.p[0].z = triRotatedZYX.p[0].z + 5.0;
        triTranslated.p[1].z = triRotatedZYX.p[1].z + 5.0;
        triTranslated.p[2].z = triRotatedZYX.p[2].z + 5.0;

        //get normal using some weird math wizardry (wtf is a cross product?????)
        let normal = new vector3();
        let line1 = new vector3();
        let line2 = new vector3();

        line1.x = triTranslated.p[1].x - triTranslated.p[0].x;
        line1.y = triTranslated.p[1].y - triTranslated.p[0].y;
        line1.z = triTranslated.p[1].z - triTranslated.p[0].z;

        line2.x = triTranslated.p[2].x - triTranslated.p[0].x;
        line2.y = triTranslated.p[2].y - triTranslated.p[0].y;
        line2.z = triTranslated.p[2].z - triTranslated.p[0].z;

        normal.x = line1.y * line2.z - line1.z * line2.y;
        normal.y = line1.z * line2.x - line1.x * line2.z;
        normal.z = line1.x * line2.y - line1.y * line2.x;

        //normalize normal (hehe)
        let len = Math.sqrt(normal.x * normal.x  +  normal.y * normal.y  +  normal.z * normal.z);
        normal.x /= len; normal.y /= len; normal.z /= len;  

        //only project and draw triangle if it is facing camera
        if(normal.x * (triTranslated.p[0].x - vCamera.x) + normal.y * (triTranslated.p[0].y - vCamera.y) + normal.z * (triTranslated.p[0].z - vCamera.z) < 0.0 || !backfaceCulling)
        {
            //lighting
            let brightness = Math.min(Math.max(Math.round((normal.x * light_direction.x + normal.y * light_direction.y + normal.z * light_direction.z) * 150), 0) + minBrightness, 255).toString(16);;
            let brightnessRGB = (brightness.length == 1 ? "0" + brightness : brightness);
            brightnessRGB = '#' + brightnessRGB + brightnessRGB + brightnessRGB;

            //project
            triProjected.p[0] = MultiplyMatrixVector(triTranslated.p[0], matProj);
            triProjected.p[1] = MultiplyMatrixVector(triTranslated.p[1], matProj);
            triProjected.p[2] = MultiplyMatrixVector(triTranslated.p[2], matProj);
            
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

            //if the label vertices button is pressed, add the triangles' points to this array
            if(labelVerts)
            {
                labeledCoords.push('(' + triProjected.p[0].x.toString() + ', ' + triProjected.p[0].y.toString() + ')');
                labeledCoords.push('(' + triProjected.p[1].x.toString() + ', ' + triProjected.p[1].y.toString() + ')');
                labeledCoords.push('(' + triProjected.p[2].x.toString() + ', ' + triProjected.p[2].y.toString() + ')');
            }
        
            //Add triangle to list to be sorted and then drawn
            triProjected.col = brightnessRGB;
            triProjected.distanceToCam = ((triProjected.p[0].z + triProjected.p[1].z + triProjected.p[2].z) / 3.0)
            vecTrianglesToRaster.push(triProjected);
            indicesToDraw.push(i);
        }
        //if the face is not facing the camera, make it a black dot thats off the screen so its not in the way
        else
        {
            calculator.setExpression({id: i.toString(), latex: '(-10, 0)', color:'#000000'}); 
        }
    }
    
    //TURN INTO FUNCTION EXPRESSION LATER
    vecTrianglesToRaster.sort((t1, t2) => ( t1.distanceToCam > t2.distanceToCam ? -1 : 1));
    
    for(let i = 0; i < vecTrianglesToRaster.length; i++)
    {
        calculator.setExpression({id: indicesToDraw[i], latex: GetTriangleLatex(vecTrianglesToRaster[i].p[0].x, vecTrianglesToRaster[i].p[0].y, vecTrianglesToRaster[i].p[1].x, vecTrianglesToRaster[i].p[1].y, vecTrianglesToRaster[i].p[2].x, vecTrianglesToRaster[i].p[2].y), color: vecTrianglesToRaster[i].col, fillOpacity: opacity / 100, lineWidth: lineThickness});
    }

    if(labelVerts)
    {
        //use this hack to remove duplicates from the array of vertices
        let uniqueCoords = [...new Set(labeledCoords)];
        numLabeledVerts = uniqueCoords.length;

        for(let i = 0; i < numLabeledVerts; i++)
        {
            if(i < uniqueCoords.length)
            {
                calculator.setExpression({id: 'vertlabel' + (i).toString(), latex: uniqueCoords[i], showLabel: true});
            }
        }
        //remove any verts that have disappeared from the screen (ex. if they are hidden behind a face on the cube)
        if(prevNumLabeledVerts - numLabeledVerts > 0)
        {
            for(let i = 0; i < prevNumLabeledVerts - numLabeledVerts; i++)
            {
                calculator.setExpression({id: 'vertlabel' + (i+numLabeledVerts).toString(), latex: '(-10, 0)', color:'#000000'});
            }
        }
        prevNumLabeledVerts = numLabeledVerts;
    }
    else
    {
        //when the label verts button is unchecked, hide all of the verts
        for(let i = 0; i < numLabeledVerts; i++)
        {
            calculator.setExpression({id: 'vertlabel' + (i).toString(), latex: '(-10, 0)', color:'#000000'});
        }
        numLabeledVerts = 0;
    }
    
}, FrameDelay * 1000);
