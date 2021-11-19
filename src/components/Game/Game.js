import React, {useRef} from 'react';

import {Table, Header, Container, Divider, Icon, ItemContent } from 'semantic-ui-react';

import Layout from '../Layout';
import "regenerator-runtime/runtime";

import "./gameSVG.css"

import {Mesh,Polygon} from './Mesh';
import BackgroundEffect from './BackgroundEffect';
import PhysicalObject from './PhysicalObject';
//import ObjTable from './ObjTable.js';
import "../utility.js"
import { getRandomInt, crossProduct } from '../utility.js';
import { intersection } from 'lodash';
class Game extends React.Component {
    
    constructor(props) {
        super(props);
        this.svgRef = React.createRef();
        this.meshGroupRef = React.createRef();
        this.regionGroupRef = React.createRef();
        this.circleGroupRef = React.createRef();
        // this.canvasRef = React.createRef();
        // this.contextRef = React.createRef();
        this.draw = this.draw.bind(this);
        this.update = this.update.bind(this);
        this.initWorld = this.initWorld.bind(this);

        this.moveObj = this.moveObj.bind(this);
 
        this.addPhysicalObject = this.addPhysicalObject.bind(this);

        this.renderTable = this.renderTable.bind(this);
        this.mouseClickHandler = this.mouseClickHandler.bind(this);
        this.saveStates = this.saveStates.bind(this);
        this.loadExistingItems = this.loadExistingItems.bind();
        this.changeHue = this.changeHue.bind(this);


        this.collidesWith = this.collidesWith.bind(this);
       
        this.getTransformedPt = this.getTransformedPt.bind(this);

        this.zoomFocusPt = {x:0, y:0};

        this.panSVG = this.panSVG.bind(this);
      

        this.dragStart = null;
   
        

        this.numOfBackgroundShades = 5;
        this.changeGravityDirection = this.changeGravityDirection.bind(this);
        this.physicalObjects = [];
        this.controlledObjectIndex = -1;
        this.physicalObjectMap = [];

        this.insertRandomizedOrb= this.insertRandomizedOrb.bind(this);
        this.adjustBallsVisibility = this.adjustBallsVisibility.bind(this);

        // this.canvasWidth = 3000;
        // this.canvasHeight = 2000;
        this.canvasWidth = 800;
        this.canvasHeight = 600;

        this.backgroundHue = 220;
        this.backgroundSaturation = 80;
        this.backgroundLightness = 95;


        this.userExertion = 5;      //was 10
        this.grid_length = 75;

        this.fromLocation = null;

        this.lastZoom = {x:this.canvasWidth/2, y:this.canvasHeight/2};

        this.transformMatrix = [1, 0, 0, 1, 0, 0];
        

        this.xGlobalForce = 0.0;
        this.yGlobalForce = 0.0;

        this.closeDragElement = this.closeDragElement.bind(this);
        this.elementDrag = this.elementDrag.bind(this);
        this.dragMouseDown = this.dragMouseDown.bind(this);
      

        this.currentlyDragging=null;
        
        
        this.updateZoom = this.updateZoom.bind(this);
        this.captureZoomEvent = this.captureZoomEvent.bind(this)
        this.zoomIntensity = 0.2;
        this.zoomHasHappened = 0;
        this.contextCurrentOrigin = {x:0,y:0}
        this.zoomPos = {x:0, y:0}
        this.canvasScale = 1;

        this.generateRandomMesh = this.generateRandomMesh.bind(this);
        this.toggleAnimateVertices = this.toggleAnimateVertices.bind(this);
        this.isPointInPath = this.isPointInPath.bind(this);
        this.regionPts = [];
        this.regionSides = [];
        this.ptIdxToEdgeIdx = {}

        this.testPolygon = null;

        
    }



    closeDragElement() {
        this.currentlyDragging = null;
        //document.getElementById("gameSVG").style.cursor = 'grab';
        document.onmouseup = null;
        document.onmousemove = null;
    }

    elementDrag(e) {    
        
        if(!(e.target.id.substr(0,2)=='pt' || e.target.id=="gameSVGBackground")) return e;
        e = e || window.event;
        e.preventDefault();
        if(e.target.id.substr(0,2)=='pt') console.log("dragging " + e.target.id);


        this.lastZoom.x = e.offsetX;
        this.lastZoom.y = e.offsetY;
       
        if(this.dragStart) {
            var pt = this.getTransformedPt(this.lastZoom.x, this.lastZoom.y);
            
            if(e.target.id=='gameSVGBackground') {
                this.panSVG((pt.x-this.dragStart.x)/4, (pt.y-this.dragStart.y)/4)
                
            }
            else if(e.target.id.substr(0,2)=='pt') {
                
                e.target.setAttribute('cx', pt.x);
                e.target.setAttribute('cy', pt.y);
                let ptIndex = parseInt(e.target.id.substr(2));
                //console.log(e.target.id, this.M.ptData[ptIndex].connections, this.M.pts[ptIndex]);
                this.M.pts[ptIndex].x = pt.x;
                this.M.pts[ptIndex].y = pt.y;
              
                for(let edge=0; edge < this.M.ptData[ptIndex].edgeIDs.length;++edge) {
                    let assocEdge = this.M.ptData[ptIndex].edgeIDs[edge];
                    
                    let ptIds = assocEdge.replace('edge','').split('_');
                    let ptA = parseInt(ptIds[0]);
                    let ptB = parseInt(ptIds[1]);
                    
                    var d=``
                    
                    if(ptIds[1]== ptIndex) {
                        //the vertex being dragged is 'Y' in the 'edgeX_Y' naming convention, so change of coordinates that one  only
                        d = `M ${this.M.pts[ptA].x},${this.M.pts[ptA].y}`
                        d += `l ${this.M.pts[ptB].x - this.M.pts[ptA].x},${this.M.pts[ptB].y - this.M.pts[ptA].y}`
                    }
                    else {
                        //the vertex being dragged is 'X' in the 'edgeX_Y' naming convention, so change  coordinates of that one only
                        d = `M ${this.M.pts[ptA].x},${this.M.pts[ptA].y}`
                        d += `l ${this.M.pts[ptB].x - this.M.pts[ptA].x},${this.M.pts[ptB].y - this.M.pts[ptA].y}`
                    }
                    this.svgRef.current.getElementById(assocEdge).setAttribute('d',d);
                }
            }
        }
        
      
        return e.preventDefault() && false;
    }

    dragMouseDown(e) {
        e = e || window.event;
        //console.log("clicked", e.offsetX, e.offsetY)
       

        

        if(this.currentlyDragging==null) {
            this.currentlyDragging = e.target.id;
            if(e.target.id.substr(0,2)=='pt') {
                let ptIndex = parseInt(e.target.id.substr(2));
                console.log(e.target.id, this.M.ptData[ptIndex].connections, this.M.pts[ptIndex], this.M.ptData[ptIndex].mappedPaths);
            }
        }
        
        else if(this.currentlyDragging!= e.target.id) {return;}
    
        this.lastZoom.x = e.offsetX;
        this.lastZoom.y = e.offsetY;

        if(e.target.id=="gameSVGBackground") {
            this.svgRef.current.style.cursor = 'grabbing'
            this.dragStart = this.getTransformedPt(this.lastZoom.x, this.lastZoom.y);
        }
        document.onmouseup = this.closeDragElement;
        document.onmousemove = this.elementDrag;

        return e.preventDefault() && false;
    }



    changeHue = (event) => { this.backgroundHue = event.target.value; }
       
    initWorld = () =>{
        this.addPhysicalObject("user-ellipse", 50,50,25,25,0,0,25,'rgb(24,210,24)',true);
        this.addPhysicalObject("user-ellipse",150,50,25,25,0,0,25,'rgb(150,90,24)', true);
        this.addPhysicalObject("user-ellipse",50,150,25,25,0,0,25,'rgb(54,76,24)', true);
        this.addPhysicalObject("user-ellipse",400,150,25,25,0,0,25,'rgb(54,76,24)', true);
        this.addPhysicalObject("user-ellipse",500,150,25,25,0,0,25,'rgb(54,76,24)', true);
        //this.addPhysicalObject("world-rectangle-stationary",200,300,25,100,0,0,25,'rgb(54,76,24)',true);
        this.addPhysicalObject("user-ellipse",50,400,25,25,0,0,25,'rgb(54,76,24)', true);
        this.addPhysicalObject("user-ellipse",160,150,25,25,0,0,25,'rgb(54,76,24)', true);
        this.addPhysicalObject("user-ellipse",400,400,25,25,0,0,25,'rgb(54,76,24)',true );
        this.addPhysicalObject("user-ellipse",400,75,25,25,0,0,25,'rgb(54,76,24)',true);
        //this.addPhysicalObject("world-irregular-stationary", -1,-1,-1,-1,-1,-1,-1, 'rgb(54,76,24)',true);
        
        //by default, select the first object that can be controlled as the current controlled object.
        // for(var i=0; i < this.physicalObjects.length; ++i) {
        //     if(this.physicalObjects.at(i).controllable) {
        //         this.controlledObjectIndex = i;
        //         break;
        //     }
        // }
    }
    
    addPhysicalObject = (obj_type,x,y, width, height,dx,dy,mass,color,isNew=true) =>{
        //"user-ellipse",x,y,radius,radius,0,0,mass,null,true
        ++this.controlledObjectIndex;
        var obj = {
            index:this.controlledObjectIndex,
            x:x,
            y:y,
            width:width,
            height:height,
            dx:dx,
            dy:dy,
            mass:mass,
            color:color,
            obj_type:obj_type
        }
        this.physicalObjectMap.push(obj);
        var newObj =  new PhysicalObject(this, null, obj_type, "circle"+obj.index  , x, y, width, height, dx,dy,mass,null);
        this.physicalObjects.push(newObj);

        if(isNew) { localStorage.physicalObjectMap = JSON.stringify(this.physicalObjectMap); }
       
        var circleGroup = document.getElementById("circleGroup");
        var newShape = document.createElementNS("http://www.w3.org/2000/svg",'circle');
        newShape.setAttribute('id',"circle"+obj.index);
        newShape.setAttribute('cx',newObj.x);
        newShape.setAttribute('cy',newObj.y);
        newShape.setAttribute('r',newObj.radius);
        newShape.setAttribute('fill', newObj.color);

        newShape.addEventListener('click', (e) => {
            console.log("clicked obj: "+obj.index)
            this.physicalObjects[this.controlledObjectIndex].isSelected = false;
            this.physicalObjects[obj.index].isSelected = true;
            this.controlledObjectIndex = obj.index;
        })
        circleGroup.appendChild(newShape);

    }

    captureZoomEvent = (e) => {
        // var gameSVG = document.getElementById("gameSVG");
        this.lastZoom.x = e.offsetX;
        this.lastZoom.y = e.offsetY;
        let delta = e.wheelDelta/1000;
       
        if(delta) this.updateZoom(delta);

        this.zoomHasHappened = 1;
        return e.preventDefault() && false;
    }
    updateZoom = (delta) => {
        let wheelNorm = delta;
        let zoomVar = Math.pow(this.zoomIntensity,wheelNorm);
       
        for(var i =0; i < 6; ++i) this.transformMatrix[i] *=(zoomVar)
        
        this.transformMatrix[4] += (1-zoomVar)*(this.lastZoom.x);
        this.transformMatrix[5] += (1-zoomVar)*(this.lastZoom.y);

        this.meshGroupRef.current.setAttributeNS(null, "transform", `matrix(${this.transformMatrix.join(' ')})`);
        this.zoomHasHappened = 0;
    }
    getTransformedPt(x,y) {
        var focalPt = new DOMPoint();
        focalPt.x = x;
        focalPt.y = y;
        var matrix = new DOMMatrix(this.transformMatrix)
        return focalPt.matrixTransform(matrix.inverse());
    }

    panSVG(dx,dy) {
        this.transformMatrix[4] += dx;
        this.transformMatrix[5] += dy;
        this.meshGroupRef.current.setAttributeNS(null, "transform", `matrix(${this.transformMatrix.join(' ')})`);
    }
   
    moveObj = (key) => {
        let obj = this.physicalObjects[this.controlledObjectIndex];
        if(key=='ArrowDown') {obj.yVelocity = obj.yVelocity+this.userExertion;}
        else if(key=='ArrowUp') {obj.yVelocity = obj.yVelocity-this.userExertion;}
        else if(key=='ArrowLeft') {obj.xVelocity = obj.xVelocity-this.userExertion;}
        else if(key=='ArrowRight') {obj.xVelocity = obj.xVelocity+this.userExertion;}
        else if(key=='KeyR') {
            obj.angularAccel = 60;
            obj.rotating = true;
        }

    }

    saveStates = () => {
        console.log("saved: " + JSON.stringify(this.physicalObjectMap));
        for(var i=0; i < this.physicalObjectMap.length; ++i) {
            console.log("obj"+i+": x "+  this.physicalObjectMap[i].x)
        }
        localStorage.physicalObjectMap = JSON.stringify(this.physicalObjectMap);
    }

    loadExistingItems = () => {
        var existing_items = JSON.parse(localStorage.physicalObjectMap);
        console.log('existing_items: ' + localStorage.physicalObjectMap); 
        console.log("num of existing items: " +existing_items.length )
        
        this.physicalObjects = [];
        this.physicalObjectMap = [];
        for(var i=0; i < existing_items.length; ++i) {
            this.addPhysicalObject(
                existing_items[i].obj_type,
                existing_items[i].x,
                existing_items[i].y,
                existing_items[i].width,
                existing_items[i].height,
                existing_items[i].dx,
                existing_items[i].dy,
                existing_items[i].mass,
                existing_items[i].color,
                true
            );
        }
        
    }
    componentDidUpdate = () => {
        setInterval(
            () => {
                this.update();
                this.M.update();
                this.draw();
        }, 1000/60);
        

    }
    componentDidMount = () => {
        this.M = new Mesh(this);
        
        this.svgRef.current.addEventListener("wheel",this.captureZoomEvent,false);
        this.svgRef.current.addEventListener("DOMMouseScroll", this.captureZoomEvent,false);
        this.svgRef.current.addEventListener("contextmenu", e => e.preventDefault());           //prevent context menu on right click, only for gameSVG 
        this.svgRef.current.onmousedown = this.dragMouseDown;

        setInterval(
            () => {
            this.update();
            this.M.update();
            this.draw();
        }
        , 1000/60);
        //this.canvasRef.current.addEventListener('mousedown', (e) => {this.mouseClickHandler(this.canvasRef.current,e)});

        if(localStorage.first==null) {
            console.log("loading for first time");
            localStorage.first ='1';         //the first time loading
            this.initWorld();
            this.fromLocation = "/game";
        }

        this.unlisten = this.props.history.listen((location, action) => {
            if(localStorage.first != null) {     //not the first time loading (items already saved)
                if(this.fromLocation =="/game")  this.saveStates();
                   
                if(window.location.pathname == "/game") {
                    this.loadExistingItems();
                    this.fromLocation = "/game";
                }
                this.fromLocation = window.location.pathname; 
            }   
          });

        window.addEventListener("keydown", 
            (e) =>{
                if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
                    e.preventDefault();
                }
                if(e.code=='Space') {this.generateRandomMesh(25,2);}    //try 25
                if(e.code=='KeyQ') {
                    if(document.getElementById("polyGroup").getAttribute("visibility")=="hidden") {
                        document.getElementById("polyGroup").setAttribute("visibility","visible");
                    }
                    else {
                        document.getElementById("polyGroup").setAttribute("visibility","hidden");
                    }
                       
                }
                //if(e.code=='Space') {this.generateRandomMesh(10,2);}
                this.moveObj(e.code);
            }
        );
    }
    
    update = () =>{  
        //if(this.canvasRef.current!=null) {this.contextRef.current = this.canvasRef.current.getContext('2d');}
        this.physicalObjects.forEach((obj,index) => {
            obj.update();
            this.physicalObjectMap[index].x =  obj.x;
            this.physicalObjectMap[index].y =  obj.y;
            this.physicalObjectMap[index].dx = obj.xVelocity;
            this.physicalObjectMap[index].dy = obj.yVelocity;
        })
    }

    draw = () => {
        for(let i=0; i<this.physicalObjects.length;++i) {
            this.physicalObjects[i].draw();
        }
        
    }
    renderTable() {
        let newRows = this.physicalObjectMap.map((obj) => {
            return (
                <Table.Row key={obj[0]}>
                    <Table.Cell title={obj[0]}>{obj[0]} </Table.Cell>
                    <Table.Cell title={obj[1]}>{obj[1]} </Table.Cell>
                    <Table.Cell title={obj[2]}>{obj[2]} </Table.Cell>
                    <Table.Cell title={obj[3]}>{obj[3]} </Table.Cell>
                    <Table.Cell title={obj[4]}>{obj[4]} </Table.Cell>
                    <Table.Cell title={obj[5]}>{obj[5]} </Table.Cell>
                    <Table.Cell title={obj[6]}>{obj[6]} </Table.Cell>
                </Table.Row>
            );
        });
        return newRows;
    }
    mouseClickHandler = (canvas,e) =>{
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        let onObject = false;
        this.physicalObjectMap.forEach((item,index) => {
            var item = this.physicalObjects[index];
            if(item.controllable==true) {
                if(item.shape == 'ellipse') {
                    if((x >= item.x-item.radius) && (x <= item.x+item.radius)) {
                        if((y >= item.y-item.radius) && (y <= item.y+item.radius)) {
                            onObject=true;
                            this.controlledObjectIndex = index;
                        }
                    }
                }
                else if(item.shape == 'rectangle') {
                    if((x >= item.x) && (x <= item.x+item.width)) {
                        if((y >= item.y) && (y <= item.y+item.height)) {
                            onObject = true;
                            this.controlledObjectIndex = index;
                        }
                    }
                }  
            }
        })
        if(!onObject) { this.dragMouseDown(e); }
        
        console.log("x: " + x + " y: " + y)
        
    }

    collidesWith = (circleObj1,circleObj2) => {
        let squaredDist = (circleObj2.x-circleObj1.x)*(circleObj2.x-circleObj1.x) + (circleObj2.y-circleObj1.y)*(circleObj2.y-circleObj1.y);
        if(squaredDist <= (circleObj1.radius+circleObj2.radius)*(circleObj1.radius+circleObj2.radius)) return true;
        else return false;
    }

    insertRandomizedOrb = () =>{
        let mass = getRandomInt(5,200);
        let foundSpot = false;
        var x,y,radius;
        let maxMassReducer = 5;
        let num_of_failures = 0;
        while(foundSpot==false) {
            if(num_of_failures > 50) {console.log("Too many attempts. Try again."); return;}
        
            radius = getRandomInt(5,75-Math.max(maxMassReducer*num_of_failures, 25));
            x = getRandomInt(radius,this.canvasWidth-radius);
            y = getRandomInt(radius,this.canvasHeight-radius);
            
            for(var i=0; i < this.physicalObjects; ++i) {
                let tempObj = {x:x, y:y, radius:radius};
                let collides = this.collidesWith(this.physicalObjects[i], tempObj)
               
                if(collides) {
                    ++num_of_failures;
                    break;
                }
            }
            foundSpot = true;
        }  
        if(foundSpot) this.addPhysicalObject("user-ellipse",x,y,radius,radius,0,0,mass,null,true);
    }

    changeGravityDirection() {
        var gravitySelect = document.getElementById("gravityDirection");
        console.log(gravitySelect.value);
        switch(gravitySelect.value) {
            
            case("Up"): {
                console.log("up detected");
                this.yGlobalForce = -.5;
                this.xGlobalForce = 0;
                break;
            }
            case("Down"): {
                console.log("down detected");
                this.yGlobalForce = .5;
                this.xGlobalForce = 0;
                break;
            }
            case("Left"): {
                console.log("left detected");
                this.xGlobalForce = -.5;
                this.yGlobalForce = 0;
                break;
            }
            case("Right"): {
                console.log("right detected");
                this.xGlobalForce = .5;
                this.yGlobalForce = 0;
                break;
            }
            case("None"): {
                console.log("none detected");
                this.xGlobalForce = 0.0;
                this.yGlobalForce = 0.0;
                break;

            }
        }
    }
    generateRandomMesh = (numPts) => {
        //generate random points
        this.M.build(numPts);
        //this.M.renderAllEdges = true;
        //connect points
        this.M.generateEdges();
        this.M.depthFirstSearch();
        
     
        for(let p=0; p < this.M.pts.length;++p) {
            let newPt = document.createElementNS("http://www.w3.org/2000/svg",'circle');
            //let newPt = this.regionGroupRef.current.createElementNS("http://www.w3.org/2000/svg",'circle');
            newPt.setAttribute('id','pt'+p);
            newPt.setAttribute("class","meshNode")
            newPt.setAttribute('cx', this.M.pts[p].x);
            newPt.setAttribute('cy', this.M.pts[p].y);
            newPt.setAttribute('r', 6);
            newPt.onmousedown = this.dragMouseDown;
            this.regionGroupRef.current.appendChild(newPt);
        }

        var edgeCounter = [];
        for(let e=0; e < this.M.edges.length;++e) {
            if(!edgeCounter.includes(this.M.edges[e].id)) edgeCounter.push(this.M.edges[e].id);
            else continue;
            let a = this.M.pts[this.M.edges[e].data[0]]
            let b = this.M.pts[this.M.edges[e].data[1]]
            let d  = ``;
            d += `M ${a.x}, ${a.y}`;
            d += `L ${b.x}, ${b.y}`;
     
            let newPolygon = document.createElementNS("http://www.w3.org/2000/svg",'path');
            //let newPolygon = this.regionGroupRef.current.createElementNS("http://www.w3.org/2000/svg",'path');
            newPolygon.setAttribute('id',this.M.edges[e].id);
            newPolygon.setAttribute('d',d);
            newPolygon.setAttribute('class','meshRegionBorder')
            if(this.M.renderAllEdges) this.regionGroupRef.current.appendChild(newPolygon);
            
        }
        console.log('this.M.edges', this.M.edges)


        //track polygons (depends on DFS) (Method 2)
        for(let m =0; m < this.M.cyclesDFS.length; ++m) {
            var newPolygon = new Polygon(`polygon${m}`,this.M.cyclesDFS[m], this.M);
            var polygonElement = document.createElementNS("http://www.w3.org/2000/svg",'path');
            polygonElement.setAttributeNS(null,'id',`polygon${m}`);
            //polygonElement.setAttribute('class', 'meshRegion')
            
            let d = ``;
            for(let c=0; c < this.M.cyclesDFS[m].length; ++c) {
                if(c==0) {
                    d += `M ${this.M.pts[this.M.cyclesDFS[m][c]].x},${this.M.pts[this.M.cyclesDFS[m][c]].y}`
                }
                else if(c==this.M.cyclesDFS[m].length-1) {
                    this.M.getEdge(this.M.cyclesDFS[m][c],this.M.cyclesDFS[m][0]).associatedPolygons.push(`polygon${m}`);
                    // let pt1 = this.M.pts[this.M.cyclesDFS[m][c]];
                    // let pt2 = this.M.pts[this.M.cyclesDFS[m][0]];
                   
                    // d += `l ${pt1.x - pt2.x},${pt1.y - pt2.y}`
                }
                else {
                    console.log("this.M.getEdge(this.M.cyclesDFS[m][c],this.M.cyclesDFS[m][c+1])",this.M.getEdge(this.M.cyclesDFS[m][c],this.M.cyclesDFS[m][c+1]))
                    // let pt1 = this.M.pts[this.M.cyclesDFS[m][c]];
                    // let pt2 = this.M.pts[this.M.cyclesDFS[m][c+1]];
                    // d += `l ${pt1.x - pt2.x},${pt1.y - pt2.y}`
                    this.M.getEdge(this.M.cyclesDFS[m][c],this.M.cyclesDFS[m][c+1]).associatedPolygons.push(`polygon${m}`);
                }


                if(c==0) d += `M ${this.M.pts[this.M.cyclesDFS[m][c]].x},${this.M.pts[this.M.cyclesDFS[m][c]].y}`
                else d += `L ${this.M.pts[this.M.cyclesDFS[m][c]].x},${this.M.pts[this.M.cyclesDFS[m][c]].y}`
                
            }
            d += `L ${this.M.pts[this.M.cyclesDFS[m][0]].x},${this.M.pts[this.M.cyclesDFS[m][0]].y}`
            
            polygonElement.setAttribute('d',d);
            this.M.polygons[`polygon${m}`] = newPolygon;
            polygonElement.onmousedown = (e) => {console.log('vertices: ', this.M.polygons[`polygon${m}`].vertices)}
            polygonElement.setAttribute("stroke", "black");
            polygonElement.setAttribute("stroke-width","1");
            polygonElement.setAttribute("stroke-linecap","round");

            //stroke="black" stroke-width="20" stroke-linecap="round"
            let sat = getRandomInt(0,100);
            let light = getRandomInt(0,100);
            polygonElement.setAttributeNS(null,'fill',`hsla(${this.backgroundHue},${sat}%,${light}%,.5)`);
            
            document.getElementById("polyGroup").appendChild(polygonElement);
           
          
        }
        //*************************************************************************************************************** */
        //track polygons (Method 1)
        // for(let p=0; p < this.M.ptData.length;++p) {            //any Point A
        //     let pt = this.M.ptData[p];
        //     let ptNeighbors = pt.connections;

        //     for(let p2=0; p2 < ptNeighbors.length; ++p2) {      //any of Point A's connections, Point B
        //         let otherPt = this.M.ptData[ptNeighbors[p2]];
        //         let otherPtNeighbors = otherPt.connections;

        //         for(let p3=0; p3 < otherPtNeighbors.length; ++p3) {     //Point B's connections (exclude Point A)
        //             if(otherPtNeighbors[p3]==pt.index) continue;
                    
        //             let distantPt = this.M.ptData[otherPtNeighbors[p3]];
        //             let distantPtNeighbors = distantPt.connections;

        //             if(distantPtNeighbors.includes(pt.index)) {    //loop completed as a triangle
        //                 let polygonID = `polygon${pt.index}_${otherPt.index}_${distantPt.index}`;
        //                 var newPolygon = new Polygon(polygonID,[pt.index,otherPt.index, distantPt.index], this.M);
                        
        //                 var polygonElement = document.createElementNS("http://www.w3.org/2000/svg",'path');

        //                 this.M.polygons[polygonID] = newPolygon;

        //                 //let newPolygon = this.regionGroupRef.current.createElementNS("http://www.w3.org/2000/svg",'path');
                        
                        

        //                 polygonElement.setAttributeNS(null,'id',polygonID);

        //                 let dLine1 = {x:this.M.pts[otherPt.index].x-this.M.pts[pt.index].x,
        //                             y:this.M.pts[otherPt.index].y-this.M.pts[pt.index].y}

        //                 let dLine2 = {x:this.M.pts[distantPt.index].x-this.M.pts[otherPt.index].x,
        //                     y:this.M.pts[distantPt.index].y-this.M.pts[otherPt.index].y}

        //                 let dLine3 = {x:this.M.pts[pt.index].x-this.M.pts[distantPt.index].x,
        //                     y:this.M.pts[pt.index].y-this.M.pts[distantPt.index].y}

        //                 // let d = `
        //                 //     M ${this.M.pts[pt.index].x},${this.M.pts[pt.index].y}
        //                 //     L ${this.M.pts[otherPt.index].x},${this.M.pts[otherPt.index].y}
        //                 //     L ${this.M.pts[distantPt.index].x},${this.M.pts[distantPt.index].y}
        //                 //     L ${this.M.pts[pt.index].x},${this.M.pts[pt.index].y}
        //                 // `
        //                 let d = `
        //                     M ${this.M.pts[pt.index].x},${this.M.pts[pt.index].y}
        //                     l ${dLine1.x},${dLine1.y}
        //                     l ${dLine2.x},${dLine2.y}
        //                     l ${dLine3.x},${dLine3.y}
        //                 `

        //                 polygonElement.setAttributeNS(null,'d',d);
        //                 polygonElement.setAttribute('class', 'meshRegion');
        //                 polygonElement.onmousedown = (e) => {console.log('vertices: ', this.M.polygons[polygonID].vertices)}
        //                 //let hue = getRandomInt(0,355);
        //                 // let hue = 220;
        //                 // let sat = getRandomInt(0,100);
        //                 // let light = getRandomInt(0,100);
        //                 // newPolygon.setAttributeNS(null,'fill',`hsla(${hue},50%,50%, .5)`);
        //                 //newPolygon.setAttributeNS(null,'fill',`hsla(${this.backgroundHue},${sat}%,${light}%,.5)`);
                        
        //                 document.getElementById("polyGroup").appendChild(polygonElement);
        //                 //this.regionGroupRef.current.appendChild(newPolygon); 
        //             }
        //         }
        //     }
        // }
        console.log("all vertices", this.M.ptData);
    }


    isPointInPath(pt, polygon) {
        var num = polygon.length;
        let j = num - 1;
        let result = false;
        for(let i =0; i < num; ++i) {
            if((pt.x == polygon[i].x) && (pt.y==polygon[i].y)) return true;
            
            if((polygon[i].y > pt.y) != (polygon[j].y > pt.y) ) {
                let slope = (pt.x-polygon[i].x)*(polygon[j].y-polygon[i].y) - (polygon[j].x-polygon[i].x)*(pt.y-polygon[i].y);
                if(slope==0) {
                    console.log("point intersects")
                    return true;
                }
                if((slope < 0) != (polygon[j].y < polygon[i].y)) result=!result;
            }
            j=i;


        }
        return result;
    }
    adjustBallsVisibility(e) {
        if(e.target.textContent.substr(0,4)=="Hide") {
            e.target.textContent = "Show orbs";
            document.getElementById("circleGroup").setAttribute("visibility","hidden");
        }
        else {
            e.target.textContent = "Hide orbs";
            document.getElementById("circleGroup").setAttribute("visibility","visible");
        }
        console.log(e.target.textContent);
    }
    toggleAnimateVertices(e) {
        this.M.animateMesh = !this.M.animateMesh;
    }
    //<feTurbulence in="light" type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence"/>
    render = () =>{
        //width={this.canvasWidth} height={this.canvasHeight}
        return (
            <Layout title="Game Page" description="A description about the game">
                <Container>
                    <Header as="h3">Another header</Header>
                </Container>
                <div id="viewAndPanel" width={this.canvasWidth} height={this.canvasHeight}>
                    <svg id="gameSVG"  ref={this.svgRef}  width={this.canvasWidth} height={this.canvasHeight} xmlns="http://www.w3.org/2000/svg"> 
                        

                        <rect id="gameSVGBackground" ref={this.svgRef} width="100%" height="100%" fill='grey' /*style={{filter:'url(#filter)'}}*//>
                        <g id="meshGroup" ref={this.meshGroupRef} transform="matrix(1 0 0 1 0 0)" >
                            <g id="regionGroup" ref={this.regionGroupRef} transform="matrix(1 0 0 1 0 0)" />
                            <g id="polyGroup" transform="matrix(1 0 0 1 0 0)"  />
                            <g id="circleGroup" ref={this.circleGroupRef} transform="matrix(1 0 0 1 0 0)"/>
                        </g>
                    </svg>

                    <Container id="gameControlPanel">
                        <button id="addOrbButton" onClick={this.insertRandomizedOrb} >
                            <Icon name='add' />
                        </button> 
                        
                        <Divider />
                        <div>
                            <button id="ballsVisibilityButton" onClick = {this.adjustBallsVisibility}>Hide orbs</button>
                        </div>
                        <div>
                            <label for="animateVertices">Mesh:</label>
                            <button id="animateVerticesButton" onClick = {this.toggleAnimateVertices}>Toggle Animation</button>
                        </div>
                        <div>
                            <label for="gravityDirection">Tilt</label>
                            <select name="gravityDirection" id="gravityDirection" style={{width:75}} onChange={this.changeGravityDirection}>
                                <option value="None">None</option>
                                <option value="Up">Up</option>
                                <option value="Down">Down</option>
                                <option value="Left">Left</option>
                                <option value="Right">Right</option>
                            </select>
                        </div>
                        <div>
                            <label for="hueRange">Hue</label>
                            <input type="range" min="0" max="360" id="hueRange" onInput={this.changeHue} style={{width:75}}></input>
                        </div>
                    </Container>      
                </div>
            </Layout>
        );
    }
}



export default Game;
