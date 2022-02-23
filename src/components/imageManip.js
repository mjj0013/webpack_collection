import { ifStatement, isThisExpression, variableDeclaration } from 'babel-types';
import { Matrix,EigenvalueDecomposition, solve } from 'ml-matrix';
import {numberInRange, getRandomInt, objExistsInArray, getStdDev} from './utility.js';
import {Cluster} from './Cluster.js'
import { AST_PrefixedTemplateString } from 'terser';

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

        this.colorBlackWhiteTransferComponent = this.colorBlackWhiteTransferComponent.bind(this);
        this.colorGammaTransferComponent = this.colorGammaTransferComponent.bind(this);
        this.colorDiscreteTransferComponent = this.colorDiscreteTransferComponent.bind(this);
        this.simpleGrayscaleConvert = this.simpleGrayscaleConvert.bind(this);
       
        this.detectBlobs = this.detectBlobs.bind(this);
    
        this.saveLayerImageData = this.saveLayerImageData.bind(this);
        this.imageLayers = [];
        this.combinedGrid = []  //should eventually be where clusters of each image layer in 'imageLayers' are combined 
        
        this.selectedImage = null
    }


    async detectBlobs({gaussLength=15, baseSig=2, numLayers=2, sigExpMax=6, k=.04, eigenValEstimate=5000}={}) {      //5000
    // async detectBlobs(gaussLength=15, baseSig=2, numLayers=2, sigExpMax=6, k=.04, eigenValEstimate=5000) {      //5000
        //  k is sensitivity factor, default .04
        //  eigenValEstimate is the eigen-value used as a threshold for determining if eigen-values are large enough. If larger than it, they are accepted.
        //  http://vision.stanford.edu/teaching/cs231a_autumn1112/lecture/lecture11_detectors_descriptors_cs231a.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L12.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/calendar.html
        //  http://www.cs.toronto.edu/~jepson/csc420/notes/imageFeaturesIIIBinder.pdf
        //  https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
        //  https://www.youtube.com/watch?v=zItstOggP7M

        return new Promise((resolve,reject)=> {
            this.originalData = this.originalImageData.data;
            var data = this.imageData.data;     //should normally be this.originalImageData.data;
            gaussLength = 7       //was 7
            var componentLength = gaussLength;   //15 works good with space & rocket center, trying 7 for Red&Black checker board
            let sig0 = 1;
            var sigStack = []
            var sigDelta =sigExpMax/numLayers
            if(sigExpMax%numLayers!=0) {
                sigExpMax = sigExpMax+(numLayers - (sigExpMax%numLayers));
                sigDelta = sigExpMax/numLayers;
            }
            var sigStack = [sig0*Math.pow(baseSig,0)]
            // for(var s=sigExpMax;s>0;s-=sigDelta)    sigStack.push(sig0*Math.pow(baseSig,s));
            var layerStack = [];
            console.log('sigStack',sigStack)
            //make stack of layers, which each have different sigma values
            for(var s=0; s < sigStack.length; ++s) {
                var temp = this.gaussianBlurComponent(componentLength, sigStack[s]);
                var component = {kernel:temp.kernel, sig:sigStack[s], kernelRadius:temp.kernelRadius};
                layerStack.push({"component":component, "resultData": { "imageInfo":{"height":this.imageHeight, "width":this.imageWidth},"RGB":data.map((x)=>x), "imageData":null, "mags":[], "yGradient1":[], "xGradient1":[],
                 "magGradient":[], "thetaGradient":[], "harrisResponse":[], "slopeRateX1":[], "slopeRateY1":[], "cornerLocations":[], "laplacian":[], "eigenVals":[], "eigenVectors":[], "curvePaths":[], "maxMagGradient":0,"eigenVectorTheta":[],
                "pixelVisited":[], "gaussCurvature":[]        //each pixel will have list of 8 for the links bewteen 8 neighbors
                }});
            }
            var kernelRadius = Math.floor(componentLength/2);     //should be the same on each kernel in the parallelComponent stack
            for(var c=0; c < layerStack.length; ++c) {
                var parallelComponent = layerStack[c];
                for(var imgY=0; imgY < this.imageHeight; imgY+=1) { 
                    for(var imgX=0; imgX < this.imageWidth; imgX+=1) {
                        let R=0, G=0, B=0;
                        if((imgY >=kernelRadius) && (imgX >=kernelRadius)) {
                            for(var kY=-kernelRadius; kY <= kernelRadius; ++kY) {
                                for(var kX=-kernelRadius; kX <= kernelRadius; ++kX) { 
                                    let value = parallelComponent["component"].kernel[kY+kernelRadius][kX+kernelRadius];
                                    R += data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)]*value;
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
            
            var windowR = 5; //3 worked good        //5
            // var tempKernel = this.gaussianBlurComponent(2*windowR-1, 1);
            // var gaussKernel = tempKernel.kernel;
            // gaussKernel = new Matrix(gaussKernel)
            
            // var LaplacianKernel = [[0,-1,0], [-1,4,-1], [0,-1,0]];
            var LaplacianKernel = [[1,1,1], [1,-8,1], [1,1,1]];
            var SobelKernelX = [[1,0,-1], [2,0,-2], [1,0,-1]]
            var SobelKernelY = [[1,2,1], [0,0,0], [-1,-2,-1]]
            //gaussKernel is multipled to every product of sum (Ixx, Ixy, Iyy)
            // https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
            // https://mathinsight.org/directional_derivative_gradient_introduction

            for(var c=0; c < layerStack.length; ++c) {
                var parallelComponent = layerStack[c];
                console.log(`Starting Layer #${c} of ${layerStack.length}`)
                for(var imgY=0; imgY < this.imageHeight; imgY+=1) {      
                    for(var imgX=0; imgX < this.imageWidth; imgX+=1) {   
                        var sobelX1 = 0, sobelY1=0, laplacian=0;
                        if(!(imgX==0 || imgX==this.imageWidth-1 || imgY==0 || imgY==this.imageHeight-1)) {
                            for(var ky=-1; ky<= 1; ++ky) {
                                for(var kx=-1; kx<= 1; ++kx) {
                                    let mag = parallelComponent["resultData"]["mags"][((imgX-kx) + (imgY-ky)*this.imageWidth)]
                                    //1st order gradient (Sobel)
                                    sobelX1 += mag*SobelKernelX[ky+1][kx+1];   
                                    sobelY1 += mag*SobelKernelY[ky+1][kx+1];

                                    //2nd order gradient (Laplacian)
                                    laplacian += mag*LaplacianKernel[ky+1][kx+1];
                                }
                            }
                        }
                        parallelComponent["resultData"]["xGradient1"].push(sobelX1)
                        parallelComponent["resultData"]["yGradient1"].push(sobelY1)
                        parallelComponent["resultData"]["laplacian"].push(laplacian)

                        let magGrad = Math.sqrt((sobelY1*sobelY1) + (sobelX1*sobelX1))
                        let theta = sobelY1==0||sobelX1==0? 0:Math.atan((sobelY1)/(sobelX1));
                        let slopeRate1 = {x:magGrad*Math.cos(theta), y:magGrad*Math.sin(theta)}
                        if(magGrad > parallelComponent["resultData"]["maxMagGradient"]) parallelComponent["resultData"]["maxMagGradient"] = magGrad;
                        parallelComponent["resultData"]["magGradient"].push(magGrad);
                        parallelComponent["resultData"]["thetaGradient"].push(theta); 
                        parallelComponent["resultData"]["slopeRateX1"].push(slopeRate1.x)       //measure of horizontal-ness
                        parallelComponent["resultData"]["slopeRateY1"].push(slopeRate1.y)       //measure of vertical-ness
                    }
                }
                
            }
            for(var c=0; c < layerStack.length; ++c) {
                var parallelComponent = layerStack[c];
                // Harris corner detector
                for(var imgY=0; imgY < this.imageHeight; imgY+=1) {      
                    for(var imgX=0; imgX < this.imageWidth; imgX+=1) {   
                        var Ixx = [], Iyy = [], Ixy = [];
                        var isLocalPeak = true;
                        var centerLaplace = parallelComponent["resultData"]["laplacian"][((imgX) + (imgY)*this.imageWidth)]
                        if(imgY <= windowR || imgY>=this.imageHeight-windowR || imgX <= windowR || imgX>=this.imageWidth-windowR) {
                            Ixx = Matrix.zeros(windowR*2, windowR*2)
                            Iyy = Matrix.zeros(windowR*2, windowR*2)
                            Ixy = Matrix.zeros(windowR*2, windowR*2)
                        }
                        else {
                            for(var kY=-windowR; kY <= windowR; ++kY) {  
                                var xRow = [], yRow = [], xyRow = [];
                                for(var kX=-windowR; kX <= windowR; ++kX) {   
                                    if(parallelComponent["resultData"]["laplacian"][((imgX-kX) + (imgY-kY)*this.imageWidth)] > centerLaplace) {
                                        isLocalPeak = false;
                                    }
                                    let xComp = parallelComponent["resultData"]["xGradient1"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                                    let yComp = parallelComponent["resultData"]["yGradient1"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                                    xRow.push(xComp*xComp)
                                    xyRow.push(xComp*yComp)
                                    yRow.push(yComp*yComp)
                                }
                                // if(!isLocalPeak) break;
                                Ixx.push(xRow);
                                Ixy.push(xyRow);
                                Iyy.push(yRow);
                            }
                            Ixx = new Matrix(Ixx);
                            Ixy = new Matrix(Ixy);
                            Iyy = new Matrix(Iyy);
                        }
                        //this gives more weight to the pixels closer to the center pixel
                        // Ixx = Ixx.mmul(gaussKernel);
                        // Ixy = Ixy.mmul(gaussKernel);
                        // Iyy = Iyy.mmul(gaussKernel);

                        var IxxSum = Ixx.sum();
                        var IxySum = Ixy.sum();
                        var IyySum = Iyy.sum();
                        var M = new Matrix([[IxxSum, IxySum], [IxySum, IyySum]]);
                        var det = (IxxSum*IyySum) - (IxySum*IxySum);
                        var trace = IxxSum + IyySum;
                        var eigs = new EigenvalueDecomposition(M);
                        var eigVectors = eigs.eigenvectorMatrix;
                        eigVectors = [[eigVectors.get(0,0), eigVectors.get(0,1)],[eigVectors.get(1,0), eigVectors.get(1,1)]];

                        //NOTE: Eigenvectors are axes/vectors that remain the same during a linear transformation.
                        // a 3D example: for a 3D rotation, the axis of rotation would be the eigenvector.
                        
                        var R = det - k*(trace*trace);      //measure of corner response
                        parallelComponent["resultData"]["harrisResponse"].push(R);
                        parallelComponent["resultData"]["eigenVals"].push(eigs);
                        parallelComponent["resultData"]["eigenVectors"].push(eigVectors);
                        parallelComponent["resultData"]["eigenVectorTheta"].push(Math.atan(eigVectors[1][0]/eigVectors[0][0]))
                        parallelComponent["resultData"]["gaussCurvature"].push(eigs.realEigenvalues[0]*eigs.realEigenvalues[1]);
                          
                        // parallelComponent["resultData"]["neighborLinkWeights"].push([1,1,1,1,1,1,1,1])
                        parallelComponent["resultData"]["pixelVisited"].push('none');

                        if(!isLocalPeak) continue;
                        if(R>0) {
                            var real = eigs.realEigenvalues;
                            if(real[0] > eigenValEstimate && real[1] > eigenValEstimate)  {
                                var pixelIdx = ((imgX) + (imgY)*this.imageWidth);
                                var thetaGradient = parallelComponent["resultData"]["thetaGradient"][pixelIdx]
                                var slopeRateX1 = parallelComponent["resultData"]["slopeRateX1"][pixelIdx]
                                var slopeRateY1 = parallelComponent["resultData"]["slopeRateY1"][pixelIdx]
                                parallelComponent["resultData"]["cornerLocations"].push({eigenVectors:eigVectors,eigenVals:eigs, x:imgX, y:imgY,thetaGradient:thetaGradient, slope:slopeRateY1/slopeRateX1, pixelIdx:pixelIdx, magGradient: parallelComponent["resultData"]["magGradient"][pixelIdx]});
                            }
                        }
                    }
                    console.log(`Completed iter ${(imgX + imgY*this.imageWidth)} of ${this.imageHeight*this.imageWidth}`);
                }

                // Also, try "Smart Scissors" project in https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
           
                var cornerLocations = parallelComponent["resultData"]["cornerLocations"];
                parallelComponent["resultData"]["cornerClusters"] = new Cluster(cornerLocations);
                
            }
            this.imageLayers = layerStack;
            resolve();
        })
    }

    colorDiscreteTransferComponent(inColor, ranges, isAlpha=false) {
        var colorPercentage = !isAlpha? inColor/255 :inColor;
        var closestColor = inColor;
        if(colorPercentage >= 0 && colorPercentage <=.25) closestColor = ranges[0]
        else if(colorPercentage > .25 && colorPercentage <=.5) closestColor = ranges[1]
        else if(colorPercentage > .5 && colorPercentage <=.75) closestColor = ranges[2]
        else if(colorPercentage > .75) closestColor = ranges[3]
        if(!isAlpha) return closestColor*255;
        else return closestColor;
    }
    colorBlackWhiteTransferComponent(inRGBA) {
        let m = [ [0.3333,  0.3333,  0.3333,  0, 0], [0.3333, 0.3333, 0.3333, 0, 0], [0.3333, 0.3333, 0.3333, 0, 0], [0, 0, 0, 1, 0]]
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
        //from https://www.youtube.com/watch?v=-AR-6X_98rM&ab_channel=KyleRobinsonYoung
        //filterInfo will be a list of component-objects of form-> {type:"gauss", kernelLength:5, sig:1};    components will be applied in order
        return new Promise((resolve,reject)=> {
            var canvas = document.getElementById(this.canvasId);
            var context = canvas.getContext("2d");
            // var input = addr==null? document.querySelector('input[type="file"]'): addr
            // const preview = document.querySelector('img');

            const file = document.querySelector('input[type=file]').files[0];
            const reader = new FileReader();
            this.selectedImage = file;
            var OBJ = this;
            reader.addEventListener("load", function () {
                const img = new Image();
                
                img.onload = function() {
                    var dummyCanvas = document.createElement("canvas");     //isn't a visible canvas, holds data for the entire image.
                    dummyCanvas.id = "dummyCanvas";
                    dummyCanvas.width = img.naturalWidth;
                    dummyCanvas.height= img.naturalHeight;
                    var dummyContext = dummyCanvas.getContext('2d')

                    dummyContext.drawImage(img,0,0);
                    OBJ.originalImageData = dummyContext.getImageData(0,0,dummyCanvas.width,dummyCanvas.height);
                    OBJ.imageData = dummyContext.getImageData(0,0,dummyCanvas.width,dummyCanvas.height);
                    OBJ.data = OBJ.imageData.data;
                    OBJ.imageWidth = OBJ.imageData.width;
                    OBJ.imageHeight= OBJ.imageData.height;
                    OBJ.pixelData = Array(OBJ.imageHeight).fill(Array(OBJ.imageWidth).fill({gradientX:0, gradientY:0, mag:0}))
                    context.drawImage(img,0,0);
                    OBJ.filterInfo.forEach(component => {
                        let componentLength = component.kernelLength ? component.kernelLength : 2;
                        let filterSig = component.sig ? component.sig : 5;
                        if(component.type == "gaussBlur") {
                            var temp = OBJ.gaussianBlurComponent(componentLength, filterSig);
                            component.kernel = temp.kernel;
                            component.sig = temp.sig;
                            component.kernelRadius = temp.kernelRadius;
                        }
                        if(["gammaTransfer","discreteTransfer","blackWhiteTransfer","grayScale"].includes(component.type))     { component.kernelRadius = 0; }
                        
                        var kernelRadius = component.kernelRadius;
                        for(var imgY=kernelRadius; imgY < OBJ.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                            for(var imgX=kernelRadius; imgX < OBJ.imageWidth; imgX+=1) {       //increment by 4 because its RGBA values
                                var pixelIdx = 4*(imgY*OBJ.imageWidth + imgX);
                                if(component.type=="grayScale") {
                                    var pixel = OBJ.data.slice(pixelIdx,  pixelIdx + 4)     //array of 4 values (R,G,B,A) for 1 pixel
                                    var newRGBA = OBJ.simpleGrayscaleConvert(pixel,component.subType);
                                    OBJ.data[pixelIdx] = newRGBA[0];
                                    OBJ.data[pixelIdx + 1] = newRGBA[1]
                                    OBJ.data[pixelIdx + 2] = newRGBA[2]
                                    OBJ.data[pixelIdx + 3] = newRGBA[3]
                                }
                                else if(component.type=="blackWhiteTransfer") {
                                    let [R,G,B,A] = OBJ.data.slice(pixelIdx,pixelIdx+4)
                                    var newRGBA = OBJ.colorBlackWhiteTransferComponent([R,G,B,A]);
                                    OBJ.data[pixelIdx] = newRGBA[0];
                                    OBJ.data[pixelIdx + 1] = newRGBA[1]
                                    OBJ.data[pixelIdx + 2] = newRGBA[2]
                                    OBJ.data[pixelIdx + 3] = newRGBA[3]
                                }
                                else if(component.type=="gammaTransfer") {
                                    let [R,G,B,A] = OBJ.data.slice(pixelIdx,pixelIdx+4)
                                    
                                    OBJ.data[pixelIdx] = component.applyTo.includes("R")?     OBJ.colorGammaTransferComponent(R, component.amplitude, component.exponent, component.offset):R;
                                    OBJ.data[pixelIdx + 1] = component.applyTo.includes("G")? OBJ.colorGammaTransferComponent(G, component.amplitude, component.exponent, component.offset):G;
                                    OBJ.data[pixelIdx + 2] = component.applyTo.includes("B")? OBJ.colorGammaTransferComponent(B, component.amplitude, component.exponent, component.offset):B;
                                    OBJ.data[pixelIdx + 3] = component.applyTo.includes("A")? OBJ.colorGammaTransferComponent(A, component.amplitude, component.exponent, component.offset):A;
                                }
                                else if(component.type=="discreteTransfer") {
                                    let [R,G,B,A] = OBJ.data.slice(pixelIdx,pixelIdx+4)
                                    OBJ.data[pixelIdx] = component.applyTo.includes("R")? OBJ.colorDiscreteTransferComponent(R, component.tableValues):R;
                                    OBJ.data[pixelIdx + 1] = component.applyTo.includes("G")? OBJ.colorDiscreteTransferComponent(G, component.tableValues):G;
                                    OBJ.data[pixelIdx + 2] = component.applyTo.includes("B")? OBJ.colorDiscreteTransferComponent(B, component.tableValues):B;
                                    OBJ.data[pixelIdx + 3] = component.applyTo.includes("A")? OBJ.colorDiscreteTransferComponent(A, component.tableValues):A;
                                }
                                else if(component.type=="gaussBlur" || component.type=="edgeDetect") {
                                    let R = 0,G = 0,B = 0, A=0;
                                    for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                                        for(var kX=-kernelRadius; kX < kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                                            let value = component.kernel[kY+kernelRadius][kX+kernelRadius];
                                            R += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)]*value;
                                            G += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)+1]*value;
                                            B += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)+2]*value;
                                            A += OBJ.data[4*((imgX-kX) + (imgY-kY)*OBJ.imageWidth)+3]*value;
                                        }
                                    }
                                    OBJ.data[pixelIdx] = R;
                                    OBJ.data[pixelIdx + 1] = G;
                                    OBJ.data[pixelIdx + 2] = B;
                                    OBJ.data[pixelIdx + 3] = A;
                                }
                            }
                        }
                    })
                    dummyContext.putImageData(OBJ.imageData, 0,0)
                    resolve();
                }
             
                img.src = reader.result;
            }, false);
            if (file) reader.readAsDataURL(file);    
            else reject("Problem with filtering image"); 
        });
    }
    async saveLayerImageData(context) {
        return new Promise((resolve,reject)=> {
            for(var layer=0; layer < this.imageLayers.length; ++layer) {
                let dataCopy = JSON.parse(JSON.stringify(this.imageData.data));
                let layerIndex = layer;
                for(var imgY=0; imgY < this.imageHeight; imgY+=1) {
                    for(var imgX=0; imgX < this.imageWidth; imgX+=1) {
                        let mag = this.imageLayers[layerIndex]["resultData"]["magGradient"][imgX + (imgY*this.imageWidth)];
                        let theta = this.imageLayers[layerIndex]["resultData"]["thetaGradient"][imgX + (imgY*this.imageWidth)];
                        let R = (mag)*Math.cos(theta),  G = 0,  B = (mag)*Math.sin(theta);
                        dataCopy[4*(imgX + imgY*this.imageWidth)] = R;
                        dataCopy[4*(imgX + imgY*this.imageWidth)+1] = G;
                        dataCopy[4*(imgX + imgY*this.imageWidth)+2] = B;
                        if(layer==0) {
                            this.data[4*(imgX + imgY*this.imageWidth)] = R;
                            this.data[4*(imgX + imgY*this.imageWidth)+1] = G;
                            this.data[4*(imgX + imgY*this.imageWidth)+2] = B;
                        }
                    }
                }
                if(layer==0) {
                    context.putImageData(this.imageData, 0,0);
                    var cornerClusters = this.imageLayers[this.imageLayers.length-1]["resultData"]["cornerClusters"].subClusters;
                    for(var cluster=0; cluster < cornerClusters.length; ++cluster) {
                        var color = `rgb(${getRandomInt(0,255)},${getRandomInt(0,255)},${getRandomInt(0,255)} )`
                        for(var pt=0; pt < cornerClusters[cluster].length; ++pt) {
                            context.beginPath();
                            context.arc(cornerClusters[cluster][pt].x, cornerClusters[cluster][pt].y, 1, 0, 2 * Math.PI)
                            context.fillStyle = color
                            context.fill();
                        }
                    }
                }
                this.imageLayers[layer]["resultData"]["imageData"] = dataCopy;
                console.log(`****** Layer ${layer} of ${this.imageLayers.length} completed ******`);
            }
            resolve();
        });
    }

    gaussianBlurComponent(kernelLength=5,sig=1) {
        //https://aryamansharda.medium.com/image-filters-gaussian-blur-eb36db6781b1 
        if(kernelLength%2!=1) { console.log("ERROR: kernelLength must be odd");  return -1;  }
        let kernelRadius=Math.floor(kernelLength/2);
        sig = Math.max((kernelRadius / 2), sig)      //set minimum standard deviation as a baseline; link above says to scale sigma value in proportion to radius
        let kernel = new Array(kernelLength).fill(0).map(() => new Array(kernelLength).fill(0));
        let lowerExp = sig*sig*2;
        var sum = 0;
        for(var x=-kernelRadius; x <= kernelRadius; ++x) {
            for(var y=-kernelRadius; y <= kernelRadius; ++y) {
                let upperExp = (x*x) + (y*y);  
                let result = upperExp==0? 1/(Math.PI*lowerExp) : Math.exp(-upperExp/lowerExp)/(Math.PI*lowerExp);
                kernel[x+kernelRadius][y+kernelRadius] =result;
                sum += result;
            }
        }
        for(var x=0; x < kernelLength; ++x) {
            for(var y=0; y < kernelLength; ++y) { kernel[x][y] /=sum; }
        }
        return {kernel:kernel, kernelRadius:kernelRadius, sig:sig};
    }
  
    simpleGrayscaleConvert(pixel)  {
        var value = (pixel[0] + pixel[1] + pixel[2])/3;
        pixel = pixel.slice(0,3).fill(value).concat(pixel.slice(3));
        return pixel;
    }
}