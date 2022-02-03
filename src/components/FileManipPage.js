import React, {useState} from 'react';
import {Container } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";
import { documentElement } from 'min-document';
import {ImageScan} from './imageManip.js'
import {Curve} from './Curve.js'
import {Cluster} from './Cluster.js';
import {mergeSubElements, hasIntersection2D, numberInRange,distance} from './utility.js'

var geval = eval;
// import { Matrix, solve } from 'ml-matrix';

class FileManipPage extends React.Component {
    constructor(props) {
        super(props);
        this.loadText= this.loadText.bind(this);
        this.numOfPagesChanged= this.numOfPagesChanged.bind(this);
        this.state = {num:''};
        this.loadImage = this.loadImage.bind(this);
        this.showValuesOnHover = this.showValuesOnHover.bind(this)
        this.imageScanInstances = [];
        this.selectImageLayerToDisplay = this.selectImageLayerToDisplay.bind(this);
        this.tracingWindow = this.tracingWindow.bind(this);
        this.edgeTracer = this.edgeTracer.bind(this);
        this.selectedImage = null
        
        this.curveObjs = [];
        this.setImageLayers = this.setImageLayers.bind(this);
        
        this.currentPts = [];//for testing clustering algorithm
        this.keyMag = 2;    //for testing clustering algorithm
        this.currentImageLayerIdx = 0;
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
            //var color = `rgb(${getRandomInt(0,255)},${getRandomInt(0,255)},${getRandomInt(0,255)} )`
            var color='black';
            for(let pt=0; pt < cornerClusters[cluster].length; ++pt) {
                context.beginPath();
                context.arc(cornerClusters[cluster][pt].x, cornerClusters[cluster][pt].y, 1, 0, 2 * Math.PI)
                context.fillStyle = color
                context.fill();
            }   
        }
    }
    showValuesOnHover(e) {
        var x = e.layerX;
        var y = e.layerY;
        var idx = (x) + (y)*this.currentScanObj.imageWidth;
        if(this.currentScanObj.imageLayers.length==0) return;
        var mag = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["magGradient"][idx]  
        var laplacian =   this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["laplacian"][idx]  
        var theta = this.currentScanObj.imageLayers[this.currentImageLayerIdx]["resultData"]["thetaGradient"][idx]         //subtract 90 degrees (1.570795 in radians) from this to get actual theta
        
        var e1 = document.getElementById("e1");
        e1.setAttribute("x2", (mag+laplacian)*Math.cos(1.57079+theta)*100);
        e1.setAttribute("y2",(mag+laplacian)*Math.sin(1.57079+theta)*100);
        console.log(`theta=${theta}  |  1st gradient mag=${mag}  |  2nd gradient mag (laplacian)=${laplacian}`)
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

    edgeTracer(resultData,movWinRadius=10) {
        // Traces edges starting from each detected corner. A 5x5 window is mapped around each corner to account for multiple edges coming from corner. Duplicates edges are detected 
        // Calls 'tracingWindow' recursively when an edge continues in a specific direction.
        // TODO: add Hough Transform for ellipse detection (iterating through different radius lengths to see which radius has most 'votes'/ fits data points)
        var cornerLocations = resultData["cornerLocations"];
        var clusterMatrix=[];

       

        for(let corn=0; corn < cornerLocations.length; ++corn) {
            var currentCorner = cornerLocations[corn]
            var currentTheta = resultData["thetaGradient"][currentCorner.pixelIdx];

            //searches for edges in 5x5 window around every corner, to try to account for multiple edges coming from one corner
            var foundEdges = [];        //will consist of objects w/ form : {theta:relativeTheta, thetaRange:[relativeTheta-.261799, relativeTheta+.261799], pt1:{x:..,y:..}, pt2:{x:..,y:..} }
            for(let wY=-5; wY < 5; ++wY) {
                for(let wX=-5; wX < 5; ++wX) {
                    if(wY==0 && wX==0) continue;
                    var relativeIdx = (currentCorner.x+wX) + (currentCorner.y+wY)*this.currentScanObj.imageWidth
                    if(resultData["harrisResponse"][relativeIdx] < 0) {     // < 0 means its classified as an edge by Harris Response
                        var relativeTheta = resultData["thetaGradient"][relativeIdx];
                        var edgeIsUnique = true;
                        for(let edge=0; edge < foundEdges.length; ++edge) {
                            let lowerTheta = foundEdges[edge].thetaRange[0];
                            let upperTheta = foundEdges[edge].thetaRange[1];
                            
                            if(relativeTheta >= lowerTheta && relativeTheta <= upperTheta) {      //two angles are relatively the same
                                edgeIsUnique=false;
                                break;
                            }
                        }
                        if(edgeIsUnique) {       //edge is completely different from other edges
                            // +/-0.13089 7.5 degrees ( so 15 degrees), OR +/-0.261799 15 degrees ( so 30 degrees)
                            foundEdges.push({theta:relativeTheta, thetaRange: [relativeTheta-.261799, relativeTheta+.261799], pt1:{x:currentCorner.x, y:currentCorner.y}, pt2:{x:currentCorner.x+wX, y:currentCorner.y+wY}}) 

                            var relativePt = {magGradient:resultData["magGradient"][relativeIdx],  thetaGradient:resultData["thetaGradient"][relativeIdx] , x:currentCorner.x+wX, y:currentCorner.y+wY}
                            var edgePts = this.tracingWindow(resultData, relativePt,movWinRadius)  //make this a cluster
                            clusterMatrix.push(edgePts);
                        }
                    }
                }
            }
            var edgePts = this.tracingWindow(resultData, currentCorner,movWinRadius)  //make this a cluster
            clusterMatrix.push(edgePts);
        }
        console.log('clusterMatrix',clusterMatrix)
        
        // for(let clm=0; clm < clusterMatrix.length; ++clm) {
        //     var preCluster1 = clusterMatrix[clm];
        //     if(preCluster1==undefined) continue;
        //     for(let clm2=0; clm2 < clusterMatrix.length; ++clm2) {
        //         if(clm==clm2) continue;
        //         var preCluster2 = clusterMatrix[clm2];
        //         if(preCluster2==undefined) continue;

        //         for(let pt=0; pt < preCluster1.length; ++pt) {
        //             var edge1 = [preCluster1[pt], pt+1<preCluster1.length? preCluster1[pt+1] : -1]
        //             if(edge1[1]==-1 || edge1[1]==undefined) break;
        //             for(let pt2=0; pt2 < preCluster2.length; ++pt2) {
        //                 var edge2 = [preCluster2[pt2], pt2+1<preCluster2.length? preCluster2[pt2+1] : -1]
                        
        //                 if(edge2[1]==-1 || edge2[1]==undefined) break;
        //                 // console.log('edge1,edge2',edge1,edge2)
        //                 if(numberInRange(edge1[0].thetaGradient, edge2[0].thetaGradient,.13089) || numberInRange(edge1[1].thetaGradient, edge2[1].thetaGradient, .13089) ) {
        //                     if(distance(edge1[0],edge2[0]) <= 5) {        //merge these edges into 1
        //                         clusterMatrix = mergeSubElements(clusterMatrix,clm,clm2);
        //                     }
        //                     else if(distance(edge1[0],edge2[1]) <= 5) {        //merge these edges into 1
        //                         clusterMatrix = mergeSubElements(clusterMatrix,clm,clm2);
        //                     }
        //                     else if(distance(edge1[1],edge2[0]) <= 5) {        //merge these edges into 1
        //                         clusterMatrix = mergeSubElements(clusterMatrix,clm,clm2);
        //                     }
        //                     else if(distance(edge1[1],edge2[1]) <= 5) {        //merge these edges into 1
        //                         clusterMatrix = mergeSubElements(clusterMatrix,clm,clm2);
        //                     }
        //                     // hasIntersection2D
        //                 }
        //             }
        //         }
        //     }
        // }
        var clusterOperations = [
            {name:'density',epsilon:null, minPts:3, epsilonMultiplier:1}
        ]
        for(let clm=0; clm < clusterMatrix.length; ++clm) {
            for(let pt=0; pt < clusterMatrix[clm].length; ++pt) {
                var pt1 = clusterMatrix[clm][pt];
                var pt2 = pt+1 < clusterMatrix[clm].length ? clusterMatrix[clm][pt+1] : -1;
                if(pt2==-1) break;
                if((currentCorner.x==pt1.x && currentCorner.y==pt1.y) || (currentCorner.x==pt2.x && currentCorner.y==pt2.y)) continue;      //two edges are just edges from currentCorner
                

            }
            
            
            
            var clusterObj = new Cluster(clusterMatrix[clm], clusterOperations);

            var curveObjs = [];
            for(let cl=0; cl < clusterObj.subClusters.length; ++cl) {
                var curve = new Curve(clusterObj.subClusters[cl],`curve${clm}_${cl}`,2);
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
          
                var path = document.createElementNS("http://www.w3.org/2000/svg","path");
                path.setAttribute("id",`curve${curve}_${clm}`)
                path.setAttribute("d",d);
                // path.setAttribute("stroke",`rgb(${getRandomInt(0,255)}, ${getRandomInt(0,255)}, ${getRandomInt(0,255)})`);
                path.setAttribute("stroke",`black`);
                path.setAttribute("fill","none");
                // path.insertAdjacentHTML('beforeend',`<animate xlink:href="#curve${curve}_${clm}" id="pathAnimatecurve${curve}_${clm}" attributeName="d" attributeType="XML" dur="3s" begin="0s" repeatCount="indefinite" values="${d}; ${d2}; ${d3}"></animate>`)
                document.getElementById("curveGroup").append(path);
            }
        }
    }

    tracingWindow(resultData, currentPt, movWinRadius=7) {      
        //gathers data points by following/tracing a line with common gradient value and  with 15 degrees of flexibility between each data point (so it results in a curve if applicable). Clustering happens after this function, not during

        //currentPt is object {x:..., y:...}
        var imageWidth = this.currentScanObj.imageWidth;
        var imageHeight  =this.currentScanObj.imageHeight;
        var imageLength=imageWidth*imageHeight;
        var dataPts = [currentPt]

        var currentTheta = currentPt.thetaGradient;       
        // var currentLaplacian = resultData["laplacian"][currentIdx]

        //for testing different lengths of edges
        var nextShots = [];
        for(let i=movWinRadius; i > 0; --i) {
            var nextX = Math.round(i*Math.cos(currentTheta-1.57079))
            var nextY = Math.round(i*Math.sin(currentTheta-1.57079))
            nextShots.push({x:nextX, y:nextY})
        }
        for(let shot=0; shot < nextShots.length; ++shot) {
            var nextIdx = (currentPt.x+nextShots[shot].x) + (currentPt.y+nextShots[shot].y)*imageWidth
            if(nextIdx >= 0 && nextIdx <= imageLength) {
                if(resultData["magGradient"][nextIdx] >= 75) {
                    var nextTheta = resultData["thetaGradient"][nextIdx];
                    var nextMag = resultData["magGradient"][nextIdx]
                    var nextMagIsSimilar = numberInRange(nextMag, currentPt.magGradient, 25)
                    var nextThetaIsSimilar = numberInRange(nextTheta, currentTheta, .26179);    //returns true if nextTheta is +/-10 degrees (.26179 rad, .3490 rad) of currentTheta OR if difference b/w two angles is 180 
        
                    if(nextThetaIsSimilar && nextMagIsSimilar) {
                        var nextObj = {x:currentPt.x+nextShots[shot].x,  y:currentPt.y+nextShots[shot].y, magGradient:resultData["magGradient"][nextIdx], thetaGradient:nextTheta};
                        var nextResult = this.tracingWindow(resultData, nextObj, movWinRadius)
                        dataPts = dataPts.concat(nextResult);
                        break;
                    }
                }
            }
        }
        return dataPts;
    }

    setImageLayers() {
        console.log("Inserting image layers into selector")
        var selectFilter = document.getElementById("selectFilter");
        var imageLayers = this.currentScanObj.imageLayers
        for(let l =0; l < imageLayers.length; ++l) {
            var layerName = `Layer ${l} | Sigma=${imageLayers[l]["component"].sig}`
            selectFilter.insertAdjacentHTML('beforeEnd', `<option value="${l}">${layerName}</option>`)
        }
        var resultData = imageLayers[0]["resultData"];
        this.edgeTracer(resultData);
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
        document.getElementById("testCanvas").onmousemove = (e) => this.showValuesOnHover(e);
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


                <svg id="eigenVectors" width="200" height="200" xmlns="http://www.w3.org/2000/svg" style={{left:"80vw", top:"60vh",position:"absolute",display:"block", border:"1px solid black"}}>
                    <line id='e1' x1="100" y1="100" x2="100" y2="0" stroke="red" />
                    {/* <line id='e2' x1="100" y1="100" x2="100" y2="0" stroke="blue" /> */}
                </svg>
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