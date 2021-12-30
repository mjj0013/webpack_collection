import React, {useState} from 'react';
import { List, Pagination, Header, Container, Divider, Icon } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";
import { documentElement } from 'min-document';
import {imageReader, morphErosion, simpleGrayscaleConvert, approximateEdgeBounds} from './imageManip.js'
// var globalImageData;


// function pick(event) {
//     var x = event.layerX;
//     var y = event.layerY;
    
//     var context = event.target.getContext("2d");
   
//     var pixel = context.getImageData(x, y, 1, 1);
//     var data = pixel.data;
//     var rData = data[0]
//     var gData = data[1]
//     var bData = data[2]
//     var aData = data[3]
  
//       const rgba = `rgba(${rData}, ${gData}, ${bData}, ${aData / 255})`;
//       document.getElementById("hovered-color").style.background = rgba;
//       document.getElementById("hovered-color").textContent = rgba;
  
//       return rgba;
//   }


function drawBounds(curveData) {
    console.log("curveData",curveData)
    var resultSVG = document.getElementById("resultSVG");
    for(let curve=0; curve < curveData.length; ++curve) {
        var yValues = curveData[curve].yValues;
        var xValues = curveData[curve].xValues;
        
        xValues.sort((a,b)=>a-b);
        //
        var d = `M${xValues[0]},${xValues[0]} `
        var curveFunc = (x) => curveData[curve].coeffs.data[0] + x*curveData[curve].coeffs.data[1] + x*x*curveData[curve].coeffs.data[2] + x*x*x*curveData[curve].coeffs.data[3]
        for(let X=xValues[0]; X < xValues[xValues.length-1]; ++X) {
            let y = curveFunc(X)
            
            d+=`L${X},${y} `

        }
        var path = document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d",d);
        path.setAttribute("stroke","black");
        path.setAttribute("fill","none");
        resultSVG.append(path);


    }
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
                    // if(4*((imgX-kX) + (imgY-kY)*imageWidth) >= imageData.length) continue; 
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

    async loadImage(e) {
        var canvas = document.getElementById('testCanvas');
        var filterInfo = [
            // {type:"gammaTransfer", applyTo:"RGB", exponent:2, amplitude:10, offset:5},
            // {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,0,1.0,1.0]},
            {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,.5,.9,1.0]},

            {type:"edgeDetect", kernelLength:7,middleValue:20, fillValue:-1, cornerValue:-1},
            {type:"blackWhiteTransfer"},
            {type:"discreteTransfer",applyTo:"RGB",tableValues:[0,0,1.0,1.0]},
        ]

        //await imageReader(document.getElementById("luminGrayscale"),null, null)
        //[{type:"grayScale", subType:"luminosity"}]

        // await imageReader(document.getElementById("averageGrayscale"),null, [{type:"grayScale", subType:"average"}])
        await imageReader(canvas,null, filterInfo);
        // var result;
        


        // var read = imageReader(canvas,null, filterInfo);
        setTimeout(()=> {
            var asyncFunc= approximateEdgeBounds(canvas);
            asyncFunc.then(function(result) {
                console.log("result",result)
                drawBounds(result);


            });


        }, 1000);
        
        // imageReader(canvas,null,filterInfo).then(function(result) {
        //     console.log("result",result)
        //     var a = approximateEdgeBounds(canvas)
        //     console.log(a);
        // })
        
        
        
        
        
        return;
	}

//     <Container id="textFileLoader" style={{display:"block", top:"20%", position:"absolute"}}>
//     <label htmlFor="numOfPages" value='1'>Number of Pages: </label>
//     <select id="numOfPages" onChange={this.numOfPagesChanged}>
//         <option value='1'>1</option>
//         <option value='2'>2</option>
//         <option value='3'>3</option>
//         <option value='4'>4</option>
//         <option value='5'>5</option>
//         <option value='6'>6</option>
//         <option value='7'>7</option>
//     </select>

//     <label htmlFor="files">Choose text file: </label>
//     <input type="file" id="files" onChange={this.loadText}></input>

// </Container>  
/* <Divider /> */
/* <textarea id="fileText" cols='100' rows='30'></textarea> 
<Divider />*/
    render() {
        return (
            <Layout title="File Loading Page" description="Description about file">
                

                <Container id="imageFileLoader" style={{top:"40%", position:"absolute"}}>
                    <label htmlFor="imgFile">Choose image file: </label>
                    <input type="file" id="imgFile" onChange={this.loadImage}></input>
                    <button onClick={traceEdges}>Trace Edges</button>
                </Container>
                
                <svg id="mainSVG" style={{display:"none"}} width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"> 
					<filter id="edgeFilter" color-interpolation-filters="sRGB" >
                    
                        <feComponentTransfer result="colorTransfer1">
                                <feFuncR type="gamma" amplitude="25" exponent="5">
                                    {/* <animate attributeName="exponent" attributeType="XML" from={5} to={25} dur="4s" start="0s" repeatCount="indefinite" /> */}
                                </feFuncR>
                                <feFuncG type="gamma" amplitude="25" exponent="5">
                                    {/* <animate attributeName="exponent" attributeType="XML" from={5} to={25} dur="4s" start="0s" repeatCount="indefinite"/> */}
                                </feFuncG>
                                <feFuncB type="gamma" amplitude="25" exponent="5">
                                    {/* <animate attributeName="exponent" attributeType="XML" from={5} to={25} dur="4s" start="0s" repeatCount="indefinite"/> */}
                                </feFuncB>
                                <feFuncA type="gamma" amplitude="25" exponent="5"/>
                        </feComponentTransfer>
                        <feComponentTransfer in="colorTransfer1" result="colorTransfer2">
                                <feFuncR type="discrete" tableValues="0 254 255" />
                                <feFuncG type="discrete" tableValues="0 254 255" />
                                <feFuncB type="discrete" tableValues="0 254 255"  />
                                <feFuncA type="discrete" tableValues=".9 1" />

                        </feComponentTransfer>
                        <feColorMatrix in="colorTransfer2" result="blackandwhite" type="matrix" 
                        values="0.3333 0.3333 0.3333 0 0
                                0.3333 0.3333 0.3333 0 0
                                0.3333 0.3333 0.3333 0 0
                                0       0       0    1 0" />
                        <feConvolveMatrix result="edges" in="blackandwhite"
                                    kernelMatrix="-1 -1 -1
                                                  -1 8 -1
                                                  -1 -1 -1"
                                    preserveAlpha="true"
                                    bias=".1"
                        />
                        {/* <feGaussianBlur result="blur" in="blackandwhite" stdDeviation="1"></feGaussianBlur>
                        <feBlend in="blackandwhite" in2="blur" result="edges" mode="difference" />

                        <feGaussianBlur result="blur2" in="edges" stdDeviation="1"></feGaussianBlur> */}
                       
					</filter>
				</svg>
                {/* <img id="sampleImg" width={500} height={500} style={{left:"150px", top:"50vh",position:"absolute",display:"block", border:"1px solid black"}} /> */}
                {/* <img id="testImg" width={500} height={500} style={{left:"150px", top:"100vh",position:"absolute",display:"block", border:"1px solid black", filter:"url(#edgeFilter)"}} /> */}
                
                {/* <iframe style={{filter:"url(#edgeFilter)"}} width="560" height="315" src="https://www.youtube.com/embed/k9wRPOeUhls" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> */}
                
                
                <canvas id="testCanvas" width={1000} height={500} style={{left:"150px", top:"60vh",position:"absolute",display:"block", border:"1px solid black"}} />
                
                <svg id="resultSVG" width={1000} height={500} style={{left:"150px",top:"150vh",position:"absolute",display:"block", border:"1px solid black"}} />

                {/* <canvas id="luminGrayscale" width={1000} height={500} style={{left:"150px", top:"180vh",position:"absolute",display:"block", border:"1px solid black"}} />
                <canvas id="averageGrayscale" width={1000} height={500} style={{left:"150px", top:"240vh",position:"absolute",display:"block", border:"1px solid black"}} />
            */}
            </Layout> 
            
      );
    }
}
export default FileManipPage;

	
