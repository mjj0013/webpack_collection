import React, {useState} from 'react';
import {Container } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";
// import { documentElement } from 'min-document';
import {ImageScan} from './imageManip.js'
// var globalImageData;
var geval =eval;
var scanObj;
// function pick(event) {
//     var x = event.layerX;
//     var y = event.layerY;
    
//     var context = event.target.getContext("2d");
   
//     var pixel = context.getImageData(x, y, 1, 1);
//     var data = pixel.data;
    

//     // var rData = data[0]
//     // var gData = data[1]
//     // var bData = data[2]
//     // var aData = data[3]
//     var mag = scanObj.imageLayers[0]["resultData"]["magGradient1"][(x)+scanObj.imageWidth*y]
//     //   const rgba = `rgba(${rData}, ${gData}, ${bData}, ${aData / 255})`;
//         const magStr = `mag=${mag}`;
//       document.getElementById("hovered-color").style.background = rgba;
//       document.getElementById("hovered-color").textContent = rgba;
  
//       return magStr;
//   }




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

    morphErosion(canvas);
        return new Promise((resolve,reject)=> {
    })

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
        this.filterEffectChanged = this.filterEffectChanged.bind(this);
        this.selectedImage = null
        this.drawBounds = this.drawBounds.bind(this);
    }
    showSigmaLayersOnHover(e) {
        var x = e.layerX;
        var y = e.layerY;
        var idx = (x) + (y)*this.currentScanObj.imageWidth;
        var mag = this.currentScanObj.imageLayers[0]["resultData"]["magGradient1"][idx]
        var theta = this.currentScanObj.imageLayers[0]["resultData"]["thetaGradient1"][idx]

        // console.log("mag", Math.sqrt(mag*Math.cos(theta)*mag*Math.cos(theta) + mag*Math.sin(theta)*mag*Math.sin(theta)))
        console.log("mag", Math.sqrt(mag*Math.cos(theta)*mag*Math.cos(theta) + mag*Math.sin(theta)*mag*Math.sin(theta)))
        
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

    numOfPagesChanged(e) {
        this.setState({num: e.target.value});  
    }
    filterEffectChanged(e) {
        var context = document.getElementById("testCanvas").getContext('2d');
        if(e.target.value=="none") {
            const reader = new FileReader();
        
            //var OBJ = this;
            reader.addEventListener("load", 
                function () {
                    const img = new Image();
                    img.onload = function() {
                        context.drawImage(img,0,0);
                        console.log("drawn image");
                    }
                    img.src = reader.result;
                }
            , false);
            if (this.selectedImage) reader.readAsDataURL(this.selectedImage);

        }
        else if(e.target.value=="edgeDetection") {  
        }
        
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
        await this.currentScanObj.imageReader();
        scanObj = this.currentScanObj;
         
        document.getElementById("testCanvas").onmousemove = (e) => this.showSigmaLayersOnHover(e);
        this.selectedImage = this.currentScanObj.selectedFile;
        
        //this.imageScanInstances.push(this.currentScanObj);
        //await imageReader(document.getElementById("luminGrayscale"),null, null)
        
        setTimeout(()=> {
            this.drawBounds();
        }, 1000);

        // setTimeout(()=> {
        //     var asyncFunc= this.currentScanObj.approximateEdgeBounds();
        //     asyncFunc.then(function(result) {
        //         console.log("result",result)
        //         drawBounds(result);
        //     });
        // }, 1000);
        return;
	}
    drawBounds() {
        //console.log("curveData",curveData)
        console.log("Drawing bounds on SVG...");
        var polyData = this.currentScanObj.lagrangePolys;
        console.log("polyData.length", polyData.length)
        var resultSVG = document.getElementById("resultSVG");


       
        for(let curve=0; curve < polyData.length; ++curve) {
            console.log("polyData[curve]", polyData[curve])
            //var funcStr = this.currentScanObj.generateLagrangePolyString(polyData[curve], curve);
            geval(polyData[curve]["equationStr"])
            
            var thisCurveFunc = geval(polyData[curve].equationName)
        
            let xMin = polyData[curve].xRange[0];
            let xMax = polyData[curve].xRange[1];
            // for(let x =xMin; x < xMax; ++x) {
            //     var y = thisCurveFunc(x)
            //     var ptObj = document.createElementNS("http://www.w3.org/2000/svg","circle");
            //     ptObj.setAttribute("cx",x);
            //     ptObj.setAttribute("cy",y);
            //     ptObj.setAttribute("r",.75);
            //     ptObj.setAttribute("fill","black");
            //     resultSVG.append(ptObj);
            // }
            let y = thisCurveFunc(xMin)
            var d = `M${xMin},${y} `
            if(isNaN(y)) continue;
            console.log("curve drawn")
            for(let X=xMin; X < xMax;X+=.5) {
                let y = thisCurveFunc(X)
                if(!isNaN(y)) d+=`L${X},${-y} `
                
            }

            //find average slope in curve
            // var slopes = [];
            // for(let p1=0; p1 < xValues.length; ++p1) {
            //     for(let p2=0; p2 < xValues.length; ++p2) {
            //         if(p1==p2) continue;
    
            //     }
            // }
            var path = document.createElementNS("http://www.w3.org/2000/svg","path");
            path.setAttribute("d",d);
            path.setAttribute("stroke","black");
            path.setAttribute("fill","none");
            resultSVG.append(path);
    
    
        }
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
                <div id="windowTest" style={{backgroundColor:'black', top:'100px', left:'30px', width:25, height:25} } />
                <canvas id="testCanvas" width={1000} height={500} style={{left:"150px", top:"60vh",position:"absolute",display:"block", border:"1px solid black"}} />
                <select id="selectFilter" name="filterEffect" onChange={this.filterEffectChanged}>
                    
                    <option value="edgeDetection">Edge Detection</option>
                    <option value="none">None</option>
                </select>
                <svg id="resultSVG" width={1000} height={500} style={{left:"150px",top:"150vh",position:"absolute",display:"block", border:"1px solid black"}} />
            </Layout> 
            
      );
    }
}
export default FileManipPage;