import { ifStatement, isThisExpression, variableDeclaration } from 'babel-types';
import { Matrix,EigenvalueDecomposition, solve } from 'ml-matrix';
import {numberInRange} from './utility.js';


export class ImageScan {
    constructor(targetCanvas,filterInfo) {
        this.imageHeight=0;
        this.imageWidth=0;
        this.filterInfo = filterInfo;
        this.canvasId = targetCanvas;
       
        this.originalImageData = null;
        this.originalData = null;

        this.imageData = null;
        this.data = null;
        this.pixelData = null;

        this.imageReader = this.imageReader.bind(this);
        this.gaussianBlurComponent = this.gaussianBlurComponent.bind(this);
        
        this.generateLagrangePolyString = this.generateLagrangePolyString.bind(this);
        this.lagrangePolys = [];  //strings that are unevaluated functions ( just use eval on them to create)

        this.colorBlackWhiteTransferComponent = this.colorBlackWhiteTransferComponent.bind(this);
        this.colorGammaTransferComponent = this.colorGammaTransferComponent.bind(this);
        this.colorDiscreteTransferComponent = this.colorDiscreteTransferComponent.bind(this);
        this.simpleGrayscaleConvert = this.simpleGrayscaleConvert.bind(this);
       
        this.detectBlobs = this.detectBlobs.bind(this);
        this.processBlobs = this.processBlobs.bind(this);

        this.imageLayers = [];
        this.imageGrid = []
        this.mappedCurves = []
        this.selectedImage = null
    }

    generateLagrangePolyString(pts,equationId) {
        var terms = [];
        var xVals = pts.map(a=>a.x);
        var leastX=99, mostX = 0;
        for(let x=0; x < xVals.length; ++x) {
            if(xVals[x] > mostX) mostX=xVals[x];
            if(xVals[x] < leastX) leastX = xVals[x];
        }
        var yVals = pts.map(a=> a.y);
        for(let p=0; p < pts.length; ++p) {
            var numerator=`${yVals[p]}`
            var denominator = 1;
            for(let pk=0; pk < pts.length; ++pk) {
                if(p==pk) continue;
                numerator += `*(x - ${xVals[pk]})`
                denominator *= (xVals[p]-xVals[pk]);
            }
            terms.push("("+numerator+`/${denominator}`+")")
        }
        var equation = `var curvePoly${equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        this.lagrangePolys.push({xRange:[leastX, mostX],equationStr:equation, equationName:`curvePoly${equationId.toString()}`});
        return equation; 
    }

    processBlobs(windowHeight=100, windowWidth=100) {
        /********************************************************************************************************************************************* 
        For edge detection... simply find the distinct slopes in the image and their locations. 
        If points are very close in their gradient values and are local to each other(in a window), consider them members of the same curve/line 
        Therefore, group together data points that are BOTH relative in their gradients and location. 
        Then perform curve fitting on those data points. 

        Move a window  throughout  image (from top-left to bottom-right) like normal. If a distinct gradient is found, record the position of it and any other pixels that are the same
        When you move the window adjacent to that region again, see whether the slope continues or not. You would most likely already have covered 4 of 8 possible directions it could move in
        After testing all 8 directions on that location, determine which direction it may continue in. 
        If gradient continues in a direction, update its  with newly discovered part. 
        *********************************************************************************************************************************************/

        
            // regions will have objects w/ format:     
            //{top:.., left:.., width:.., height:.., leftMost:[], rightMost:[], topMost:[], bottomMost:[], topLeftMost:[], topRightMost:[], bottomLeftMost:[], bottomRightMost:[]  }

        //makes sure window makes IxJ evenly divided regions.    
        windowHeight = this.imageHeight%windowHeight!=0? windowHeight+(this.imageHeight - (this.imageHeight%windowHeight)): windowHeight;
        windowWidth = this.imageWidth%windowWidth!=0? windowWidth+(this.imageWidth - (this.imageWidth%windowWidth)): windowWidth;
        console.log(windowHeight, windowWidth)
       
        var distThreshold = windowHeight>=windowWidth? windowHeight/8 : windowWidth/8;
        var grid = Array(this.imageHeight/windowHeight).fill(Array(this.imageWidth/windowWidth).fill([]))
        var gridY = 0, gridX=0;
        for(let layer=0; layer < this.imageLayers.length; ++layer) {
            var Layer = this.imageLayers[layer]
            var resultData = Layer["resultData"];
            for(var imgY=windowHeight; imgY < this.imageHeight-windowHeight; imgY+=windowHeight) { 
                for(var imgX=windowWidth; imgX < this.imageWidth-windowWidth; imgX+=windowWidth) {              
                    var interestPts = []     // will be objects w/ format: {mag:.., pts:[], avgMag:..[]}  , mag is the mag that all the pts are close to
                    
                    //moving window so that image is scanned in grid-like way, NOT a convolution
                    for(var kY=-windowHeight; kY < windowHeight; ++kY) {
                        for(var kX=-windowWidth; kX < windowWidth; ++kX) { 
                            var thisX = imgX-kX;
                            var thisY = ((imgY-kY)*this.imageWidth);
                            var thisMagGradient = resultData["magGradient1"][((imgX-kX) + ((imgY-kY)*this.imageWidth))]
                            var thisTheta = resultData["thetaGradient1"][((imgX-kX) + ((imgY-kY)*this.imageWidth))]
                            var distMultiplier = 1;
                            

                            if(thisMagGradient >=100) {
                                
                               
                                var thisSlope = resultData["slopeRateY1"][((imgX-kX) + ((imgY-kY)*this.imageWidth))]/resultData["slopeRateX1"][((imgX-kX) + ((imgY-kY)*this.imageWidth))]
                                interestPts.push({x:thisX, y:thisY, slope:thisSlope})
                            }
                        }
                    }
                    
                    grid[gridY][gridX] = interestPts;
                    ++gridX;
                }
                ++gridY;
            }

        }
        console.log("grid", grid)
        this.imageGrid = {grid:grid, windowHeight:windowHeight, windowWidth:windowWidth};
        return;

    }

    detectBlobs(gaussLength=15, baseSig=5, numLayers=3, sigExpMax=6, k=.04, eigenValEstimate=5000) {
        //  k is sensitivity factor
        //  eigenValEstimate is the eigen-value used as a threshold for determining if eigen-values are large enough. If larger than it, they are accepted.
        
        // http://vision.stanford.edu/teaching/cs231a_autumn1112/lecture/lecture11_detectors_descriptors_cs231a.pdf
       
        //  https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L12.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/calendar.html
        //  http://www.cs.toronto.edu/~jepson/csc420/notes/imageFeaturesIIIBinder.pdf
        //  https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
        //  https://www.youtube.com/watch?v=zItstOggP7M


        this.originalData = this.originalImageData.data;
        var data = this.imageData.data;     //should normally be this.originalImageData.data;
        var componentLength = gaussLength;   //was 3
        
        let sig0 = 1;
        var sigStack = []
        var sigDelta =sigExpMax/numLayers
        if(sigExpMax%numLayers!=0) {
            sigExpMax = sigExpMax+(numLayers - (sigExpMax%numLayers));
            sigDelta = sigExpMax/numLayers;
        }
        var sigStack = [sig0*Math.pow(2,1)]
        // for(let s=sigExpMax;s>=0;s-=sigDelta)    sigStack.push(sig0*Math.pow(baseSig,s));
        var layerStack = [];

        //make stack of layers, which each have different sigma values
        for(let s=0; s < sigStack.length; ++s) {
            var temp = this.gaussianBlurComponent(componentLength, sigStack[s]);
            var component = {kernel:temp.kernel, sig:sigStack[s], kernelRadius:temp.kernelRadius};
            layerStack.push({"component":component, "resultData":{"RGB":data.map((x)=>x),"imageData":null, "mags":[],"yGradient1":[], "xGradient1":[],
            "magGradient1":[],"thetaGradient1":[], "harrisResponse":[], "slopeRateX1":[], "slopeRateY1":[],"cornerLocations":[], "interestRegions":[], "laplacian":[], "eigenVals":[]}});
        }
        //"interestRegions" will have rectangles with format -> {top:.., left:.., width:.., height:..}
        
        var kernelRadius = Math.floor(componentLength/2);     //should be the same on each kernel in the parallelComponent stack
        for(let c=0; c < layerStack.length; ++c) {
            var parallelComponent = layerStack[c];
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) { 
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {
                    let R = 0,G = 0,B = 0;
                    if((imgY >=kernelRadius) && (imgX >=kernelRadius)) {
                        for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {
                            for(var kX=-kernelRadius; kX < kernelRadius; ++kX) { 
                                let value = parallelComponent["component"].kernel[kY+kernelRadius][kX+kernelRadius];
                                R +=data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)]*value;
                                G += data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+1]*value;
                                B += data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+2]*value; 
                            }   
                        }
                    }
                    else {
                        R = data[4*(imgX + imgY*this.imageWidth)];
                        G = data[4*(imgX + imgY*this.imageWidth) + 1]
                        B = data[4*(imgX + imgY*this.imageWidth) + 2]
                    }
                    parallelComponent["resultData"]["RGB"][4*(imgX + imgY*this.imageWidth)] = R;
                    parallelComponent["resultData"]["RGB"][4*(imgX + imgY*this.imageWidth) + 1] = G;
                    parallelComponent["resultData"]["RGB"][4*(imgX + imgY*this.imageWidth) + 2] = B;
                    parallelComponent["resultData"]["mags"].push((R+G+B)/3);
                }
            }
        }
        var windowR = 5; //3 worked good
        var tempKernel = this.gaussianBlurComponent(2*windowR-1, 1);
        var gaussKernel = tempKernel.kernel;
        // gaussKernel = new Matrix(gaussKernel)
        // console.log("gaussKernel",gaussKernel)
        // var LaplacianKernel = [[0,-1,0], [-1,4,-1], [0,-1,0]];
        var LaplacianKernel = [[1,1,1], [1,-8,1], [1,1,1]];
        var SobelKernelX = [[1,0,-1], [2,0,-2], [1,0,-1]]
        var SobelKernelY = [[1,2,1], [0,0,0], [-1,-2,-1]]
        //gaussKernel is multipled to every product of sum (Ixx, Ixy, Iyy)

       
        for(let c=0; c < layerStack.length; ++c) {
            var parallelComponent = layerStack[c];

            console.log(`Starting Layer #${c} of ${layerStack.length}`)
            
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) {      
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {   
                    var sobelX1 = 0, sobelY1=0, laplacian=0;
                    if(!(imgX==0 || imgX==this.imageWidth-1 || imgY==0 || imgY==this.imageHeight-1)) {
                        for(let ky=-1; ky<= 1; ++ky) {
                            for(let kx=-1; kx<= 1; ++kx) {
                                let mag = parallelComponent["resultData"]["mags"][((imgX-kx) + (imgY-ky)*this.imageWidth)]
                                //1st order gradient (Sobel)
                                let sX1 = SobelKernelX[ky+1][kx+1];
                                sobelX1 += mag*sX1;   
                                let sY1 = SobelKernelY[ky+1][kx+1];
                                sobelY1 += mag*sY1;

                                //2nd order gradient (Laplacian)
                                let laplaceVal = LaplacianKernel[ky+1][kx+1];
                                laplacian += mag*laplaceVal;
                            }
                        }
                    }
                    parallelComponent["resultData"]["xGradient1"].push(sobelX1)
                    parallelComponent["resultData"]["yGradient1"].push(sobelY1)
                    parallelComponent["resultData"]["laplacian"].push(laplacian)

                    let magGrad = Math.sqrt((sobelY1*sobelY1) + (sobelX1*sobelX1))
                    let theta = sobelY1==0||sobelX1==0? 0:Math.atan((sobelY1)/(sobelX1));
                    let slopeRateX1 = magGrad*Math.cos(theta);
                    let slopeRateY1 = magGrad*Math.sin(theta)
                    parallelComponent["resultData"]["magGradient1"].push(magGrad);
                    parallelComponent["resultData"]["thetaGradient1"].push(theta); 
                    parallelComponent["resultData"]["slopeRateX1"].push(slopeRateX1) //measure of horizontal-ness
                    parallelComponent["resultData"]["slopeRateY1"].push(slopeRateY1) //measure of vertical-ness
                }
            }

            // https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
            // https://mathinsight.org/directional_derivative_gradient_introduction

            // Harris corner detector
            for(var imgY=windowR; imgY < this.imageHeight-windowR; imgY+=1) {      
                for(var imgX=windowR; imgX < this.imageWidth-windowR; imgX+=1) {   
                    let Ixx = [], Iyy = [], Ixy = [];
                    var isLocalPeak = true;
                    var centerMag = parallelComponent["resultData"]["laplacian"][((imgX) + (imgY)*this.imageWidth)]
                    for(var kY=-windowR; kY <= windowR; ++kY) {  
                        var xRow = [];
                        var yRow = [];
                        var xyRow = [];
                        for(var kX=-windowR; kX <= windowR; ++kX) {   
                            if(parallelComponent["resultData"]["laplacian"][((imgX-kX) + (imgY-kY)*this.imageWidth)] > centerMag) {
                                isLocalPeak = false;
                                parallelComponent["resultData"]["harrisResponse"].push(0);
                                parallelComponent["resultData"]["eigenVals"].push(null);
                                break;
                            }
                            let xComp = parallelComponent["resultData"]["xGradient1"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                            let yComp = parallelComponent["resultData"]["yGradient1"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                            xRow.push(xComp*xComp)
                            xyRow.push(xComp*yComp)
                            yRow.push(yComp*yComp)
                        }
                        if(!isLocalPeak) break;
                        Ixx.push(xRow);
                        Ixy.push(xyRow);
                        Iyy.push(yRow);

                    }
                    if(!isLocalPeak) {continue;}
                    Ixx = new Matrix(Ixx);
                    Ixy = new Matrix(Ixy);
                    Iyy = new Matrix(Iyy);

                    //this gives more weight to the pixels closer to the center pixel
                    // Ixx = Ixx.mmul(gaussKernel);
                    // Ixy = Ixy.mmul(gaussKernel);
                    // Iyy = Iyy.mmul(gaussKernel);

                    var IxxSum = Ixx.sum();
                    var IxySum = Ixy.sum();
                    var IyySum = Iyy.sum();

                    var M = new Matrix([[IxxSum, IxySum], [IxySum, IyySum]]);
                    
                    var det = (IxxSum*IyySum) - (IxySum*IxySum)
                    var trace = IxxSum + IyySum;

                    var eigs = new EigenvalueDecomposition(M);
                    var real = eigs.realEigenvalues;

                    var R = det - k*(trace*trace);      //measure of corner response
                    
                    parallelComponent["resultData"]["harrisResponse"].push(R);
                    parallelComponent["resultData"]["eigenVals"].push(eigs);
                    
                    if(R>0) {
                        if(real[0] > eigenValEstimate && real[1] > eigenValEstimate)  {
                            var pixelIdx = ((imgX) + (imgY)*this.imageWidth);
                            parallelComponent["resultData"]["cornerLocations"].push({x:imgX, y:imgY, pixelIdx:pixelIdx});
                        }
                    }
                }
                console.log(`Completed iter ${(imgX + imgY*this.imageWidth)} of ${this.imageHeight*this.imageWidth}`)
            }

            var cornerLocations = parallelComponent["resultData"]["cornerLocations"];
            var cornerData = [];
            for(let c=0; c < cornerLocations.length; ++c) {
                cornerData.push({x:cornerLocations[c].x, y:cornerLocations[c].y, closestPts:[], pixelIdx:cornerLocations[c].pixelIdx})
            }

            for(let p1=0; p1 < cornerData.length; ++p1) {
                let thisPt = cornerData[p1];
                let closestPts = [];
                for(let p2=0; p2 < cornerData.length; ++p2){
                    if(p2==p1) continue;
                    let otherPt =  cornerData[p2];
                    let squaredDist = (thisPt.x-otherPt.x)*(thisPt.x-otherPt.x) + (thisPt.y-otherPt.y)*(thisPt.y-otherPt.y);
                    closestPts.push({index:p2,squaredDist:squaredDist});
                }
                closestPts.sort(function(a,b) { return a.squaredDist - b.squaredDist;  })
                let maxNumClosest = 4
                let topPts = closestPts.slice(0,maxNumClosest);
                cornerData[p1].closestPts = topPts;   
            }
            parallelComponent["resultData"]["cornerData"] = cornerData;
        }
        
        this.imageLayers = layerStack;
        return layerStack;
    }

    colorDiscreteTransferComponent(inColor, ranges, isAlpha=false) {
        var colorPercentage = inColor;
        if(!isAlpha) colorPercentage = inColor/255;
        var closestColor = inColor;
        if(colorPercentage >= 0 && colorPercentage <=.25) closestColor = ranges[0]
        else if(colorPercentage > .25 && colorPercentage <=.5) closestColor = ranges[1]
        else if(colorPercentage > .5 && colorPercentage <=.75) closestColor = ranges[2]
        else if(colorPercentage > .75) closestColor = ranges[3]
        if(!isAlpha) return closestColor*255;
        else return closestColor;
    }
    colorBlackWhiteTransferComponent(inRGBA) {
        let m = [ [0.333,  0.333,  0.333,  0, 0], [0.3333, 0.3333, 0.3333, 0, 0], [0.3333, 0.3333, 0.3333, 0, 0], [0,      0,      0,      1, 0]]
        var newR = inRGBA[0]*m[0][0] + inRGBA[1]*m[1][0]+ inRGBA[2]*m[2][0]+ inRGBA[3]*m[3][0]   + m[0][4];
        var newG = inRGBA[0]*m[0][1] + inRGBA[1]*m[1][1]+ inRGBA[2]*m[2][1]+ inRGBA[3]*m[3][1]   + m[1][4];
        var newB = inRGBA[0]*m[0][2] + inRGBA[1]*m[1][2]+ inRGBA[2]*m[2][2]+ inRGBA[3]*m[3][2]   + m[2][4];
        var newA = inRGBA[0]*m[0][3] + inRGBA[1]*m[1][3]+ inRGBA[2]*m[2][3]+ inRGBA[3]*m[3][3]   + m[3][4];
        return [newR, newG, newB, newA];
    }

    colorGammaTransferComponent(inColor, amplitude, exponent, offset, isAlpha=false) {
        return amplitude*Math.pow(inColor,exponent) + offset;
    }
    async imageReader(addr=null) {
        return new Promise((resolve,reject)=> {
            var canvas = document.getElementById(this.canvasId)
            var context = canvas.getContext("2d");
            //from https://www.youtube.com/watch?v=-AR-6X_98rM&ab_channel=KyleRobinsonYoung
            //filterInfo will be a list of component-objects of form-> {type:"gauss", kernelLength:5, sig:1}
            //components will be applied in order
            var input = addr==null? document.querySelector('input[type="file"]'): addr
            const preview = document.querySelector('img');
            const file = document.querySelector('input[type=file]').files[0];
            const reader = new FileReader();
            
            this.selectedImage = file;
            var OBJ = this;
            reader.addEventListener("load", function () {
                const img = new Image();
                img.onload = function() {
                    context.drawImage(img,0,0);
                    OBJ.originalImageData = context.getImageData(0,0,canvas.width,canvas.height);
                    OBJ.imageData = context.getImageData(0,0,canvas.width,canvas.height);
                    OBJ.data = OBJ.imageData.data;
                    OBJ.imageWidth = OBJ.imageData.width;
                    OBJ.imageHeight= OBJ.imageData.height;
                    OBJ.pixelData = Array(OBJ.imageHeight).fill(Array(OBJ.imageWidth).fill({gradientX:0, gradientY:0, mag:0}))
                    OBJ.filterInfo.forEach(component => {
                        let componentLength = component.kernelLength ? component.kernelLength : 2;
                        let filterSig = component.sig ? component.sig : 5;
                        if(component.type == "gaussBlur") {
                            var temp = OBJ.gaussianBlurComponent(componentLength, filterSig);
                            component.kernel = temp.kernel;
                            component.sig = temp.sig;
                            component.kernelRadius = temp.kernelRadius;
                        }
                        if(["gammaTransfer","discreteTransfer","blackWhiteTransfer","grayScale"].includes(component.type))     {component.kernelRadius = 0;}
                        
                        var kernelRadius = component.kernelRadius;
                        for(var imgY=kernelRadius; imgY < OBJ.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                            for(var imgX=kernelRadius; imgX < OBJ.imageWidth; imgX+=1) {       //increment by 4 because its RGBA values
                                if(component.type=="grayScale") {
                                    let pixel = [OBJ.data[4*(imgY*OBJ.imageWidth + imgX)],OBJ.data[4*(imgY*OBJ.imageWidth + imgX)+1],OBJ.data[4*(imgY*OBJ.imageWidth + imgX)+2],OBJ.data[4*(imgY*OBJ.imageWidth + imgX)+3]]
                                    var newRGBA = OBJ.simpleGrayscaleConvert(pixel,component.subType);
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX)] = newRGBA[0];
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 1] = newRGBA[1]
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 2] = newRGBA[2]
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 3] = newRGBA[3]
                                }
                                else if(component.type=="blackWhiteTransfer") {
                                    let R = OBJ.data[4*(imgY*OBJ.imageWidth + imgX)];
                                    let G = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +1];
                                    let B = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +2];
                                    let A = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +3];
                                    var newRGBA = OBJ.colorBlackWhiteTransferComponent([R,G,B,A]);
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX)] = newRGBA[0];
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 1] = newRGBA[1]
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 2] = newRGBA[2]
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 3] = newRGBA[3]
                                }
                                else if(component.type=="gammaTransfer") {
                                    let R = OBJ.data[4*(imgY*OBJ.imageWidth + imgX)];
                                    let G = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +1];
                                    let B = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +2];
                                    let A = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +3];
                                    R = component.applyTo.includes("R")? OBJ.colorGammaTransferComponent(R, component.amplitude, component.exponent, component.offset):R;
                                    G = component.applyTo.includes("G")? OBJ.colorGammaTransferComponent(G, component.amplitude, component.exponent, component.offset):G;
                                    B = component.applyTo.includes("B")? OBJ.colorGammaTransferComponent(B, component.amplitude, component.exponent, component.offset):B;
                                    A = component.applyTo.includes("A")? OBJ.colorGammaTransferComponent(A, component.amplitude, component.exponent, component.offset):A;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX)] = R;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 1] = G;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 2] = B;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 3] = A;
                                }
                                else if(component.type=="discreteTransfer") {
                                    let R = OBJ.data[4*(imgY*OBJ.imageWidth + imgX)];
                                    let G = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +1];
                                    let B = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +2];
                                    let A = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +3];
                                    R = component.applyTo.includes("R")? OBJ.colorDiscreteTransferComponent(R, component.tableValues):R;
                                    G = component.applyTo.includes("G")? OBJ.colorDiscreteTransferComponent(G, component.tableValues):G;
                                    B = component.applyTo.includes("B")? OBJ.colorDiscreteTransferComponent(B, component.tableValues):B;
                                    A = component.applyTo.includes("A")? OBJ.colorDiscreteTransferComponent(A, component.tableValues):A;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX)] = R;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 1] = G;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 2] = B;
                                    OBJ.data[4*(imgY*OBJ.imageWidth + imgX) + 3] = A;
                                }
                                else if(component.type=="gaussBlur" || component.type=="edgeDetect") {
                                    let R = 0,G = 0,B = 0;
                                    for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                                        for(var kX=-kernelRadius; kX < kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                                            let value = component.kernel[kY+kernelRadius][kX+kernelRadius];
                                            R += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)]*value;
                                            G += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)+1]*value;
                                            B += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)+2]*value;
                                        }
                                    }
                                    OBJ.data[4*(imgX + imgY*OBJ.imageWidth)] = R;
                                    OBJ.data[4*(imgX + imgY*OBJ.imageWidth) + 1] = G;
                                    OBJ.data[4*(imgX + imgY*OBJ.imageWidth) + 2] = B;
                                }
                            }
                        }
                    })
                    //calculating values and gradients of every pixel
                    for(var imgY=0; imgY < OBJ.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                        for(var imgX=0; imgX < OBJ.imageWidth; imgX+=1) {
                            let thisR = OBJ.data[4*((imgX) + (imgY)*OBJ.imageWidth)];
                            let thisG = OBJ.data[4*((imgX) + (imgY)*OBJ.imageWidth)+1];
                            let thisB = OBJ.data[4*((imgX) + (imgY)*OBJ.imageWidth)+2];
                            let thisVal = (thisR + thisG + thisB)/3;
                            let leftVal=-1, rightVal=-1, topVal=-1, bottomVal=-1;
                            if(imgX>0) {
                                let leftR = OBJ.data[4*((imgX-1) + (imgY)*OBJ.imageWidth)];
                                let leftG = OBJ.data[4*((imgX-1) + (imgY)*OBJ.imageWidth)+1];
                                let leftB = OBJ.data[4*((imgX-1) + (imgY)*OBJ.imageWidth)+2];
                                leftVal = (leftR + leftG + leftB)/3;
                            }
                            if(imgX < OBJ.imageWidth-1) {
                                let rightR = OBJ.data[4*((imgX+1) + (imgY)*OBJ.imageWidth)];
                                let rightG = OBJ.data[4*((imgX+1) + (imgY)*OBJ.imageWidth)+1];
                                let rightB = OBJ.data[4*((imgX+1) + (imgY)*OBJ.imageWidth)+2];
                                rightVal = (rightR + rightG + rightB)/3;
                            }
                            if(imgY>0) {
                                let topR = OBJ.data[4*((imgX) + (imgY-1)*OBJ.imageWidth)];
                                let topG = OBJ.data[4*((imgX) + (imgY-1)*OBJ.imageWidth)+1];
                                let topB = OBJ.data[4*((imgX) + (imgY-1)*OBJ.imageWidth)+2];
                                topVal = (topR + topG + topB)/3;
                            }
                            if(imgY < OBJ.imageHeight-1) {
                                let bottomR = OBJ.data[4*((imgX) + (imgY+1)*OBJ.imageWidth)];
                                let bottomG = OBJ.data[4*((imgX) + (imgY+1)*OBJ.imageWidth)+1];
                                let bottomB = OBJ.data[4*((imgX) + (imgY+1)*OBJ.imageWidth)+2];
                                bottomVal = (bottomR + bottomG + bottomB)/3;
                            }
                            let xGradient = leftVal==-1||rightVal==-1?0:leftVal - rightVal;
                            let yGradient = topVal==-1||bottomVal==-1?0:topVal - bottomVal;
                            OBJ.pixelData[imgY][imgX].mag = thisVal;
                            OBJ.pixelData[imgY][imgX].gradientX = xGradient;
                            OBJ.pixelData[imgY][imgX].gradientY = yGradient;
                        }
                    }
                    context.putImageData(OBJ.imageData, 0,0);
                    OBJ.detectBlobs();          //detects blobs on each layer
                    OBJ.processBlobs();
                    for(let layer=0; layer < OBJ.imageLayers.length; ++layer) {
                        let dataCopy = JSON.parse(JSON.stringify(OBJ.imageData.data));
                        let layerIndex = layer;
                        for(var imgY=0; imgY < OBJ.imageHeight; imgY+=1) {
                            for(var imgX=0; imgX < OBJ.imageWidth; imgX+=1) {
                                let mag = OBJ.imageLayers[layerIndex]["resultData"]["magGradient1"][imgX + (imgY*OBJ.imageWidth)];
                                let theta = OBJ.imageLayers[layerIndex]["resultData"]["thetaGradient1"][imgX + (imgY*OBJ.imageWidth)];
                                let R = (mag)*Math.cos(theta)     //57.2958*
                                let G = 0;
                                let B = (mag)*Math.sin(theta);
                                dataCopy[4*(imgX + imgY*OBJ.imageWidth)] = R;
                                dataCopy[4*(imgX + imgY*OBJ.imageWidth)+1] = G;
                                dataCopy[4*(imgX + imgY*OBJ.imageWidth)+2] = B;
                                if(layer==0) {
                                    OBJ.data[4*(imgX + imgY*OBJ.imageWidth)] = R;
                                    OBJ.data[4*(imgX + imgY*OBJ.imageWidth)+1] = G;
                                    OBJ.data[4*(imgX + imgY*OBJ.imageWidth)+2] = B;
                                }
                            }
                        }
                        if(layer==0) {
                            context.putImageData(OBJ.imageData, 0,0);
                            var cornerLocations = OBJ.imageLayers[OBJ.imageLayers.length-1]["resultData"]["cornerLocations"];
                            for(let c=0; c < cornerLocations.length; ++c) {
                                context.beginPath();
                                context.arc(cornerLocations[c].x, cornerLocations[c].y, 1, 0, 2 * Math.PI)
                                context.fillStyle = "white"
                                context.fill();
                            }
                        }
                        OBJ.imageLayers[layer]["resultData"]["imageData"] = dataCopy;
                        console.log(`****** Layer ${layer} of ${OBJ.imageLayers.length} completed ******`);
                    }
                    resolve(); 
                }
                img.src = reader.result;
            }, false);
            if (file) reader.readAsDataURL(file);    
            else reject("Problem with filtering image"); 
        });
    }
    gaussianBlurComponent(kernelLength=5,sig=1) {
        if(kernelLength%2!=1) {
            console.log("ERROR: kernelLength must be odd");
            return -1;
        }
        let kernelRadius=Math.floor(kernelLength/2);
        //https://aryamansharda.medium.com/image-filters-gaussian-blur-eb36db6781b1 says to scale sigma value in proportion to radius
        //set minimum standard deviation as a baseline
        //sig = Math.max((kernelRadius / 2), sig)      
        let kernel = new Array(kernelLength).fill(0).map(() => new Array(kernelLength).fill(0));
        let lowerExp = sig*sig*2;
        var sum = 0;
        for(let x=-kernelRadius; x <= kernelRadius; ++x) {
            for(let y=-kernelRadius; y <= kernelRadius; ++y) {
                let upperExp = (x*x) + (y*y);  
                let result = upperExp==0? 1/(Math.PI*lowerExp) : Math.exp(-upperExp/lowerExp)/(Math.PI*lowerExp);
                kernel[x+kernelRadius][y+kernelRadius] =result;
                sum += result;
            }
        }
        for(let x=0; x < kernelLength; ++x) {
            for(let y=0; y < kernelLength; ++y) kernel[x][y] /=sum;
        }
        var kernelObj = {kernel:kernel, kernelRadius:kernelRadius, sig:sig}
        return kernelObj;
    }
  
    simpleGrayscaleConvert(pixel, type="luminosity")  {
        if(type=="luminosity") {
            var value = pixel[0]*.27 + pixel[1]*.72 +  pixel[2]*.07;
            pixel[0] = value;
            pixel[1] = value;
            pixel[2] = value;
        }
        else if(type=="average") {
            var value = (pixel[0] + pixel[1] + pixel[2])/3;
            pixel[0] = value;
            pixel[1] = value;
            pixel[2] = value;
        }
        else if(type=="lightness") {
            var value = (Math.max(pixel[0], pixel[1], pixel[2]) + Math.min(pixel[0], pixel[1], pixel[2]))/2;
            pixel[0] = value;
            pixel[1] = value;
            pixel[2] = value;
        }
        return pixel;
    }
}


