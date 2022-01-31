import React, {useState} from 'react';
import {Container } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";
import { documentElement } from 'min-document';
import {ImageScan} from './imageManip.js'
import {Curve} from './Curve.js'
import {Cluster} from './Cluster.js';
import {getRandomInt, distance, groupInRegion, itemCountInArray} from './utility.js'

var geval = eval;

class FileManipPage extends React.Component {
    constructor(props) {
        super(props);
        this.loadText= this.loadText.bind(this);
        this.numOfPagesChanged= this.numOfPagesChanged.bind(this);
        this.state = {num:''};
        this.loadImage = this.loadImage.bind(this);
        this.showSigmaLayersOnHover = this.showSigmaLayersOnHover.bind(this)
        this.imageScanInstances = [];
        this.selectImageLayerToDisplay = this.selectImageLayerToDisplay.bind(this);
        this.selectedImage = null
        
        this.curveObjs = [];
        this.setImageLayers = this.setImageLayers.bind(this);
        this.mouseClickHandler = this.mouseClickHandler.bind(this);
        this.currentPts = [];//for testing clustering algorithm
        this.keyMag = 2;    //for testing clustering algorithm
        this.currentImageLayerIdx = 0;
    }
    mouseClickHandler(e) {
        var resultSVG = document.getElementById("resultSVG");
        const rect = resultSVG.getBoundingClientRect();
        var svgMouseClick = {x: e.clientX - rect.left, y: e.clientY - rect.top, magGradient:this.keyMag}
        this.currentPts.push(svgMouseClick);
        var ptObj = document.createElementNS("http://www.w3.org/2000/svg","circle");
        ptObj.setAttribute("cx",svgMouseClick.x);
        ptObj.setAttribute("cy",svgMouseClick.y);
        ptObj.setAttribute("r",5);
        ptObj.setAttribute("fill","black");
        document.getElementById("ptGroup").append(ptObj);
    }
    selectImageLayerToDisplay(e) {
        var canvas = document.getElementById("testCanvas");
        var context = document.getElementById("testCanvas").getContext('2d');
        var selectedIdx = e.target.value;
        this.currentImageLayerIdx = selectedIdx
        var selectedImageData = this.currentScanObj.imageLayers[selectedIdx]["resultData"]["imageData"];
        var currentImageData = context.getImageData(0,0, canvas.width, canvas.height)
        var imageWidth = currentImageData.width
        var imageHeight = currentImageData.height
        for(var imgY=0; imgY < imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
            for(var imgX=0; imgX < imageWidth; imgX+=1) {
                currentImageData.data[4*(imgY*imageWidth + imgX)] = selectedImageData[4*(imgY*imageWidth + imgX)];
                currentImageData.data[4*(imgY*imageWidth + imgX) + 1] = selectedImageData[4*(imgY*imageWidth + imgX) + 1]
                currentImageData.data[4*(imgY*imageWidth + imgX) + 2] = selectedImageData[4*(imgY*imageWidth + imgX) + 2]
                currentImageData.data[4*(imgY*imageWidth + imgX) + 3] = selectedImageData[4*(imgY*imageWidth + imgX) + 3]
            }
        }
        context.putImageData(currentImageData, 0 , 0)
        var cornerClusters = this.currentScanObj.imageLayers[selectedIdx]["resultData"]["cornerLocations"].subClusters;
        for(let cluster=0; cluster < cornerClusters.length; ++cluster) {
            var color = `rgb(${getRandomInt(0,255)},${getRandomInt(0,255)},${getRandomInt(0,255)} )`
            for(let pt=0; pt < cornerClusters[cluster].length; ++pt) {
                context.beginPath();
                context.arc(cornerClusters[cluster][pt].x, cornerClusters[cluster][pt].y, 1, 0, 2 * Math.PI)
                context.fillStyle = color
                context.fill();
            }   
        }
    }
    showSigmaLayersOnHover(e) {
        var x = e.layerX;
        var y = e.layerY;
        var idx = (x) + (y)*this.currentScanObj.imageWidth;
        if(this.currentScanObj.imageLayers.length==0) return;
        var mag = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["magGradient1"][idx]  
      
        var laplacian =   this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["laplacian"][idx]  
        // var theta = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["thetaGradient1"][idx]
        // var ratio =  this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["slopeRateY1"][idx] /this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["slopeRateX1"][idx] 
        var R = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["harrisResponse"][idx]   
        console.log("laplacian", laplacian)        
    }
    
    async loadText(e) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text=(e.target.result);
            const words  = text.split(' ');
            words.forEach((w) => {
                document.getElementById("fileText").value += w;
                document.getElementById("fileText").value += " ";
            });            
        };
        reader.readAsText(e.target.files[0]);
    }

    numOfPagesChanged(e) { this.setState({num: e.target.value});  }

    componentDidMount() {
        //TESTING CURVE GENERATING
        var resultSVG = document.getElementById("resultSVG")
        document.addEventListener('keydown', (event) => {
            const keyName = event.key;
            console.log("keyName",keyName)

            if(keyName==' ') {
                var clusterObj = new Cluster(this.currentPts);
                var clusters = clusterObj.subClusters;
                var ptGroup =document.getElementById("ptGroup")
                while (ptGroup.firstChild) ptGroup.removeChild(ptGroup.firstChild);
                
                for(let i =0; i < clusters.length; ++i) {
                    var color = `rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`
                    for(let p=0; p < clusters[i].length; ++p) {
                        var ptObj = document.createElementNS("http://www.w3.org/2000/svg","circle");         
                        ptObj.setAttribute("cx",clusters[i][p].x);
                        ptObj.setAttribute("cy",clusters[i][p].y);
                        ptObj.setAttribute("r",5);
                        ptObj.setAttribute("fill",color);
                        document.getElementById("ptGroup").append(ptObj);
                    }
                }
            }
            if(['1','2','3','4','5','6','7','8','9'].includes(keyName))   this.keyMag = parseInt(keyName);
            
            if (keyName === 'Enter') {
                var curveGroup =document.getElementById("curveGroup")
                while (curveGroup.firstChild) curveGroup.removeChild(curveGroup.firstChild);
                this.curveObjs = [];
                var curveObj = new Curve(this.currentPts,'0')
                this.curveObjs.push(curveObj);
                for(let curve=0; curve < this.curveObjs.length; ++curve) {
                    var curveData = this.curveObjs[curve].curveData;
                    console.log("curveData", curveData)
                    geval(curveData["equationStr"])
                    var thisCurveFunc = geval(curveData.equationName)
                    let xMin = curveObj.xRange[0];
                    let xMax = curveObj.xRange[1];
                    var d = `M${xMin},${thisCurveFunc(xMin)} `
                    for(let x =xMin; x < xMax; ++x) {
                        var y = thisCurveFunc(x)
                        d+=`L${x},${y} `
                    }
                    var path = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path.setAttribute("d",d);
                    path.setAttribute("stroke","black");
                    path.setAttribute("fill","none");
                    document.getElementById("curveGroup").append(path);
                }
                return;
            }
          }, false);
        resultSVG.addEventListener("click", this.mouseClickHandler, false);

    }
    setImageLayers() {
        console.log("Inserting image layers into selector")
        
        var selectFilter = document.getElementById("selectFilter");
        var imageLayers = this.currentScanObj.imageLayers
        for(let l =0; l < imageLayers.length; ++l) {
            var layerName = `Layer ${l} | Sigma=${imageLayers[l]["component"].sig}`
            selectFilter.insertAdjacentHTML('beforeEnd', `<option value="${l}">${layerName}</option>`)
            console.log("preClusteringGroups of "+ l, imageLayers[l]["resultData"]["preClusteringGroups"])
        }
        var pathAmount = 0;

        
        var resultData = imageLayers[0]["resultData"]
        var preClusteringGroups = resultData["preClusteringGroups"]
        var H = preClusteringGroups.length
        var W = preClusteringGroups[0].length
        console.log("W,H", W, H)
        var windowR = 0;
        
        for(let j=windowR; j < H-windowR; ++j) {
            for(let i=windowR; i < W-windowR; ++i) {

                // // merge the preClusteringGroups of adjacent regions if their headPt/tailPt are close
                // for(let wY=-windowR; wY <=windowR; ++wY) {
                //     for(let wX=-windowR; wX <=windowR; ++wX) {
                //         for(let key=0; key < rangeKeys.length; ++key) {
                //             var thisTestCurve = new Curve(preClusteringGroups[j][i],`test${j}${i}`,2);
                //             distance(testCurve)
                //         }
                //     }
                // }
                console.log("preClusteringGroups[j][i]", preClusteringGroups[j][i])

                var rangeKeys = Object.keys(preClusteringGroups[j][i]);
                var maxRangeKey = rangeKeys[0]
                for(let key=0; key < rangeKeys.length; ++key) {
                    if(preClusteringGroups[j][i][rangeKeys[key]].length > preClusteringGroups[j][i][maxRangeKey].length) maxRangeKey = rangeKeys[key];
                }
                if(preClusteringGroups[j][i][maxRangeKey].length==0) continue;        //was formerly '150,300'

                var clusterOperations = [
                    // {name:'density', minPts:3, epsilonMultiplier:.125},
                    {name:'density', minPts:4, epsilonMultiplier:1}
                ]
                // var numCornersInRegion  = groupInRegion(resultData.cornerLocations, {top:j, left:i, width:W, height:H})
                // if(numCornersInRegion >0 ) {
                //     clusterOperations.push({name:'thetaGradient', minPts:3, epsilonMultiplier:.125})
                // }
                
                var clusterObj = new Cluster(preClusteringGroups[j][i][maxRangeKey], clusterOperations);

                var curveObjs = [];
                for(let cl=0; cl < clusterObj.subClusters.length; ++cl) {
                    var curve = new Curve(clusterObj.subClusters[cl],`${j}${i}_${cl}`,2);
                    if(curve.pts.length ==0) continue;
                    curveObjs.push(curve)
                }
                for(let curve=0; curve < curveObjs.length; ++curve) {
                    var curveObj = curveObjs[curve];
                    console.log("curveObj",curveObj);
                    geval(curveObj["currentEquationStr"])
                    var thisCurveFunc = geval(curveObj.currentEquationName)

                    let xMin = curveObj.xRange[0];
                    let xMax = curveObj.xRange[1];
                   

                    var P1 = {x:xMin, y:thisCurveFunc(xMin)}
                    var P2 = {x:xMax, y:thisCurveFunc(xMax)}
                    var C = {x:(xMin+xMax)/2,  y:P1.y+curveObj.currentDerivative(xMin)*(xMax-xMin)/2}

                    
                    var d = `M${P1.x},${P1.y} Q${C.x},${C.y},${P2.x},${P2.y} `
                    var d2 = `M${P1.x},${P1.y} Q${C.x+25},${C.y},${P2.x},${P2.y} `
                    var d3 = `M${P1.x},${P1.y} Q${C.x+25},${C.y+25},${P2.x},${P2.y} `
                    // for(let x =xMin; x <= xMax; x+=.5) {
                    //     var y = thisCurveFunc(x) 
                    //     d+=`L${x},${y} `
                    // }

                    var path = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path.setAttribute("id",`curve${curve}${xMin}${xMax}`)
                    path.setAttribute("d",d);
                    path.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                    path.setAttribute("fill","none");
                    // path.insertAdjacentHTML('beforeend', `<animate xlink:href="#curve${curve}${xMin}${xMax}" id="pathAnimate${curve}${xMin}${xMax}" attributeName="d" attributeType="XML" dur="3s" begin="0s"  repeatCount="indefinite"
                    // values="${d}; ${d2}; ${d3}" 
                    // ></animate>`)
                    document.getElementById("curveGroup").append(path);
                    ++pathAmount;
                }
                
            }
        }
        return new Promise((resolve,reject)=> { resolve("here"); });
    }
    
    async loadImage(e) {
        var filterInfo = [
            // {type:"gammaTransfer", applyTo:"RGB", exponent:2, amplitude:10, offset:5},
            // {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,0,1.0,1.0]},
            // {type:"gaussBlur", kernelLength:7, sig:4000}
            // {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,.5,.9,1.0]},
            // {type:"edgeDetect", kernelLength:7,middleValue:20, fillValue:-1, cornerValue:-1},
            // {type:"blackWhiteTransfer"},
            // {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,0,1.0,1.0]},
        ]
        this.currentScanObj = new ImageScan('testCanvas',filterInfo);
        var imageReadPromise = this.currentScanObj.imageReader()
        imageReadPromise.then(result => {this.setImageLayers()});
        document.getElementById("testCanvas").onmousemove = (e) => this.showSigmaLayersOnHover(e);
        this.selectedImage = this.currentScanObj.selectedFile;
        return;
	}
    
    render() {
        return (
            <Layout title="File Loading Page" description="Description about file">
                <Container id="imageFileLoader" style={{top:"50%", position:"absolute"}}>
                    <label htmlFor="imgFile">Choose image file: </label>
                    <input type="file" id="imgFile" onChange={this.loadImage}></input>
                </Container>
                
                <svg id="mainSVG" style={{display:"none"}} width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"></svg>
                <div id="windowTest" style={{backgroundColor:'black', top:'100px', left:'30px', width:100, height:100} } />

                <canvas id="testCanvas" width={1000} height={500} style={{left:"150px", top:"60vh",position:"absolute",display:"block", border:"1px solid black"}} />
                <select id="selectFilter" name="filterEffect" onChange={this.selectImageLayerToDisplay}></select>
                <svg id="resultSVG" width={1000} height={500} style={{left:"150px",top:"110vh",position:"absolute",display:"block", border:"1px solid black"}}>
                    <g id="curveGroup"></g>
                    <g id="ptGroup"></g>
                </svg>
            </Layout> 
            
      );
    }
}
export default FileManipPage;