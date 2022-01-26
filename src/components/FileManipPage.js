import React, {useState} from 'react';
import {Container } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";
// import { documentElement } from 'min-document';
import {ImageScan} from './imageManip.js'
import {Curve} from './Curve.js'
import {Cluster} from './Cluster.js';
// var globalImageData;
var geval =eval;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function traceEdges() {
    console.log("starting scanning")
    var mappedEdges = [];   //right now, just append x,y
    /*
    will contain objects of form 
    {
        pts:[{x:x, y:y}, ...],
        id:"",
    }
    */
    var canvas = document.getElementById("testCanvas");
    var imageData = canvas.getContext("2d").getImageData(0,0, 1000, 500);
    console.log("imageData",imageData)
    // var imageData = context.getImageData(50, 50, img.width, img.height);
    var imageWidth = imageData.width;
    var imageHeight = imageData.height;
    var data = imageData.data
    let frameRadius = 2;    
    //looks at each pixel at (x,y)
   
    // ******* try scanning with recursive boxes to look for patterns (lines, polygons) in the image

    var whiteDensityInKernel = 0;
    var highestDensity = 0;
    for(let imgY=frameRadius; imgY < imageHeight; imgY+=1) {       
        for(let imgX=frameRadius; imgX < imageWidth; imgX+=1) {       
      
            for(let kY=-frameRadius; kY < frameRadius; kY+=1) {       //increment by 4 because its RGBA values
                for(let kX=-frameRadius; kX < frameRadius; kX+=1) {       //increment by 4 because its RGBA values 
                    if(data[4*((imgX-kX) + (imgY-kY)*imageWidth)]>=225 && data[4*((imgX-kX) + (imgY-kY)*imageWidth) + 1]>=225 && data[4*((imgX-kX) + (imgY-kY)*imageWidth)+2]>=225) {
                        ++whiteDensityInKernel; 
                    }
                }
            }
            if(whiteDensityInKernel>=5)    mappedEdges.push({x:imgX, y:imgY});
            
            if(whiteDensityInKernel > highestDensity) highestDensity = whiteDensityInKernel;
            whiteDensityInKernel = 0;
        }
    }   
    console.log("done scanning");
    console.log("mappedEdges.length", mappedEdges.length)
    console.log("highestDensity",highestDensity)
    
    var resultSVG = document.getElementById("resultSVG");
    for(let i =0; i < mappedEdges.length; ++i) {
        var C = document.createElementNS("http://www.w3.org/2000/svg","circle");
        C.setAttribute("cx", mappedEdges[i].x);
        C.setAttribute("cy", mappedEdges[i].y);
        C.setAttribute("r", ".5px");
        C.setAttribute("fill","black");
        resultSVG.appendChild(C);
    }
}

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
        this.currentPts = [];
        this.curveObjs = [];
        this.setImageLayers = this.setImageLayers.bind(this);
        this.mouseClickHandler = this.mouseClickHandler.bind(this);
        this.keyMag = 2;
    }
    mouseClickHandler(e) {
        var resultSVG = document.getElementById("resultSVG");
        const rect = resultSVG.getBoundingClientRect();
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        this.currentPts.push({x:x, y:y, magGradient:this.keyMag});
        var ptObj = document.createElementNS("http://www.w3.org/2000/svg","circle");
        ptObj.setAttribute("cx",x);
        ptObj.setAttribute("cy",y);
        ptObj.setAttribute("r",5);
        ptObj.setAttribute("fill","black");
        document.getElementById("ptGroup").append(ptObj);
    }


    selectImageLayerToDisplay(e) {
        var canvas = document.getElementById("testCanvas");
        var context = document.getElementById("testCanvas").getContext('2d');
        var selectedIdx = e.target.value;
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
        var selectedCornerLocations = this.currentScanObj.imageLayers[selectedIdx]["resultData"]["cornerLocations"];
        for(let c=0; c < selectedCornerLocations.length; ++c) {
            context.beginPath();
            context.arc(selectedCornerLocations[c].x, selectedCornerLocations[c].y, 1, 0, 2 * Math.PI)
            context.fillStyle = "white"
            context.fill()
        }
    
    }
    showSigmaLayersOnHover(e) {
        var x = e.layerX;
        var y = e.layerY;
        var idx = (x) + (y)*this.currentScanObj.imageWidth;
        var mag = this.currentScanObj.imageLayers[0]["resultData"]["magGradient1"][idx]   
        var theta = this.currentScanObj.imageLayers[0]["resultData"]["thetaGradient1"][idx]
        var ratio =  this.currentScanObj.imageLayers[0]["resultData"]["slopeRateY1"][idx] /this.currentScanObj.imageLayers[0]["resultData"]["slopeRateX1"][idx] 
        console.log("mag", mag)        
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

    numOfPagesChanged(e) {    this.setState({num: e.target.value});  }

    componentDidMount() {
        //TESTING CURVE GENERATING
        var resultSVG = document.getElementById("resultSVG")
        document.addEventListener('keydown', (event) => {
            const keyName = event.key;
            console.log("keyName",keyName)

            if(keyName==' ') {
                var clusterObj = new Cluster(this.currentPts,'0');

               
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
            if(['1','2','3','4','5','6','7','8','9'].includes(keyName)) {
                this.keyMag = parseInt(keyName);
            }
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
        // var numPoints = 3;
        // for(let p=0; p < numPoints; ++p) {
        //     let x = getRandomInt(0,900)
        //     let y = getRandomInt(200,300)
        //     this.currentPts.push({x:x,y:y})
        // }

        // for(let i =0; i < this.currentPts.length; ++i) {
        //     var ptObj = document.createElementNS("http://www.w3.org/2000/svg","circle");         
        //     ptObj.setAttribute("cx",this.currentPts[i].x);
        //     ptObj.setAttribute("cy",this.currentPts[i].y);
        //     ptObj.setAttribute("r",5);
        //     ptObj.setAttribute("fill","black");
        //     document.getElementById("ptGroup").append(ptObj);
        // }
    }
    setImageLayers() {
        console.log("Inserting image layers into selector")
        
        var selectFilter = document.getElementById("selectFilter");
        var imageLayers = this.currentScanObj.imageLayers
        for(let l =0; l < imageLayers.length; ++l) {
            var layerName = `Layer ${l} | Sigma=${imageLayers[l]["component"].sig}`
            selectFilter.insertAdjacentHTML('beforeEnd', `<option value="${l}">${layerName}</option>`)
        }
        var pathAmount = 0;
        var grid = this.currentScanObj.combinedGrid.grid;
        var window = {w:this.currentScanObj.combinedGrid.windowWidth, h:this.currentScanObj.combinedGrid.windowHeight}
        var boxX = 1;   //4 when 100 
        var boxY = 1;   //2 when 100
        var thisUniqueFeats = grid[boxY][boxX];
        
        var canvas = document.getElementById("testCanvas");
        var context = canvas.getContext("2d");
        context.rect(boxX*window.w, boxY*window.h, window.w, window.h)
        context.strokeStyle = "white"
        context.stroke();
        
        console.log('thisUniqueFeats',thisUniqueFeats)


        var clusterObj = new Cluster(thisUniqueFeats);
        console.log('clusterObj.subClusters',clusterObj.subClusters)

        // for(let pt=0; pt < thisUniqueFeats.length; ++pt) {
        //     var circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
        //     circle.setAttribute('cx', thisUniqueFeats[pt].x)
        //     circle.setAttribute('cy', thisUniqueFeats[pt].y)
        //     circle.setAttribute('r', ".5px")
        //     // path.setAttribute("stroke","black");
        //     circle.setAttribute("fill","black");
        //     document.getElementById("ptGroup").append(circle);
        // }

        // if(thisUniqueFeats.length <4) {
        //     console.log("!!! not enough points in thisUniqueFeats");
        //     return;
        // }
        
        var curveObjs = [];
        for(let cl=0; cl < clusterObj.subClusters.length; ++cl) {
            var curve = new Curve(clusterObj.subClusters[cl],`${5}${5}_${cl}`);
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
            // let xMin = 0
            // let xMax = 1
            
            var d = `M${xMin},${thisCurveFunc(xMin) } `
            
            for(let x =xMin; x <= xMax; x+=.5) {
                var y = thisCurveFunc(x) 
                d+=`L${x},${y} `
            }
            var path = document.createElementNS("http://www.w3.org/2000/svg","path");
            path.setAttribute("d",d);
            path.setAttribute("stroke","black");
            path.setAttribute("fill","none");
            document.getElementById("curveGroup").append(path);
            ++pathAmount;
        }
            
       
        // for(let gY=0; gY < grid.length; ++gY) {
        //     for(let gX=0; gX < grid[gY].length; ++gX) {
        //         var thisUniqueFeats = grid[gY][gX];
        //         for(let feat=0; feat < thisUniqueFeats.length; ++feat) {
                    
        //             var curveObj = new Curve(thisUniqueFeats[feat].pts,`${gY}${gX}_${feat}`)
                  
        //             var curveData =curveObj.curveData;
                    
        //             geval(curveData["equationStr"])
        //             var thisCurveFunc = geval(curveData.equationName)
        //             let xMin = curveObj.xRange[0];
        //             let xMax = curveObj.xRange[1];
        //             var d = `M${xMin},${thisCurveFunc(xMin)} `
        //             for(let x =xMin; x < xMax; ++x) {
        //                 var y = thisCurveFunc(x)
        //                 d+=`L${x},${y} `
        //             }
        //             var path = document.createElementNS("http://www.w3.org/2000/svg","path");
        //             path.setAttribute("d",d);
        //             path.setAttribute("stroke","black");
        //             path.setAttribute("fill","none");
        //             document.getElementById("curveGroup").append(path);
        //             ++pathAmount;
        //         }
        //     }
        // }
        console.log("number of paths: ", pathAmount )



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
                <Container id="imageFileLoader" style={{top:"40%", position:"absolute"}}>
                    <label htmlFor="imgFile">Choose image file: </label>
                    <input type="file" id="imgFile" onChange={this.loadImage}></input>
                    <button onClick={traceEdges}>Trace Edges</button>
                </Container>
                
                <svg id="mainSVG" style={{display:"none"}} width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"></svg>
                <div id="windowTest" style={{backgroundColor:'black', top:'100px', left:'30px', width:100, height:100} } />
                <canvas id="testCanvas" width={1000} height={500} style={{left:"150px", top:"60vh",position:"absolute",display:"block", border:"1px solid black"}} />
                <select id="selectFilter" name="filterEffect" onChange={this.selectImageLayerToDisplay}>
                    
                    
                    {/* <option value="none">None</option> */}
                </select>
                <svg id="resultSVG" width={1000} height={500} style={{left:"150px",top:"100vh",position:"absolute",display:"block", border:"1px solid black"}}>
                    
                    <g id="curveGroup"></g>
                    <g id="ptGroup"></g>
                </svg>
            </Layout> 
            
      );
    }
}
export default FileManipPage;