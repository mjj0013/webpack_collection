import React, {useState,createRef} from 'react';
import {Container } from 'semantic-ui-react';
import Modal from 'react-bootstrap/Modal'
import Tabs from 'react-bootstrap/Tabs';
import Spinner from 'react-bootstrap/Spinner'
import Tab from 'react-bootstrap/Tab';

import Layout from './Layout';
import "regenerator-runtime/runtime";
import { documentElement } from 'min-document';
import {ImageScan} from './imageManip.js'
import {Curve} from './Curve.js'
import {Cluster} from './Cluster.js';
import {objExistsInArray, removeAllChildNodes,mergeSubElements,getRandomInt,getStdDev,getTransformedPt, numberInRange,distance} from './utility.js'
import {scanRadiusForCorner} from './imageManipUtility.js'
// var geval = eval;
import { Matrix, solve } from 'ml-matrix';

class FileManipPage extends React.Component {
    constructor(props) {
        super(props);
        this.loadText= this.loadText.bind(this);
        this.numOfPagesChanged= this.numOfPagesChanged.bind(this);
        this.loadImage = this.loadImage.bind(this);
        this.showValuesOnHover = this.showValuesOnHover.bind(this)
        this.selectImageLayerToDisplay = this.selectImageLayerToDisplay.bind(this);
        this.tracingWindow = this.tracingWindow.bind(this);
        this.edgeTracer = this.edgeTracer.bind(this);
        this.selectedImage = null
        this.state = {num:''};

        this.curveObjs = [];
        this.setImageLayers = this.setImageLayers.bind(this);
        
        
        this.currentImageLayerIdx = 0;

        //SVG zoom handling functions
        this.captureZoomEvent = this.captureZoomEvent.bind(this);
        this.updateZoom = this.updateZoom.bind(this);
        this.lastZoom = {x:0,y:0};
        this.zoomHasHappened = false;
        this.zoomIntensity = 0.2;
        this.transformMatrix = [1, 0, 0, 1, 0, 0];

        //SVG drag handling functions
        this.makeDraggable = this.makeDraggable.bind(this);
        this.closeDragElement = this.closeDragElement.bind(this);
        this.elementDrag = this.elementDrag.bind(this);
        this.dragMouseDown = this.dragMouseDown.bind(this);
        this.panSVG = this.panSVG.bind(this);
        this.resultSVGModeSelect = this.resultSVGModeSelect.bind(this)
        this.currentlyDragging = null;
        this.selectBoxOrigin = {x:0,y:0}
        this.currentSVGCursorMode = "drag"

        // Loading panel's handler functions
        this.handlePanelClose = this.handlePanelClose.bind(this);
        this.handlePanelShow = this.handlePanelShow.bind(this);
        this.state = {show:false, loadPercent:0, showLoadMessage0:false, showLoadMessage1:false, showLoadMessage2:false}
        this.loadingCurrentStep=-1;


        this.allCurveData = {}    
        this.allCornerData = {}  
        //keys will be the name of the curve
        //will have object of form: <key>: {pts:[..],  curveObj:..}
        //this hopefully enables the merging of clusters and redrawing of curves

        this.testPts = [];
        this.testCurves = []
        this.testCurveSplit = this.testCurveSplit.bind(this);


    }
    resultSVGModeSelect = (e) =>{
        if(e.target.id=="dragButton") {
            this.currentSVGCursorMode = "drag"
            var resultSVG = document.getElementById("resultSVG");
            resultSVG.style.cursor = 'grab'
            e.target.classList.add("selected")
            document.getElementById("selectButton").classList.remove("selected");
        }
        if(e.target.id=="selectButton") {
            this.currentSVGCursorMode = "select"
            var resultSVG = document.getElementById("resultSVG");
            resultSVG.style.cursor = 'crosshair'
            e.target.classList.add("selected");
            document.getElementById("dragButton").classList.remove("selected");
        }
    }

    async testCurveSplit() {
        return new Promise((resolve,reject) => {
            var intersections = []
            for(let c1=0; c1 < this.testCurves.length; ++c1) {
                var alreadyExists = false;
                for(let c2=0; c2 < this.testCurves.length; ++c2) {
                    if(c1==c2) continue;
                    
                    for(let i=0; i < intersections.length; ++i) {
                        if(intersections[i].segments[0]==c2 && intersections[i].segments[1]==c1) {
                            alreadyExists=true;
                            break;
                        }
                        
                    }
                    if(alreadyExists) continue;
                    var curveObj1 = this.testCurves[c1].curveObj;
                    var curveObj2 = this.testCurves[c2].curveObj;
                    for(let x=curveObj1.xMin; x <= curveObj1.xMax; ++x) {
                        var result1 = Math.round(curveObj1.evaluate(x));
                        var result2 = Math.round(curveObj2.evaluate(x));
                        if(numberInRange(result1,result2,1)) {
                            for(let i=0; i < intersections.length; ++i) {
                                if(distance(intersections[i], {x:x, y:result1}) < 25) {alreadyExists=true; break;}
                            }
                            if(alreadyExists) continue;
                            var circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
                            circle.setAttribute("id",`intersection${intersections.length}`)
                            circle.setAttribute("cx",x);
                            circle.setAttribute("cy",result1);
                            circle.setAttribute("r",5);
                            circle.setAttribute("stroke",`red`);
                            circle.setAttribute("fill","red");
                            document.getElementById("ptGroup").append(circle);
                            intersections.push({segments:[curveObj1, curveObj2], currentIndices:[c1,c2], x:x, y:result1})
                            
                        }
                    }
                }
            }

            console.log('intersections',intersections)
            
            for(var i=0; i < intersections.length; ++i) {
                var I = intersections[i];
                var curveObj1 = I.segments[0]
                var curveObj2 = I.segments[1]
                if(!['horizontal', 'vertical'].includes(curveObj1.getCurrentSlope())) {
                               
                    var segments = curveObj1.split(I);
                    console.log('segments',segments)
                    var newCurve1 = segments[0];
                   

                    var newCurveId1 = curveObj1.equationId+"_1"
                    // newCurve1.initCurve();
                    let xMin1=newCurve1.xRange[0];
                    let xMax1=newCurve1.xRange[1];   
                    // geval(newCurve1.currentEquationStr)
                    var curveFunc1 = newCurve1.evaluate
                    console.log("newCurve1", newCurve1)
                    var P1 = {x:xMin1, y:curveFunc1(xMin1)}
                    var P2 = {x:xMax1, y:curveFunc1(xMax1)}
                    var curveDerivativeMin = newCurve1.currentDerivative(xMin1);
                    var QC = {x:(xMin1+xMax1)/2,  y:P1.y+curveDerivativeMin*(xMax1-xMin1)/2}
                
                    var d = `M${P1.x},${P1.y} Q${QC.x},${QC.y},${P2.x},${P2.y} `
                    var path1 = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path1.setAttribute("id",newCurveId1)
                    path1.setAttribute("d",d);
                    path1.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                    path1.setAttribute("fill","none");
                    path1.addEventListener("mouseover", (e)=>{
                        console.log(e.target.id)
                    }, false);
                    document.getElementById("curveGroup").append(path1);
                    this.testCurves.splice(I.currentIndices[0],1);
                    this.testCurves.push({curveObj:newCurve1, curveId:newCurveId1})
          
                    var newCurveId2 = curveObj1.equationId+"_2"
                    var newCurve2 = segments[1];
                    // newCurve2.initCurve();
             
                    let xMin2=newCurve2.xRange[0];
                    let xMax2=newCurve2.xRange[1];
                    
                    var curveFunc2 = newCurve2.evaluate;
                    var P1 = {x:xMin2, y:curveFunc2(xMin2)}
                    var P2 = {x:xMax2, y:curveFunc2(xMax2)}
                    var curveDerivativeMin = newCurve2.currentDerivative(xMin2);
                    var QC = {x:(xMin2+xMax2)/2,  y:P1.y+curveDerivativeMin*(xMax2-xMin2)/2}
                
                    var d = `M${P1.x},${P1.y} Q${QC.x},${QC.y},${P2.x},${P2.y} `
                    var path2 = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path2.setAttribute("id",newCurveId2)
                    path2.setAttribute("d",d);
                    path2.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                    path2.setAttribute("fill","none");
                    path2.addEventListener("mouseover", (e)=>{
                        console.log(e.target.id)
                    }, false);
                    document.getElementById("curveGroup").append(path2);
                    this.testCurves.push({curveObj:newCurve2, curveId:newCurveId2})
                    console.log("removing "+curveObj1.equationId)
                    document.getElementById(curveObj1.equationId).remove()
                    
                }
                // if(I.x > curveObj2.xMin && I.x < curveObj2.xMax) {
                if(!['horizontal', 'vertical'].includes(curveObj2.getCurrentSlope())) {
                    var segments = curveObj2.split(I);
                    console.log('segments',segments)
                    var newCurve1 = segments[0];
                    var newCurve2 = segments[1];
                    var newCurveId1 = curveObj2.equationId+"_1"
                 
                    let xMin1=newCurve1.xRange[0];
                    let xMax1=newCurve1.xRange[1];
                    // geval(newCurve1.currentEquationStr)
                    // var curveFunc1 = geval(newCurve1.currentEquationName);
                    var curveFunc1 = newCurve1.evaluate;
                    console.log("newCurve1", newCurve1)
                    var P1 = {x:xMin1, y:curveFunc1(xMin1)}
                    var P2 = {x:xMax1, y:curveFunc1(xMax1)}
                    var curveDerivativeMin = newCurve1.currentDerivative(xMin1);
                    var QC = {x:(xMin1+xMax1)/2,  y:P1.y+curveDerivativeMin*(xMax1-xMin1)/2}
                
                    var d = `M${P1.x},${P1.y} Q${QC.x},${QC.y},${P2.x},${P2.y} `
                    
                    var path1 = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path1.setAttribute("id",newCurveId1)
                    path1.setAttribute("d",d);
                    path1.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                    path1.setAttribute("fill","none");
                    path1.addEventListener("mouseover", (e)=>{
                        console.log(e.target.id)
                    }, false);
                    document.getElementById("curveGroup").append(path1);
                   
                    this.testCurves.splice(I.currentIndices[1],1);
                    this.testCurves.push({curveObj:newCurve1, curveId:newCurveId1})
                  
                  

                    var newCurveId2 = curveObj2.equationId+"_2"
                    let xMin2=newCurve2.xRange[0];
                    let xMax2=newCurve2.xRange[1];
                
                    var curveFunc2 = newCurve2.evaluate;
                    var P1 = {x:xMin2, y:curveFunc2(xMin2)}
                    var P2 = {x:xMax2, y:curveFunc2(xMax2)}
                    var curveDerivativeMin = newCurve2.currentDerivative(xMin2);
                    var QC = {x:(xMin2+xMax2)/2,  y:P1.y+curveDerivativeMin*(xMax2-xMin2)/2}
                
                    var d = `M${P1.x},${P1.y} Q${QC.x},${QC.y},${P2.x},${P2.y} `
                    
                    var path2 = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path2.setAttribute("id",newCurveId2)
                    path2.setAttribute("d",d);
                    path2.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                    path2.setAttribute("fill","none");
                    path2.addEventListener("mouseover", (e)=>{
                        console.log(e.target.id)
                    }, false);
                
                    document.getElementById("curveGroup").append(path2);
                    this.testCurves.push({curveObj:newCurve2, curveId:newCurveId2})
                    console.log("removing "+curveObj2.equationId)
                    document.getElementById(curveObj2.equationId).remove()
                    
                }
            }

            resolve();
        })
    }
    
    componentDidMount() {
        var resultSVG = document.getElementById("resultSVG")
        resultSVG.addEventListener("wheel",this.captureZoomEvent,false);
        resultSVG.addEventListener("DOMMouseScroll", this.captureZoomEvent,false);
        this.makeDraggable('resultSVG');

        window.addEventListener("keydown", (e) => {
            if(e.code =="Space") {
                var newCurveId = "testCurve"+this.testCurves.length;
                var curve = new Curve(this.testPts,newCurveId,2, this.testPts[0])
             
                let xMin1=curve.xRange[0];
                let xMax1=curve.xRange[1];
                
                var thisCurveFunc = curve.evaluate

                var P1 = {x:xMin1, y:thisCurveFunc(xMin1)}
                var P2 = {x:xMax1, y:thisCurveFunc(xMax1)}
                var curveDerivativeMin = curve.currentDerivative(xMin1);
    
                var QC = {x:(xMin1+xMax1)/2,  y:P1.y+curveDerivativeMin*(xMax1-xMin1)/2}
            
                var d = `M${P1.x},${P1.y} Q${QC.x},${QC.y},${P2.x},${P2.y} `
                // var pathId = `curve${layerIdx}_${curve}`
                
                var path = document.createElementNS("http://www.w3.org/2000/svg","path");
                
                path.setAttribute("id",newCurveId)
                path.setAttribute("d",d);
                path.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                path.setAttribute("fill","none");
                path.addEventListener("mouseover", (e)=>{
                    console.log(e.target.id)
                }, false);
                // path.insertAdjacentHTML('beforeend',`<animate xlink:href="#curve${curve}_${clm}" id="pathAnimatecurve${curve}_${clm}" attributeName="d" attributeType="XML" dur="8s" begin="0s" repeatCount="indefinite" values="${d}; ${d2};"></animate>`)
                document.getElementById("curveGroup").append(path);

                this.testCurves.push({curveObj:curve, curveId:newCurveId})
                this.testPts = []
                var testSplitPromise = this.testCurveSplit();
                testSplitPromise.then(result=> {
                    console.log("donedone")
                })

                
         
            }
        })

        resultSVG.addEventListener("click",(e)=>{
            var circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
            circle.setAttribute("id",`pt${this.testPts.length}`)
            var x = e.offsetX;
            var y = e.offsetY;
            circle.setAttribute("cx",x);
            circle.setAttribute("cy",y);
            circle.setAttribute("r",1);
            circle.setAttribute("stroke",`black`);
            circle.setAttribute("fill","none");
            document.getElementById("curveGroup").append(circle);
            this.testPts.push({x:x,y:y})
            
        })
    }

    makeDraggable(item_id) {
        var item = document.getElementById(item_id)
        item.onmousedown = this.dragMouseDown;
    }
    closeDragElement() {
        this.currentlyDragging = null;
        // document.getElementById("resultSVG").style.cursor = 'grab';
        document.onmouseup = null;
        document.onmousemove = null;
        this.selectBoxOrigin = {x:0, y:0}
        selectBox.setAttribute("x",0);
        selectBox.setAttribute("y",0);
        selectBox.setAttribute("width",0);
        selectBox.setAttribute("height",0);
    }
    panSVG(dx,dy) {
        this.transformMatrix[4] += dx;
        this.transformMatrix[5] += dy;
        document.getElementById('curveGroup').setAttributeNS(null, "transform", `matrix(${this.transformMatrix.join(' ')})`);
        document.getElementById('ptGroup').setAttributeNS(null, "transform", `matrix(${this.transformMatrix.join(' ')})`);
    }

    elementDrag(e) {    
        if(!(e.target.id.substr(0,2)=='pt' || e.target.id=="resultSVGBackground")) return e;
        e = e || window.event;
        this.lastZoom = {x:e.offsetX, y:e.offsetY}
        
        if(this.dragStart) {
            var pt = getTransformedPt(this.lastZoom.x, this.lastZoom.y, this.transformMatrix);
            
            if(this.currentSVGCursorMode=="drag") this.panSVG((pt.x-this.dragStart.x)/4, (pt.y-this.dragStart.y)/4)
            else if(this.currentSVGCursorMode=="select") {
                var selectBox = document.getElementById('selectBox')
                if(this.lastZoom.x < this.selectBoxOrigin.x) {
                    selectBox.setAttribute("x",this.lastZoom.x);
                    selectBox.setAttribute("width",Math.abs(this.selectBoxOrigin.x-this.lastZoom.x));
                }
                else selectBox.setAttribute("width",Math.abs(this.lastZoom.x - this.selectBoxOrigin.x));
                
                if(this.lastZoom.y < this.selectBoxOrigin.y) {
                    selectBox.setAttribute("y",this.lastZoom.y);
                    selectBox.setAttribute("height",Math.abs(this.selectBoxOrigin.y-this.lastZoom.y));
                }
                else selectBox.setAttribute("height",Math.abs(this.lastZoom.y-this.selectBoxOrigin.y));
            }   
        }
        return e.preventDefault() && false;
    }

    dragMouseDown(e) {
        e = e || window.event;
        console.log(e.target.id);
        
        if(this.currentlyDragging==null) this.currentlyDragging = e.target.id
        else return e.preventDefault() && false;
        if(e.target.id=="resultSVGBackground" && this.currentSVGCursorMode=="drag") {
            document.getElementById("resultSVG").style.cursor = 'grabbing'
        }
        this.lastZoom.x = e.offsetX;
        this.lastZoom.y = e.offsetY;
        this.dragStart = getTransformedPt(this.lastZoom.x, this.lastZoom.y, this.transformMatrix);
        if(this.currentSVGCursorMode=="select") {
            var selectBox = document.getElementById('selectBox')
            this.selectBoxOrigin.x = this.lastZoom.x;
            this.selectBoxOrigin.y = this.lastZoom.y;
            selectBox.setAttribute("x",this.lastZoom.x);
            selectBox.setAttribute("y",this.lastZoom.y);
        }   
        document.onmouseup = this.closeDragElement;
        document.onmousemove = this.elementDrag;
        return e.preventDefault() && false;
    }

    captureZoomEvent = (e) => {
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

        document.getElementById('curveGroup').setAttributeNS(null, "transform", `matrix(${this.transformMatrix.join(' ')})`);
        document.getElementById('ptGroup').setAttributeNS(null, "transform", `matrix(${this.transformMatrix.join(' ')})`);
        this.zoomHasHappened = 0;
    }

    selectImageLayerToDisplay(e,selectedIdx=null) {
        var curveGroup = document.getElementById("curveGroup")
        selectedIdx = selectedIdx==null? e.target.value : selectedIdx;
        this.currentImageLayerIdx = selectedIdx
        var selectedCurvePaths = this.currentScanObj.imageLayers[selectedIdx]["resultData"]["curvePaths"];

        removeAllChildNodes("curveGroup");
        removeAllChildNodes("ptGroup");
        for(var curve=0; curve < selectedCurvePaths.length; ++curve) {
            var pathId = selectedCurvePaths[curve][0];
            var d = selectedCurvePaths[curve][1];
            var path = document.createElementNS("http://www.w3.org/2000/svg","path");
            path.setAttribute("id",pathId);
            path.setAttribute("d",d);
            path.setAttribute("stroke",`black`);
            path.setAttribute("fill","none");
            // path.insertAdjacentHTML('beforeend',`<animate xlink:href="#curve${curve}_${clm}" id="pathAnimatecurve${curve}_${clm}" attributeName="d" attributeType="XML" dur="8s" begin="0s" repeatCount="indefinite" values="${d}; ${d2};"></animate>`)
            curveGroup.append(path);
        }
        // var cornerClusters = this.currentScanObj.imageLayers[selectedIdx]["resultData"]["cornerClusters"].subClusters;
        // for(var cluster=0; cluster < cornerClusters.length; ++cluster) {
        //     var color='red';
        //     for(var pt=0; pt < cornerClusters[cluster].length; ++pt) {
        //         var ptObj = document.createElementNS("http://www.w3.org/2000/svg","circle");
        //         ptObj.setAttribute("id",`corner${selectedIdx}_${cluster}_${pt}`)
        //         ptObj.setAttribute("cx",cornerClusters[cluster][pt].x);
        //         ptObj.setAttribute("cy",cornerClusters[cluster][pt].y);
        //         ptObj.setAttribute("r",2);
        //         ptObj.setAttribute("fill",color);
        //         document.getElementById("ptGroup").append(ptObj);
        //     } 
        // }
    }

    showValuesOnHover(e) {
        // var canvas = document.getElementById("testCanvas");
        // var context = document.getElementById("testCanvas").getContext('2d');
        // var x = e.layerX;
        // var y = e.layerY;
        // var idx = (x) + (y)*this.currentScanObj.imageWidth;
        // if(this.currentScanObj.imageLayers.length==0) return;
        // var mag = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["magGradient"][idx]  
        // var laplacian =   this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["laplacian"][idx]  
        // var theta = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["thetaGradient"][idx]         //subtract 90 degrees (1.570795 in radians) from this to get actual theta
        // var eigenVals = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["eigenVals"][idx];
        
        // var e1 = document.getElementById("e1");
        // var e2 = document.getElementById("e2");
        // var eigenVal1 = eigenVals.realEigenvalues[0]
        // var eigenVec1 = {x:eigenVals.eigenvectorMatrix.get(0,0), y:eigenVals.eigenvectorMatrix.get(1,0)}
        // var eigenTheta1 = Math.atan(eigenVec1.y/eigenVec1.x)
        // e1.setAttribute("x2", eigenVal1*Math.cos(eigenTheta1)*100);
        // e1.setAttribute("y2",eigenVal1*Math.sin(eigenTheta1)*100);
        // var eigenVal2 = eigenVals.realEigenvalues[1]
        // var eigenVec2 = {x:eigenVals.eigenvectorMatrix.get(0,1), y:eigenVals.eigenvectorMatrix.get(1,1)}
        // var eigenTheta2 = Math.atan(eigenVec2.y/eigenVec2.x)
        // e2.setAttribute("x2", eigenVal2*Math.cos(eigenTheta2)*100);
        // e2.setAttribute("y2",eigenVal2*Math.sin(eigenTheta2)*100);
        // context.beginPath();
        // context.moveTo(x,y);
        // context.lineTo(x+eigenVec2.x*eigenVal2, y+eigenVec2.y*eigenVal2);
        // context.strokeStyle = "white"
        // context.stroke();
        // console.log(`theta=${theta}  |  1st gradient mag=${mag}  |  2nd gradient mag (laplacian)=${laplacian}`)
        // console.log('eigenVals',eigenVals.realEigenvalues,'eigenVector', eigenVals.eigenvectorMatrix.get(0,0), eigenVals.eigenvectorMatrix.get(0,1),
        //             eigenVals.eigenvectorMatrix.get(1,0), eigenVals.eigenvectorMatrix.get(1,1))

    }
    
    async loadText(e) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text=(e.target.result);
            const words  = text.split(' ');
            words.forEach((w) => {document.getElementById("fileText").value += w+" "; });            
        };
        reader.readAsText(e.target.files[0]);
    }
    numOfPagesChanged(e) { this.setState({num: e.target.value});  }

    async edgeTracer(resultData,layerIdx, {movWinRadius=15, eigenValEstimate = 5000}={}) {
        // Traces edges starting from each detected corner. A 5x5 window is mapped around each corner to account for multiple edges coming from corner. Duplicates edges are detected 
        // Calls 'tracingWindow' recursively when an edge continues in a specific direction.
        // TODO: add Hough Transform for ellipse detection (iterating through different radius lengths to see which radius has most 'votes'/ fits data points)
        
        var cornerLocations = resultData["cornerLocations"];
        var graphObject = []    // will be list of objects representing each corner. each corner's object has list of edges/curves
        for(var corn=0; corn < cornerLocations.length; ++corn) {
            var currentCorner = cornerLocations[corn]
            this.allCornerData[`corner${corn}`] = {"edges":[], "neighbors":[], "node":currentCorner, "edgeEndPts":[]}
            resultData["pixelVisited"][(currentCorner.x) + (currentCorner.y)*this.currentScanObj.imageWidth] = `corner${corn}`
        }

        //NEXT: when curves are winding/complex, create additional nodes to make it mnore accurate  (nodes are not limited to being corners)

        for(var corn=0; corn < cornerLocations.length; ++corn) {
            var currentCorner = cornerLocations[corn]

            // searches for edges in 5x5 window around every corner, to try to account for multiple edges coming from one corner
            //  https://mathinsight.org/directional_derivative_gradient_introduction
            //  https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
            var foundEdges = [];   
            for(var angle=0; angle <360; angle+=1) {
                var thetaFromCorner = angle/57.2958
                for(let amp=1; amp < 10; ++amp) {
                    
                    var wX = Math.round(amp*Math.cos(thetaFromCorner))
                    var wY = Math.round(amp*Math.sin(thetaFromCorner))
                    
                    var relativeIdx = (currentCorner.x+wX) + (currentCorner.y+wY)*this.currentScanObj.imageWidth
                    if((currentCorner.x+wX) <0 && (currentCorner.x+wX) >= this.currentScanObj.imageWidth) {
                        continue;
                    }
                    if((currentCorner.y+wY) <0 && (currentCorner.y+wY) >= this.currentScanObj.imageHeight) {
                        continue;
                    }
                    if(Math.abs(resultData["gaussCurvature"][relativeIdx]) >= eigenValEstimate && resultData["laplacian"][relativeIdx] > 0) {
                        var relativeEigenVectors = resultData["eigenVectors"][relativeIdx];
                        // var relativeTheta = Math.atan(relativeEigenVectors[1][0]/relativeEigenVectors[0][0])
                        var relativeEigenTheta = resultData["eigenVectorTheta"][relativeIdx]
                        // +/-0.0654 3.75 degrees +/-0.13089 7.5 degrees ( so 15 degrees), OR +/-0.261799 15 degrees ( so 30 degrees). .3926991 rad is 22.5 deg (because 32x32 window would divide 360 degrees into 22.5 deg sections)
                        var eigenVals = resultData["eigenVals"][relativeIdx].realEigenvalues;
                        thetaFromCorner = thetaFromCorner<0? 2*Math.PI-thetaFromCorner : thetaFromCorner;
                        var relativePt = { thetaFromCorner:thetaFromCorner, x:currentCorner.x+wX, y:currentCorner.y+wY , lengthFromCorner:Math.sqrt(wX*wX+wY*wY), eigenVectors:relativeEigenVectors, eigenTheta:relativeEigenTheta, magGradient:resultData["magGradient"][relativeIdx],  thetaGradient:resultData["thetaGradient"][relativeIdx]}
                        // var relativePt = { thetaFromCorner:thetaFromCorner, x:currentCorner.x+wX, y:currentCorner.y+wY , eigenVals:eigenVals, lengthFromCorner:Math.sqrt(wX*wX+wY*wY), eigenVectors:relativeEigenVectors, eigenTheta:relativeEigenTheta, magGradient:resultData["magGradient"][relativeIdx],  thetaGradient:resultData["thetaGradient"][relativeIdx]}
                        foundEdges.push(relativePt) 
                        break;
                    }
                }
                
            }        
            // for(var wY=-movWinRadius; wY <= movWinRadius; ++wY) {        //try -15 to 15
            //     for(var wX=-movWinRadius; wX <= movWinRadius; ++wX) {
            //         if(wY==0 && wX==0) continue;
            //         var relativeIdx = (currentCorner.x+wX) + (currentCorner.y+wY)*this.currentScanObj.imageWidth
            //         if(Math.abs(resultData["gaussCurvature"][relativeIdx]) >= eigenValEstimate && resultData["laplacian"][relativeIdx] > 0) {
            //         // if(Math.round(resultData["harrisResponse"][relativeIdx]) != 0 && resultData["laplacian"][relativeIdx] > 0) {     // < 0 means its classified as an edge by Harris Response
            //             var relativeEigenVectors = resultData["eigenVectors"][relativeIdx];
            //             var relativeEigenTheta = resultData["eigenVectorTheta"][relativeIdx]
            //             // +/-0.0654 3.75 degrees +/-0.13089 7.5 degrees ( so 15 degrees), OR +/-0.261799 15 degrees ( so 30 degrees). .3926991 rad is 22.5 deg (because 32x32 window would divide 360 degrees into 22.5 deg sections)
            //             var thetaFromCorner = Math.atan(wY/wX)
            //             thetaFromCorner = thetaFromCorner<0? 2*Math.PI-thetaFromCorner : thetaFromCorner;
            //             var relativePt = { thetaFromCorner:thetaFromCorner, x:currentCorner.x+wX, y:currentCorner.y+wY , lengthFromCorner:Math.sqrt(wX*wX+wY*wY), eigenVectors:relativeEigenVectors, eigenTheta:relativeEigenTheta, magGradient:resultData["magGradient"][relativeIdx],  thetaGradient:resultData["thetaGradient"][relativeIdx]}
            //             foundEdges.push(relativePt) 
            //         }
            //     }
            // }
            
            var condensedEdges = new Cluster(foundEdges, [{name:'thetaFromCorner',  epsilonMultiplier:1, minPts:2, epsilon:.261799}])  //0.261799
          
            for(let cluster=0; cluster < condensedEdges.subClusters.length; ++cluster) {
                var subCluster = condensedEdges.subClusters[cluster];
                subCluster.sort(function(a,b) {    return Math.abs(b.magGradient) - Math.abs(a.magGradient); })
                var initialCurveName = `curve${corn}_${layerIdx}_${cluster}`
                this.allCurveData[initialCurveName]={"curveObj":null, "pts":[], "origin":`corner${corn}`};
                this.allCornerData[`corner${corn}`].edges.push(initialCurveName);
            }
            for(let cluster=0; cluster < condensedEdges.subClusters.length; ++cluster) {
                var subCluster = condensedEdges.subClusters[cluster];
                var initialCurveName = `curve${corn}_${layerIdx}_${cluster}`
                if(Object.keys(this.allCurveData).includes(initialCurveName)) {
                    if(subCluster[0]==null) console.log('subCluster[0]', subCluster[0])
                    var [lengths, edges, destination] = this.tracingWindow(resultData, subCluster[0], movWinRadius, initialCurveName,eigenValEstimate)
                    //console.log('destination',destination, 'this.allCurveData',this.allCurveData)
                    this.allCurveData[destination].pts = this.allCurveData[destination].pts.concat(edges);

                    // var clusterObj = new Cluster(edges, [{name:'density', epsilonMultiplier:1, minPts:2, epsilon:null, attribute:null}])
                    // if(clusterObj.subClusters.length > 1) {
                    //     // delete this.allCurveData[initialCurveName];
                    //     this.allCornerData[`corner${corn}`].edges.splice(initialCurveName)
                    //     for(let c=0; c < clusterObj.subClusters.length; ++c) {
                    //         var subCluster = clusterObj.subClusters[c]
                    //         this.allCurveData[initialCurveName+`_${c}`] = {"curveObj":null, "pts":[], "origin":`corner${corn}`};
                    //         this.allCurveData[initialCurveName+`_${c}`].pts = subCluster;
                    //         this.allCornerData[`corner${corn}`].edges.push(initialCurveName);
                    //     }
                    // }
                    
                }
            }
            console.log(`corner ${corn} of ${cornerLocations.length} completed`)
            
        }
        //all curves from each corners are now processed together (??)

        var curveRelations = []
        var curveNames = Object.keys(this.allCurveData);
        for(var nameIdx=0;  nameIdx < curveNames.length; ++nameIdx) {
            var curveEntry = this.allCurveData[curveNames[nameIdx]]
            var curveObj = new Curve(curveEntry.pts, curveNames[nameIdx], 2);

            curveEntry["curveObj"] = curveObj;

            let xMin=curveObj.xRange[0];
            let xMax=curveObj.xRange[1];
            
            // geval(curveObj.currentEquationStr)
            // var thisCurveFunc = geval(curveObj.currentEquationName);
            var thisCurveFunc = curveObj.evaluate

            var P1 = {x:xMin, y:thisCurveFunc(xMin)};
            var P2 = {x:xMax, y:thisCurveFunc(xMax)};
            let midPt = (xMax+xMin)/2;
            var slopeAtMidPt = curveObj.currentDerivative(midPt);
            var curveDerivativeMin = curveObj.currentDerivative(xMin);
            var C = {x:midPt,  y:P1.y+curveDerivativeMin*(xMax-xMin)/2} //C is control point of Bezier curve
            curveRelations.push({numPts:curveObj.pts.length, x:C.x, y:C.y, minPt:P1,  maxPt:P2, slopeAtMidPt:slopeAtMidPt})

        }

        // for(let corn=0; corn < this.allCornerData.length; ++corn) {
        //     var cornerEdges = this.allCornerData[`corner${corn}`].edges
        //     for(let edge=0; edge < cornerEdges.length; ++edge) {
        //         var curveObj = this.allCurveData[cornerEdges[edge]].curveObj;
        //     }
        // }

        /*************************************************************************************************/
        //to determine which curves to merge: 
        //see if their slopeMidPt is the same;   then, test if one curve's function can output the other function's output
        /*************************************************************************************************/

        //cluster together curves based on the density of their Bezier-control points ( meaning they have relatively same curvature)
        // var controlPtCluster = new Cluster(curveRelations, [ {name:'density', epsilonMultiplier:1, minPts:2, epsilon:25} ] );
        var groupColors = [];

        for(let c=0; c < Object.keys(this.allCornerData).length; ++c) {
            
            groupColors.push(`hsl(${getRandomInt(0,359)}, ${getRandomInt(1,99)}%, ${getRandomInt(30,70)}%)`)
        }
        
        for(var nameIdx=0; nameIdx < curveNames.length; ++nameIdx) {
            var pathId = curveNames[nameIdx]
            var curveObj = this.allCurveData[pathId].curveObj;
            // geval(curveObj.currentEquationStr)
            // var thisCurveFunc = geval(curveObj.currentEquationName)
            var thisCurveFunc = curveObj.evaluate
            let xMin = curveObj.xRange[0];
            let xMax = curveObj.xRange[1];
            var isValid = true;
            for(let x=xMin; x <= xMax; ++x) {
                let y = thisCurveFunc(x);
                var idx = Math.round(x) + Math.round(y)*this.currentScanObj.imageWidth;
                // if(Math.abs(resultData['gaussCurvature'][idx]) < eigenValEstimate) isValid=false;
                if(Math.round(resultData['magGradient'][idx]) == 0) isValid=false;
            }
            if(!isValid) continue;

            var P1 = {x:xMin, y:thisCurveFunc(xMin)}
            var P2 = {x:xMax, y:thisCurveFunc(xMax)}
            var curveDerivativeMin = curveObj.currentDerivative(xMin);

            var C = {x:(xMin+xMax)/2,  y:P1.y+curveDerivativeMin*(xMax-xMin)/2}
            var d = `M${P1.x},${P1.y} Q${C.x},${C.y},${P2.x},${P2.y} `
            
            var path = document.createElementNS("http://www.w3.org/2000/svg","path");
            path.setAttribute("id",pathId)
            path.addEventListener("mouseover", (e)=>{
                console.log(e.target.id, this.allCurveData[e.target.id].curveObj.currentDerivative(xMax-xMin))
            }, false);
            
            path.setAttribute("d",d);
            
            path.setAttribute("stroke",groupColors[parseInt(curveObj.equationId.substr(5).split("_")[0])])        //groupColors[parseInt(curveObj.currentEquationName.substr(5).split("_")[0])]
            path.setAttribute("fill","none");
            // path.insertAdjacentHTML('beforeend',`<animate xlink:href="#curve${curve}_${clm}" id="pathAnimatecurve${curve}_${clm}" attributeName="d" attributeType="XML" dur="8s" begin="0s" repeatCount="indefinite" values="${d}; ${d2};"></animate>`)
            document.getElementById("curveGroup").append(path);
            resultData['curvePaths'].push([pathId, d])

            console.log("Percent done: ",(nameIdx/Object.keys(this.allCurveData).length))
            this.setState({...this.state, loadPercent:(nameIdx/Object.keys(this.allCurveData).length)})
        }
        console.log("this.allCornerData", this.allCornerData)
        console.log("this.allCurveData", this.allCurveData)
        console.log('***Done tracing edges***')
        var cornerKeys = Object.keys(this.allCornerData)
        for(let corn=0; corn < cornerKeys.length; ++corn) {
            var cornerKey = cornerKeys[corn];
            var cornerData = this.allCornerData[cornerKeys[corn]]["node"]
            var pt = document.createElementNS("http://www.w3.org/2000/svg","circle");
            pt.setAttribute("id",cornerKey)
            pt.addEventListener("mouseover", (e)=>{
                console.log(e.target.id, this.allCornerData[cornerKeys[parseInt(e.target.id.substr(6))]]["edges"].length)
            }, false);
            pt.setAttribute("cx",cornerData.x);
            pt.setAttribute("cy",cornerData.y);
            pt.setAttribute("r",1);
            pt.setAttribute("fill",groupColors[corn]);   //groupColors[parseInt(cornerKey.substr(6))]
            document.getElementById("ptGroup").append(pt);
        }
    }

    tracingWindow(resultData, currentPt, currentLength, thisCurveName, {eigenValEstimate=5000}={}) {      
        //gathers data points by following/tracing a line with common gradient value and  with 15 degrees of flexibility between each data point (so it results in a curve if applicable). Clustering happens after this function, not during
        // currentLength is the current length of the 'traced' edge from the starting point (from edgeTracer)
        //currentPt is object {x:..., y:...}

        var destination = thisCurveName;

        let imageWidth = this.currentScanObj.imageWidth;
        let imageHeight= this.currentScanObj.imageHeight;
        let imageLength=imageWidth*imageHeight;
        var dataPts = [currentPt]
        
        var currentEigenVectors = currentPt.eigenVectors;
       
        //searches for edges in 5x5 window around every corner, to try to account for multiple edges coming from one corner
        let currentTheta = Math.atan(currentEigenVectors[1][0]/currentEigenVectors[0][0])
        var segmentLengths = [];
        // //for testing different lengths of edges

        var lastValidObj = null;
        var canExtend = true;
        var i = 1;
        var thetaDelta = 0.9;        //the farther it extends, the less flexible the theta comparison should be
        var thetaFlexibility = 0.349;
        

        var lastIdx = currentPt.x + (currentPt.y)*imageWidth;
        while(canExtend) {

            // for(var i=1; i < 25; ++i) { 
            
            var nextX = Math.round(i*Math.cos(currentTheta))
            var nextY = Math.round(i*Math.sin(currentTheta))
            var nextIdx = Math.round((currentPt.x+nextX) + ((nextY+currentPt.y)*imageWidth))
            var inXRange = ((currentPt.x+nextX) >= 0 && (currentPt.x+nextX) < imageWidth);
            var inYRange = ((currentPt.y+nextY) >= 0 && (currentPt.y+nextY) < imageHeight);
            if(inXRange && inYRange) {      //next pixel is in bounds of the image
                var nextPixelStatus = resultData["pixelVisited"][nextIdx];
                var cornerScan = scanRadiusForCorner(resultData, nextIdx, 1, eigenValEstimate);
                if(cornerScan!=null)  {
                    var cornerEigenVectors = resultData["eigenVectors"][cornerScan.idx];
                    var cornerTheta = Math.atan(cornerEigenVectors[1][0]/cornerEigenVectors[0][0])
                    var nextObj = {eigenVectors:cornerEigenVectors, eigenVals:resultData["eigenVals"][cornerScan.idx], x:cornerScan.x,  y:cornerScan.y, magGradient:resultData["magGradient"][cornerScan.idx], thetaGradient:cornerTheta};
                    // dataPts = dataPts.concat(nextObj);
                    //*** this would also be a good spot to create connection b/w two corners in the graph object***
                    if(nextPixelStatus.substr(0,6) =="corner") {
                        var thisOrigin = this.allCurveData[thisCurveName].origin
                        if(!this.allCornerData[nextPixelStatus].neighbors.includes(thisOrigin)) this.allCornerData[nextPixelStatus].neighbors.push(thisOrigin);
                        if(!this.allCornerData[thisOrigin].neighbors.includes(nextPixelStatus)) this.allCornerData[thisOrigin].neighbors.push(nextPixelStatus);
                    }
                    canExtend=false;
                    
                } 
                else if(nextPixelStatus!='none' && nextPixelStatus!=thisCurveName) {  //the next pixel has been visited by another curve
                    //merge the pts of this scan with the pts of the existing curve 
                    destination = nextPixelStatus;
                    canExtend=false;

                  
                    //********** create new node here **********
                    //if curve starts where the other ends, merge them
                    //otherwise, create node split the other curve in 2 to create intersection
                
                    // var [nextLengths, nextEdges, finalDestination] = this.tracingWindow(resultData, lastValidObj, currentLength, destination,eigenValEstimate)
                    // dataPts = dataPts.concat(nextEdges);
                    // segmentLengths = segmentLengths.concat(nextLengths)
                    // destination = finalDestination;

                    break;
                   
                }
                
                // else if(nextPixelStatus=='none') {                    //the next pixel has not been visited
                    resultData["pixelVisited"][nextIdx] = thisCurveName;
                    var nextEigenVectors = resultData["eigenVectors"][nextIdx];
                    var nextGaussCurve = resultData["gaussCurvature"][nextIdx];
                    var nextTheta = Math.atan(nextEigenVectors[1][0]/nextEigenVectors[0][0])     // 0.06544
                    var nextThetaIsSimilar = numberInRange(nextTheta, currentTheta, thetaFlexibility);    //returns true if nextTheta is +/-10 degrees (.26179 rad, .3490 rad) of currentTheta OR if difference b/w two angles is 180 
                    var nextThetaIsParallel = numberInRange(nextTheta+Math.PI, currentTheta, thetaFlexibility);
                    
                    
                    // var nextThetaIsParallel = false
                    if((nextThetaIsSimilar || nextThetaIsParallel)  && Math.abs(nextGaussCurve) >= eigenValEstimate) { 
                        var nextObj = {eigenVectors:nextEigenVectors, eigenVals:resultData["eigenVals"][nextIdx], x:currentPt.x+nextX,  y:currentPt.y+nextY, magGradient:resultData["magGradient"][nextIdx], theta:nextTheta};
                        dataPts = dataPts.concat(nextObj);
                        lastValidObj = nextObj;
                        segmentLengths.push(Math.sqrt((i+1)*(i+1)))
                    }
                    
                    else if(lastValidObj!=null) {

                        //********** create new node here **********
                        var [nextLengths, nextEdges, finalDestination] = this.tracingWindow(resultData, lastValidObj, currentLength, destination,eigenValEstimate)
                        dataPts = dataPts.concat(nextEdges);
                        segmentLengths = segmentLengths.concat(nextLengths)
                        destination = finalDestination;
                        canExtend=false;
                        break;  
                    }
                // }

                

            }
            else canExtend=false;
            lastIdx = nextIdx;
            if(i >25) thetaFlexibility *= thetaDelta
            ++i;
        }
        // this.allCurveData[destination].pts = this.allCurveData[destination].pts.concat(dataPts);
        //segmentLengths is a list of each 'trace' between dataPts, will be used in calculating important parameter for clustering algorithm
        return [segmentLengths,dataPts, destination];
    }

    // setImageLayers({eigenValEstimates=[5000]}={}) {
    setImageLayers(eigenValEstimates) {
        console.log("Inserting image layers into selector")
        var selectFilter = document.getElementById("selectFilter");
        var imageLayers = this.currentScanObj.imageLayers
        console.log('eigenValEstimates[0]',eigenValEstimates[0])
        for(var l =0; l < imageLayers.length; ++l) {
            var layerName = `Layer ${l} | Sigma=${imageLayers[l]["component"].sig}`
            selectFilter.insertAdjacentHTML('beforeEnd', `<option value="${l}">${layerName}</option>`)
            var resultData = imageLayers[l]["resultData"];
            this.edgeTracer(resultData,l,{movWinRadius:15,eigenValEstimate:eigenValEstimates[0]})
            // if(l>eigenValEstimates.length) {
            //     this.edgeTracer(resultData,l,15,eigenValEstimates[eigenValEstimates.length-1])
            // }
            // else this.edgeTracer(resultData,l,15,eigenValEstimates[l])
        }
        return new Promise((resolve,reject)=> { resolve(); });
    }
    
    async loadImage(e) {
        var filterInfo = [
            // {type:"gammaTransfer", applyTo:"RGB", exponent:2, amplitude:10, offset:5},       {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,0,1.0,1.0]},
            // {type:"gaussBlur", kernelLength:7, sig:4000},    {type:"blackWhiteTransfer"},
            // {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,.5,.9,1.0]},   {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,0,1.0,1.0]},
        ]
        var canvas = document.getElementById("testCanvas");
        var context = canvas.getContext('2d');
        this.currentScanObj = new ImageScan('testCanvas',filterInfo);
        await this.handlePanelShow();
      
        var imageReadPromise = this.currentScanObj.imageReader();
        var startingEigenValEst = 5000;
        imageReadPromise.then(result1 => {
            var detectBlobPromise =  this.currentScanObj.detectBlobs();      //detects blobs on each layer
            // var detectBlobPromise =  this.currentScanObj.detectBlobs({eigenValEstimate:startingEigenValEst});      //detects blobs on each layer
            detectBlobPromise.then(result2 => {  
                var saveLayerImagePromise = this.currentScanObj.saveLayerImageData(context); 
                saveLayerImagePromise.then(result3=>{
                    // this.setImageLayers({eigenValEstimate:[startingEigenValEst]});
                    this.setImageLayers([startingEigenValEst]);
                    this.handlePanelClose();
                })
            })
        });
        document.getElementById("testCanvas").onmousemove = (e) => this.showValuesOnHover(e);
        this.selectedImage = this.currentScanObj.selectedFile;
        return;
	}

    handlePanelShow = () =>{ 
        return new Promise((resolve, reject)=>{
            this.setState({...this.state, show:true});
            resolve();
        })
    };
    handlePanelClose = () => {this.setState({...this.state, show:false})};

    
    render() {
        return (
            <Layout title="Image Processing" description="Description about file">
                <Tabs defaultActiveKey="inputImageTab" id="tabsContainer" >
                    <Tab eventKey="inputImageTab" title="Input Image">
                        
                        <Container id="imageFileLoader">
                            <label htmlFor="imgFile">Choose image file: </label>
                            <input type="file" id="imgFile" onChange={this.loadImage}></input>
                           
                        </Container>
                        
                        <canvas className="imageContainer inputImage" id="testCanvas"   />
                        {/* <svg id="eigenVectors" xmlns="http://www.w3.org/2000/svg" >
                            <line id='e1' x1="100" y1="100" x2="100" y2="0" stroke="red" />
                            <line id='e2' x1="100" y1="100" x2="100" y2="0" stroke="blue" />
                        </svg> */}
                    </Tab>
                    <Tab eventKey="outputImageTab" title="Result">
                        <Container id="gaussPyramid">
                            <label htmlFor="selectFilter">Sigma-level (Gaussian Pyramid):</label>
                            <select id="selectFilter" name="filterEffect" style={{width:"100px"}} onChange={this.selectImageLayerToDisplay}></select>
                        </Container>
                        <Container className="toolArray">
                            <button className="svgTool selected" id="dragButton" onClick={(e)=> this.resultSVGModeSelect(e)} width="25px" height="25px" top="0px" right="200px">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"  class="bi bi-arrows-move" viewBox="0 0 16 16" pointerEvents="none">
                                    <path fill="black" fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/>
                                </svg>
                            </button>
                            <button className="svgTool"id="selectButton" onClick={(e)=> this.resultSVGModeSelect(e)} width="25px" height="25px" top="0px" right="100px" >
                                <svg id="selectButton" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="25px" viewBox="0 0 24 24" width="25px" fill="black" pointerEvents="none">
                                    <g>
                                        <rect fill="none" height="24" width="24"/>
                                        <path d="M17,5h-2V3h2V5z M15,15v6l2.29-2.29L19.59,21L21,19.59l-2.29-2.29L21,15H15z M19,9h2V7h-2V9z M19,13h2v-2h-2V13z M11,21h2 v-2h-2V21z M7,5h2V3H7V5z M3,17h2v-2H3V17z M5,21v-2H3C3,20.1,3.9,21,5,21z M19,3v2h2C21,3.9,20.1,3,19,3z M11,5h2V3h-2V5z M3,9h2 V7H3V9z M7,21h2v-2H7V21z M3,13h2v-2H3V13z M3,5h2V3C3.9,3,3,3.9,3,5z"/>
                                    </g>
                                </svg>
                            </button>
                        </Container>
                        
                        <svg id="resultSVG" className="imageContainer resultImage" >
                            <rect id="resultSVGBackground" width="100%" height="100%" fill='white'/>
                            <g id="curveGroup"></g>
                            <g id="ptGroup"></g>
                            <rect id="selectBox" width={0} height={0} x={0} y={0}  fill="hsla(240, 88%, 50%, 0.8)" pointerEvents='none'></rect>
                        </svg>
                    </Tab>
                </Tabs>
                <Modal show={this.state.show} onHide={this.handlePanelClose} backdrop="static" centered>
                    <Modal.Header>
                        <Modal.Title>Processing input image...</Modal.Title>
                        <Spinner animation="border" />
                    </Modal.Header>
                    {/* <Modal.Body id="modalBody"></Modal.Body> */}
                    {/* <Modal.Footer></Modal.Footer> */}
                </Modal>
            </Layout> 
            
      );
    }
}

export default FileManipPage;