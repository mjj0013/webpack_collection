import React, {useState,createRef} from 'react';
import {Container } from 'semantic-ui-react';
import Modal from 'react-bootstrap/Modal'
import Tabs from 'react-bootstrap/Tabs';
import Spinner from 'react-bootstrap/Spinner'
import Tab from 'react-bootstrap/Tab';
// import {ProgressBar} from './ProgressBar.js'
// import ProgressBar from 'react-bootstrap/ProgressBar'
import Layout from './Layout';
import "regenerator-runtime/runtime";
import { documentElement } from 'min-document';
import {ImageScan} from './imageManip.js'
import {Curve} from './Curve.js'
import {Cluster} from './Cluster.js';
import {distanceSquared,removeAllChildNodes,mergeSubElements,getRandomInt,getStdDev,getTransformedPt, numberInRange,distance} from './utility.js'
import {scanRadiusForCorner} from './imageManipUtility.js'
var geval = eval;
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
        this.imageScanInstances = [];
       
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
    
    componentDidMount() {
        var resultSVG = document.getElementById("resultSVG")
        resultSVG.addEventListener("wheel",this.captureZoomEvent,false);
        resultSVG.addEventListener("DOMMouseScroll", this.captureZoomEvent,false);
        this.makeDraggable('resultSVG');
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

    async edgeTracer(resultData,layerIdx, movWinRadius=5) {
        // Traces edges starting from each detected corner. A 5x5 window is mapped around each corner to account for multiple edges coming from corner. Duplicates edges are detected 
        // Calls 'tracingWindow' recursively when an edge continues in a specific direction.
        // TODO: add Hough Transform for ellipse detection (iterating through different radius lengths to see which radius has most 'votes'/ fits data points)
        var eigenValEstimate = 5000;
        var cornerLocations = resultData["cornerLocations"];
        var clusterMatrix=[];
        var clusterSpacings = [];
        var graphObject = []    // will be list of objects representing each corner. each corner's object has list of edges/curves
        for(var corn=0; corn < cornerLocations.length; ++corn) {
            var currentCorner = cornerLocations[corn]
            // var cornerObj = {}
            // searches for edges in 5x5 window around every corner, to try to account for multiple edges coming from one corner
            // var currentEigenVectors = currentCorner.eigenVectors;
           
            //scanning around a corner (looking for valid angles)
            // var theta = 0;
            // while(theta < 360) {
            //     var rX = movWinRadius*Math.cos(theta/57.2958);
            //     var rY = movWinRadius*Math.sin(theta/57.2958);
            //     var relativeIdx = (currentCorner.x+rX) + (currentCorner.y+rY)*this.currentScanObj.imageWidth;
            //     relativeIdx = Math.round(relativeIdx);
            //     if(relativeIdx < 0 || relativeIdx >=this.currentScanObj.imageLength) {theta+=5; continue;}
            //     var relativeEigenVals = resultData["eigenVals"][relativeIdx];
            //     var real = relativeEigenVals.realEigenvalues;
            //     //if(Math.round(resultData["harrisResponse"][relativeIdx]) != 0 && resultData["laplacian"][relativeIdx] > 0) {     // < 0 means its classified as an edge by Harris Response; > 0 means its classified as a corner by Harris Response
            //     if((real[0] + eigenValEstimate < real[1]) || (real[1] + eigenValEstimate < real[0])) {
            //         //if(resultData["laplacian"][relativeIdx] > 0) {     // < 0 means its classified as an edge by Harris Response; > 0 means its classified as a corner by Harris Response
            //         var relativeEigenVectors = resultData["eigenVectors"][relativeIdx];
            //         var relativeMagGradient = resultData["magGradient"][relativeIdx];
            //         if(Math.round(resultData["harrisResponse"][relativeIdx]) != 0) {   
            //             if((relativeMagGradient/resultData["maxMagGradient"]) > .15) {
            //                 var relativeTheta = Math.atan(relativeEigenVectors[1][0]/relativeEigenVectors[0][0]);
            //                 var relativePt = {rootTheta:theta/57.2958, eigenVectors:relativeEigenVectors, theta:relativeTheta, magGradient:relativeMagGradient,  thetaGradient:resultData["thetaGradient"][relativeIdx] , x:currentCorner.x+rX, y:currentCorner.y+rY}
            //                 //changed theta:relativeTheta to theta:theta
            //                 //scanning out from a corner at the found angle (looking for valid lengths)
            //                 var [segmentLengths, edgePts] = this.tracingWindow(resultData, relativePt, movWinRadius)  //make this a cluster
            //                 // var edgePts = this.tracingWindow(resultData, relativePt, movWinRadius)  //make this a cluster
            //                 clusterMatrix.push(edgePts);
            //                 // clusterSpacings.push(segmentLengths);
            //             }
                        
            //         }
            //     }
            //     theta += 5;
            // }
            //  https://mathinsight.org/directional_derivative_gradient_introduction
            //  https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image




            //before calling tracingWindow, find the most common angles and only use those so that there aren't any redundant edges
            var foundEdges = [];
            for(var wY=-movWinRadius; wY < movWinRadius; ++wY) {        //try -15 to 15
                for(var wX=-movWinRadius; wX < movWinRadius; ++wX) {
                    if(wY==0 && wX==0) continue;
                    var relativeIdx = (currentCorner.x+wX) + (currentCorner.y+wY)*this.currentScanObj.imageWidth
                    if(Math.round(resultData["harrisResponse"][relativeIdx]) != 0 && resultData["laplacian"][relativeIdx] > 0) {     // < 0 means its classified as an edge by Harris Response
                        var relativeEigenVectors = resultData["eigenVectors"][relativeIdx];
                        var relativeTheta = Math.atan(relativeEigenVectors[1][0]/relativeEigenVectors[0][0])
                        var edgeIsUnique = true;
                        for(var edge=0; edge < foundEdges.length; ++edge) {
                            var nextThetaIsSimilar = numberInRange(relativeTheta, foundEdges[edge].theta, 0.0654);
                            var nextThetaIsParallel = numberInRange(relativeTheta+Math.PI, foundEdges[edge].theta, 0.0654);
                            if((nextThetaIsSimilar || nextThetaIsParallel)) {
                                edgeIsUnique=false;
                                break;
                            }
                        }
                        if(edgeIsUnique) {       //edge is completely different from other edges
                            // +/-0.0654 3.75 degrees +/-0.13089 7.5 degrees ( so 15 degrees), OR +/-0.261799 15 degrees ( so 30 degrees). .3926991 rad is 22.5 deg (because 32x32 window would divide 360 degrees into 22.5 deg sections)
                            foundEdges.push({eigenVectors:relativeEigenVectors, theta:relativeTheta, pt1:{x:currentCorner.x, y:currentCorner.y}, pt2:{x:currentCorner.x+wX, y:currentCorner.y+wY}}) 
                            var relativePt = {eigenVectors:relativeEigenVectors, theta:relativeTheta, magGradient:resultData["magGradient"][relativeIdx],  thetaGradient:resultData["thetaGradient"][relativeIdx] , x:currentCorner.x+wX, y:currentCorner.y+wY}
                            var [thisSegmentLength,edgePts] = this.tracingWindow(resultData, relativePt, movWinRadius)  //make this a cluster
                            clusterMatrix.push(edgePts);
                           
                        }
                    }
                }
            }
        }
        console.log('clusterMatrix',clusterMatrix)
        var curveObjs = [];
        for(var clm=0; clm < clusterMatrix.length; ++clm) {
            // var clusterSpacing = clusterSpacings[clm];
            // var avg =0;
            // for(let c=0; c < clusterSpacing.length; ++c) {
            //     clusterSpacings[c]
            // }
            // var clusterOperations = [
            //     {name:'density', epsilonMultiplier:1, minPts:2, epsilon:null, attribute:null},  //movWinRadius*2
            //     // {name:'theta',epsilon:null, minPts:2, epsilonMultiplier:1},
            //     // {name:'thetaGradient',epsilon:null, minPts:3, epsilonMultiplier:1},
            //     // {name:'slope',epsilon:null, minPts:4, epsilonMultiplier:1},
            // ]
            // var clusterObj = new Cluster(clusterMatrix[clm], clusterOperations);
            var curve = new Curve(clusterMatrix[clm],`curve${layerIdx}_${clm}`,2);
            curveObjs.push(curve)
            // for(var cl=0; cl < clusterObj.subClusters.length; ++cl) {
            //     var curve = new Curve(clusterObj.subClusters[cl],`curve${layerIdx}_${clm}_${cl}`,2);
            //     if(curve.pts.length==0) continue;
            //     curveObjs.push(curve)
            // }
        }
        //all curves from each corners are now processed together (??)
        var curveRelations = []
        for(var curve=0; curve < curveObjs.length; ++curve) {
            var curveObj = curveObjs[curve];
            let xMin=curveObj.xRange[0];
            let xMax=curveObj.xRange[1];
            
            geval(curveObj["currentEquationStr"])
            var thisCurveFunc = geval(curveObj.currentEquationName);
            var P1 = {x:xMin, y:thisCurveFunc(xMin)};
            var P2 = {x:xMax, y:thisCurveFunc(xMax)};
            let midPt = (xMax+xMin)/2;
            var slopeAtMidPt = curveObj.currentDerivative(midPt);
            var curveDerivativeMin = curveObj.currentDerivative(xMin);
            var C = {x:(xMax+xMin)/2,  y:P1.y+curveDerivativeMin*(xMax-xMin)/2} //C is control point of Bezier curve
            curveRelations.push({numPts:curveObj.pts.length, idx:curve, x:C.x, y:C.y, minPt:P1,  maxPt:P2, slopeAtMidPt:slopeAtMidPt})
        }
        //************************************************ */
        var mergeCurves = [];       //to determine which curves to merge: 
                                        //see if their slopeMidPt is the same
                                        //then, test if one curve's function can output the other function's output
        console.log('curveObjs',curveObjs.length)

        //************************************************ */

        //cluster together curves based on the density of their Bezier-control points ( meaning they have relatively same curvature)
        // var controlPtCluster = new Cluster(curveRelations, [ {name:'density', epsilonMultiplier:1, minPts:2, epsilon:25} ] );

        for(var curve=0; curve < curveObjs.length; ++curve) {
            var curveObj = curveObjs[curve];
            geval(curveObj["currentEquationStr"])
            var thisCurveFunc = geval(curveObj.currentEquationName)
            let xMin = curveObj.xRange[0];
            let xMax = curveObj.xRange[1];
            
            var P1 = {x:xMin, y:thisCurveFunc(xMin)}
            var P2 = {x:xMax, y:thisCurveFunc(xMax)}
            var curveDerivativeMin = curveObj.currentDerivative(xMin);

            var C = {x:(xMin+xMax)/2,  y:P1.y+curveDerivativeMin*(xMax-xMin)/2}
            var d = `M${P1.x},${P1.y} Q${C.x},${C.y},${P2.x},${P2.y} `
            var pathId = `curve${layerIdx}_${curve}`
            var path = document.createElementNS("http://www.w3.org/2000/svg","path");
            path.setAttribute("id",pathId)
            path.addEventListener("mouseover", (e)=>{console.log("midPt slope: "+curveRelations[parseInt(e.target.id.split("_")[1])].slopeAtMidPt)}, false);
            path.setAttribute("d",d);
            path.setAttribute("stroke",`black`);
            path.setAttribute("fill","none");
            // path.insertAdjacentHTML('beforeend',`<animate xlink:href="#curve${curve}_${clm}" id="pathAnimatecurve${curve}_${clm}" attributeName="d" attributeType="XML" dur="8s" begin="0s" repeatCount="indefinite" values="${d}; ${d2};"></animate>`)
            document.getElementById("curveGroup").append(path);
            resultData['curvePaths'].push([pathId, d])

            console.log("Percent done: ",(curve/curveObjs.length))
            this.setState({...this.state, loadPercent:(curve/curveObjs.length)})
        }
        console.log('***Done tracing edges***')
    }

    tracingWindow(resultData, currentPt, currentLength) {      
        //gathers data points by following/tracing a line with common gradient value and  with 15 degrees of flexibility between each data point (so it results in a curve if applicable). Clustering happens after this function, not during
        // currentLength is the current length of the 'traced' edge from the starting point (from edgeTracer)
        var eigenValEstimate= 5000;
        //currentPt is object {x:..., y:...}
        let imageWidth = this.currentScanObj.imageWidth;
        let imageHeight= this.currentScanObj.imageHeight;
        let imageLength=imageWidth*imageHeight;
        let dataPts = [currentPt]
       
        var currentEigenVectors = currentPt.eigenVectors;
     
        //searches for edges in 5x5 window around every corner, to try to account for multiple edges coming from one corner
        let currentTheta = Math.atan(currentEigenVectors[1][0]/currentEigenVectors[0][0])
        var segmentLengths = [];
        // //for testing different lengths of edges
        var nextShots = [];
        for(var i=1; i < 25; ++i) {
            if(i==0) continue;
            var nextX = Math.round(i*Math.cos(currentTheta))    //-1.57079 ( -90 deg)
            var nextY = Math.round(i*Math.sin(currentTheta))
            nextShots.push({x:nextX, y:nextY})
        }
        var lastValidObj = null;
      
        for(var shot=0; shot < nextShots.length; ++shot) {
            var nextIdx = (currentPt.x+nextShots[shot].x) + ((nextShots[shot].y+currentPt.y)*imageWidth)
            var nextX = currentPt.x+nextShots[shot].x;
            var nextY = (nextShots[shot].y+currentPt.y)*imageWidth
            nextIdx = Math.round(nextIdx)
            if(nextIdx >= 0 && nextIdx < imageLength) {
                var nextEigenVectors = resultData["eigenVectors"][nextIdx];
                var nextLaplacian = resultData["laplacian"][nextIdx];
 
                var nextTheta = Math.atan(nextEigenVectors[1][0]/nextEigenVectors[0][0])     // 0.06544
                var nextThetaIsSimilar = numberInRange(nextTheta, currentTheta, 0.06544);    //returns true if nextTheta is +/-10 degrees (.26179 rad, .3490 rad) of currentTheta OR if difference b/w two angles is 180 
                var nextThetaIsParallel = numberInRange(nextTheta+Math.PI, currentTheta, 0.06544);
                // var nextIsSimilarToRoot = numberInRange(currentPt.rootTheta, nextTheta*57.2958, )
                // var cornerScan = scanRadiusForCorner(resultData, nextIdx, 5, eigenValEstimate);
                // if(cornerScan!=null)  {
                //     console.log("Hit a corner")
                //     var cornerEigenVectors = resultData["eigenVectors"][cornerScan.idx];
                //     console.log('cornerScan',cornerScan)
                //     var cornerTheta = Math.atan(cornerEigenVectors[1][0]/cornerEigenVectors[0][0])
                //     var slope = resultData["slopeRateY1"][cornerScan.idx]/resultData["slopeRateX1"][cornerScan.idx];
                //     var nextObj = {eigenVectors:resultData["eigenVectors"][cornerScan.idx], eigenVals:resultData["eigenVals"][cornerScan.idx],slope:slope, x:cornerScan.x,  y:cornerScan.y, magGradient:resultData["magGradient"][cornerScan.idx], thetaGradient:cornerTheta};
                //     dataPts = dataPts.concat(nextObj);
                //     break;
                // } 
                //if((nextThetaIsSimilar)  && nextLaplacian >0) { 
                if((nextThetaIsSimilar || nextThetaIsParallel)  && nextLaplacian >0) {          //&& nextMagIsSimilar
                    var slope = resultData["slopeRateY1"][nextIdx]/resultData["slopeRateX1"][nextIdx];
                    var nextObj = {eigenVectors:resultData["eigenVectors"][nextIdx], eigenVals:resultData["eigenVals"][nextIdx],slope:slope, x:currentPt.x+nextShots[shot].x,  y:currentPt.y+nextShots[shot].y, magGradient:resultData["magGradient"][nextIdx], theta:nextTheta};
                    // dataPts = dataPts.concat(nextObj);
                    lastValidObj = nextObj;
                    segmentLengths.push(Math.sqrt((shot +1)*(shot+1)))
                }
                
                else if(lastValidObj!=null) {
                    var [nextLengths, nextResult] = this.tracingWindow(resultData, lastValidObj, currentLength)
                    dataPts = dataPts.concat(nextResult);
                    segmentLengths = segmentLengths.concat(nextLengths)
                    break;  
                }
            }
        }
        
        //segmentLengths is a list of each 'trace' between dataPts, will be used in calculating important parameter for clustering algorithm
        return [segmentLengths,dataPts];
    }

    setImageLayers() {
        console.log("Inserting image layers into selector")
        var selectFilter = document.getElementById("selectFilter");
        var imageLayers = this.currentScanObj.imageLayers
        for(var l =0; l < imageLayers.length; ++l) {
            var layerName = `Layer ${l} | Sigma=${imageLayers[l]["component"].sig}`
            selectFilter.insertAdjacentHTML('beforeEnd', `<option value="${l}">${layerName}</option>`)
            var resultData = imageLayers[l]["resultData"];
            this.edgeTracer(resultData,l);
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
       
        imageReadPromise.then(result1 => {
            var detectBlobPromise =  this.currentScanObj.detectBlobs();      //detects blobs on each layer
            detectBlobPromise.then(result2 => {  
                var saveLayerImagePromise = this.currentScanObj.saveLayerImageData(context); 
                saveLayerImagePromise.then(result3=>{
                    this.setImageLayers();
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