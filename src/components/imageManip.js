import { Matrix, solve } from 'ml-matrix';

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
        this.leastMeanSquaresEstim = this.leastMeanSquaresEstim.bind(this);
        this.morphErosion = this.morphErosion.bind(this);  //represents a cluster of white pixels as a single pixel (if all pixels in the frame are white, they're all white except for the middle )
        this.diffOfGauss = this.diffOfGauss.bind(this);
        
        this.detectCorners = this.detectCorners.bind(this);
        this.approximateEdgeBounds = this.approximateEdgeBounds.bind(this);
        this.colorBlackWhiteTransferComponent = this.colorBlackWhiteTransferComponent.bind(this);
        this.colorGammaTransferComponent = this.colorGammaTransferComponent.bind(this);
        this.colorDiscreteTransferComponent = this.colorDiscreteTransferComponent.bind(this);
        this.simpleGrayscaleConvert = this.simpleGrayscaleConvert.bind(this);

        this.getTranpose = this.getTranpose.bind(this);
        this.getImagePartition = this.getImagePartition.bind(this);
        this.edgeDetectComponent = this.edgeDetectComponent.bind(this);
        this.detectBlobs = this.detectBlobs.bind(this);
        this.imageLayers = [];
        this.selectedImage = null
    }

    detectBlobs() {
        //  https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/calendar.html
        //  http://www.cs.toronto.edu/~jepson/csc420/notes/imageFeaturesIIIBinder.pdf
        //  https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
        //  https://www.youtube.com/watch?v=zItstOggP7M
        this.originalData = this.originalImageData.data;
        var componentLength = 7;
        let sigMultiplier=10;
        let sig0 = 10;
        var sigStack = []
        for(let s=0;s<3;++s)    sigStack.push(sig0*Math.pow(sigMultiplier,s));
        
        
        var layerStack = [];
        for(let s=0; s < sigStack.length; ++s) {
            var temp = this.gaussianBlurComponent(componentLength, sigStack[s]);
            var component = {kernel:temp.kernel, sig:sigStack[s], kernelRadius:temp.kernelRadius};
            layerStack.push({"component":component, "resultData":{"RGB":this.originalData.map((x)=>x),
            "mags":[],"yGradient1":[], "xGradient1":[],"magGradient1":[],"thetaGradient1":[], 
            "yGradient2":[], "xGradient2":[],"magGradient2":[],"thetaGradient2":[], "nLoG":[]}});
        }
        
        var kernelRadius = Math.floor(componentLength/2);     //should be the same on each kernel in the parallelComponent stack
        for(let c=0; c < layerStack.length; ++c) {
            var parallelComponent = layerStack[c];
            // parallelComponent["resultData"]["mags"]
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {       //increment by 4 because its RGBA values
                
                    let R = 0,G = 0,B = 0;
                    if((imgY >=kernelRadius) && (imgX >=kernelRadius)) {
                        for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                            for(var kX=-kernelRadius; kX < kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                                let value = parallelComponent["component"].kernel[kY+kernelRadius][kX+kernelRadius];
                                
                                R += this.originalData[4*((imgX-kX) + (imgY-kY)*this.imageWidth)]*value;
                                G += this.originalData[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+1]*value;
                                B += this.originalData[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+2]*value; 
                            }   
                        }
                    }
                    else {
                        R = this.originalData[4*(imgX + imgY*this.imageWidth)];
                        G = this.originalData[4*(imgX + imgY*this.imageWidth) + 1]
                        B = this.originalData[4*(imgX + imgY*this.imageWidth) + 2]
                    }
                    
                    parallelComponent["resultData"]["RGB"][4*(imgX + imgY*this.imageWidth)] = R;
                    parallelComponent["resultData"]["RGB"][4*(imgX + imgY*this.imageWidth) + 1] = G;
                    parallelComponent["resultData"]["RGB"][4*(imgX + imgY*this.imageWidth) + 2] = B;
                    parallelComponent["resultData"]["mags"].push((R+G+B)/3);
                }
            }
        }

        // get derivative of x-y gradients, add them together, multiply that by sigma^2,    <=== nLoG (Normalized Laplacian of Gauss)
        console.log("calculating 1st and 2nd gradients...")
        for(let c=0; c < layerStack.length; ++c) {
            var parallelComponent = layerStack[c];
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {       //increment by 4 because its RGBA xValues
                    let left = parallelComponent["resultData"]["mags"][(imgX-1) + (imgY)*this.imageWidth]
                    let right = parallelComponent["resultData"]["mags"][(imgX+1) + (imgY)*this.imageWidth]
                    let top = parallelComponent["resultData"]["mags"][(imgX) + (imgY-1)*this.imageWidth]
                    let bottom = parallelComponent["resultData"]["mags"][(imgX) + (imgY+1)*this.imageWidth]
                    if(imgX==0 || imgX==this.imageWidth-1) {
                        left = 0;
                        right = 0;
                    }
                    if(imgY==0 || imgY==this.imageHeight-1) {
                        top = 0;
                        bottom = 0;
                    }
                    parallelComponent["resultData"]["xGradient1"].push((left-right));
                    parallelComponent["resultData"]["yGradient1"].push((top-bottom));
                    let magGrad = Math.sqrt((top-bottom)*(top-bottom) + (left-right)*(left-right))
                    parallelComponent["resultData"]["magGradient1"].push(magGrad);
                    parallelComponent["resultData"]["thetaGradient1"].push(Math.atan((top-bottom)/(left-right)));   
                }
            }
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {       //increment by 4 because its RGBA xValues
                    
                    let left = parallelComponent["resultData"]["xGradient1"][(imgX-1) + (imgY)*this.imageWidth]
                    let right = parallelComponent["resultData"]["xGradient1"][(imgX+1) + (imgY)*this.imageWidth]
                    let top = parallelComponent["resultData"]["yGradient1"][(imgX) + (imgY-1)*this.imageWidth]
                    let bottom = parallelComponent["resultData"]["yGradient1"][(imgX) + (imgY+1)*this.imageWidth]
                    if(imgX==0 || imgX==this.imageWidth-1) {
                        left = 0;
                        right = 0;
                    }
                    if(imgY==0 || imgY==this.imageHeight-1) {
                        top = 0;
                        bottom = 0;
                    }
                    parallelComponent["resultData"]["xGradient2"].push((left-right));
                    parallelComponent["resultData"]["yGradient2"].push((top-bottom));
                    let magGrad = Math.sqrt((top-bottom)*(top-bottom) + (left-right)*(left-right))
                    parallelComponent["resultData"]["magGradient2"].push(magGrad);
                    parallelComponent["resultData"]["thetaGradient2"].push(Math.atan((top-bottom)/(left-right)));
                    
                    // nLoG is ???
                    //parallelComponent["resultData"]["nLoG"].push(parallelComponent["component"].sig*parallelComponent["component"].sig*((left-right)+(top-bottom)))
                }
            }
            
        }
        
       
        console.log("layerStack", layerStack)
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
        let m = [
            [0.333,  0.333,  0.333,  0, 0],
            [0.3333, 0.3333, 0.3333, 0, 0],
            [0.3333, 0.3333, 0.3333, 0, 0],
            [0,      0,      0,      1, 0]
        ]

        var newR = inRGBA[0]*m[0][0] + inRGBA[1]*m[1][0]+ inRGBA[2]*m[2][0]+ inRGBA[3]*m[3][0]   + m[0][4];
        var newG = inRGBA[0]*m[0][1] + inRGBA[1]*m[1][1]+ inRGBA[2]*m[2][1]+ inRGBA[3]*m[3][1]   + m[1][4];
        var newB = inRGBA[0]*m[0][2] + inRGBA[1]*m[1][2]+ inRGBA[2]*m[2][2]+ inRGBA[3]*m[3][2]   + m[2][4];
        var newA = inRGBA[0]*m[0][3] + inRGBA[1]*m[1][3]+ inRGBA[2]*m[2][3]+ inRGBA[3]*m[3][3]   + m[3][4];

        return [newR, newG, newB, newA];

    }
    colorGammaTransferComponent(inColor, amplitude, exponent, offset, isAlpha=false) {
        return amplitude*Math.pow(inColor,exponent) + offset;
    }
    imageReader(addr=null) {
        console.log("filterinfO", this.filterInfo);
        var canvas = document.getElementById(this.canvasId)
        var context = canvas.getContext("2d");
        //from https://www.youtube.com/watch?v=-AR-6X_98rM&ab_channel=KyleRobinsonYoung
    
        // [{type:"gaussBlur", kernelLength:5, sig:1}]
        
        //filterInfo will be a list of component-objects of form-> {type:"gauss", kernelLength:5, sig:1}
        //components will be applied in order
    
        var input = addr;
        if(addr==null) {
            input = document.querySelector('input[type="file"]');
            console.log("input",input);
        }
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
                //var pixelData = Array(data.length).fill({gradientX:0,gradientY:0});
                
                OBJ.filterInfo.forEach(component => {
                    let componentLength = component.kernelLength ? component.kernelLength : 2;
                    let filterSig = component.sig ? component.sig : 5;
                    if(component.type == "gaussBlur") {
                        var temp = OBJ.gaussianBlurComponent(componentLength, filterSig);

                        component.kernel = temp.kernel;
                        component.sig = temp.sig;
                        component.kernelRadius = temp.kernelRadius;
                    }
                    if(component.type == "edgeDetect") {
                        
                        var temp = OBJ.edgeDetectComponent(componentLength, component.middleValue,component.fillValue, component.cornerValue);
                        component.kernel = temp.kernel;
                        component.kernelRadius = temp.kernelRadius;
                    }
                    if(["gammaTransfer", "discreteTransfer", "blackWhiteTransfer", "grayScale"].includes(component.type)) {
                        component.kernelRadius = 0;
                    }
                    
                
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
                            // let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];
                            else if(component.type=="gammaTransfer") {
                                let R = OBJ.data[4*(imgY*OBJ.imageWidth + imgX)];
                                let G = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +1];
                                let B = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +2];
                                let A = OBJ.data[4*(imgY*OBJ.imageWidth + imgX) +3];
                                
                                if(component.applyTo.includes("R")) {
                                    R = OBJ.colorGammaTransferComponent(R, component.amplitude, component.exponent, component.offset);
                                }
                                if(component.applyTo.includes("G")) {
                                    G = OBJ.colorGammaTransferComponent(G, component.amplitude, component.exponent, component.offset);
                                }
                                if(component.applyTo.includes("B")) {
                                    B = OBJ.colorGammaTransferComponent(B, component.amplitude, component.exponent, component.offset);
                                }
                                if(component.applyTo.includes("A")) {
                                    A = OBJ.colorGammaTransferComponent(A, component.amplitude, component.exponent, component.offset, true);
                                }
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
                                
                                if(component.applyTo.includes("R")) {
                                    R = OBJ.colorDiscreteTransferComponent(R, component.tableValues);
                                }
                                if(component.applyTo.includes("G")) {
                                    G = OBJ.colorDiscreteTransferComponent(G,component.tableValues);
                                }
                                if(component.applyTo.includes("B")) {
                                    B = OBJ.colorDiscreteTransferComponent(B, component.tableValues);
                                }
                                if(component.applyTo.includes("A")) {
                                    A = OBJ.colorDiscreteTransferComponent(A, component.tableValues, true);
                                }
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
                //imageData = this.morphErosion(imageData);
                
                // OBJ.detectCorners(canvas);
                //context.putImageData(OBJ.imageData, 0,0);
                OBJ.detectBlobs();
                console.log("inserting layer0 imageData")
                for(var imgY=0; imgY < OBJ.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                    for(var imgX=0; imgX < OBJ.imageWidth; imgX+=1) {       //increment by 4 because its RGBA xValues
                        let mag = OBJ.imageLayers[OBJ.imageLayers.length-1]["resultData"]["magGradient1"][imgX + (imgY*OBJ.imageWidth)];
                        let theta = OBJ.imageLayers[OBJ.imageLayers.length-1]["resultData"]["thetaGradient1"][imgX + (imgY*OBJ.imageWidth)];
                        let R = mag*Math.cos(theta)     //57.2958*
                        let G = 0
                        let B = mag*Math.sin(theta);
                        // let R = mag
                        // let G = mag
                        // let B = 0;
                        OBJ.data[4*(imgX + imgY*OBJ.imageWidth)] = R;
                        OBJ.data[4*(imgX + imgY*OBJ.imageWidth)+1] = G;
                        OBJ.data[4*(imgX + imgY*OBJ.imageWidth)+2] = B;
                        
                    }
                    
                }
                console.log("done inserting");
                context.putImageData(OBJ.imageData, 0,0);
                return new Promise((resolve,reject)=> { resolve("asdfadsf"); });
            }
            img.src = reader.result;
          }, false);
        
        if (file) reader.readAsDataURL(file);    
        else {
            return new Promise((resolve,reject)=> {
                console.log("Problem with filtering image");
                reject(); 
            });
        }
    }
    detectCorners() {
        //console.log(" this.pixelData", this.pixelData)
        var canvas = document.getElementById(this.canvasId)
        var context = canvas.getContext("2d");
        var imageData = context.getImageData(0,0,canvas.width,canvas.height);
        var data =imageData.data;
        var kernelRadius = 25;
        var uniqueLambdas = [];

        //   https://mccormickml.com/2013/05/07/gradient-vectors/
        //   https://www.youtube.com/watch?v=Z_HwkG90Yvw&ab_channel=1PrinciplesofComputerVision
    

        console.log("pixelData",this.pixelData);
        var detectedCorners = [];
        var lambdaJudgement = 100;       //this variable is supposed to determine what defines a small or large lambda
        
    
        var xAccelerator = 1;
        var yAccelerator = 1;
        var imgY = kernelRadius;
        var imgX = kernelRadius;
    
        //try doing a path finding algorithm, where if pixel is a part of an edge, it follows the slope of the edge.
        //map the regions in the image where no edges occur, skip these regions
    
    
        while(imgY < this.imageHeight-kernelRadius) {
            console.log(`Iteration ${imgY} out of ${this.imageHeight-kernelRadius}`)
            imgX=kernelRadius;
            while(imgX < this.imageWidth-kernelRadius) {
                //2nd moments a,b,c
                let a = 0, b=0, c=0;
               
                var isBlankSpace = true;
                for(let kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                    for(let kX=-kernelRadius; kX < kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                        if(this.pixelData[imgY-kY][imgX-kX].mag > 100) isBlankSpace=false;
                        a+=this.pixelData[imgY-kY][imgX-kX].gradientX*this.pixelData[imgY-kY][imgX-kX].gradientX      //x^2
                        b+=this.pixelData[imgY-kY][imgX-kX].gradientX*this.pixelData[imgY-kY][imgX-kX].gradientY      //x*y
                        c+=this.pixelData[imgY-kY][imgX-kX].gradientY*this.pixelData[imgY-kY][imgX-kX].gradientY      //y^2
                      
                        // a+=this.pixelData[this.imageWidthByPixel*(imgY-kY)+(imgX-kX)].gradientX*this.pixelData[this.imageWidthByPixel*(imgY-kY)+ (imgX-kX)].gradientX      //x^2
                        // b+=this.pixelData[this.imageWidthByPixel*(imgY-kY)+(imgX-kX)].gradientX*this.pixelData[this.imageWidthByPixel*(imgY-kY)+ (imgX-kX)].gradientY      //x*y
                        // c+=this.pixelData[this.imageWidthByPixel*(imgY-kY)+(imgX-kX)].gradientY*this.pixelData[this.imageWidthByPixel*(imgY-kY)+ (imgX-kX)].gradientY      //y^2
                        
                    }
                }
                // if(isBlankSpace) { imgX+=kernelRadius; continue;}
                // else console.log("not blank")
                b *=2;
                 //computing ellipse axes lengths: lambda1, lambda2
                let temp = Math.sqrt((b*b) + (a-c)*(a-c));
                let lambda1 = (1/2)*(a+c+temp);        //Emax
                let lambda2= (1/2)*(a+c-temp);         //Emin
    
                this.pixelData[imgY][imgX].lambda1 = lambda1;
                this.pixelData[imgY][imgX].lambda2 = lambda2;
                this.pixelData[imgY][imgX].cornerResponse = lambda1*lambda2;
    
                if(!uniqueLambdas.includes(lambda1)) uniqueLambdas.push(lambda1);
                if(lambda1!=lambda2 && !uniqueLambdas.includes(lambda2)) uniqueLambdas.push(lambda2);
                
                //if both are small relative to lambdaJudgement
                if(lambda1 < lambdaJudgement && lambda2 < lambdaJudgement) {
                    //flat region
                    xAccelerator = 1;
                    yAccelerator = 1;
                }
                else if(lambda1 > lambdaJudgement && lambda2 < lambdaJudgement) {
                    //edge region
                    xAccelerator = 1;
                    yAccelerator = 1;
                }
                else if(lambda1 > lambdaJudgement && lambda2 > lambdaJudgement) {
                    //corner region
                    xAccelerator = 1;
                    yAccelerator = 1;
                    detectedCorners.push({x:imgX, y:imgY});
                   
                }
                imgX+=xAccelerator;
            }
            imgY+=yAccelerator;
        }

        console.log("uniqueLambdas", uniqueLambdas)
        console.log("detectedCorners",detectedCorners);
    
        for(let corner=0; corner < detectedCorners.length; ++corner) {
            context.fillStyle = 'red';
            context.fillRect(detectedCorners[corner].x, detectedCorners[corner].y, 5, 5)
        }
        return detectedCorners;
        
    }
    getTranpose(array) {
        return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
    }

    getImagePartition(array,startX, startY, partitionW,partitionH) {
    
        var partition = []
        console.log(array)
        for(let j=0; j < partitionH; ++j) {
            console.log(4*((startY+j)*(this.imageWidth)), 4*((startY+j)*(this.imageWidth+startX+partitionW)));
            partition.concat(partition,array.slice(4*((startY+j)*(this.imageWidth)), 4*((startY+j)*(this.imageWidth))+4*partitionW+1))
        }
        return partition;
    }
    morphErosion() {
        var canvas = document.getElementById(this.canvasId)
        var context = canvas.getContext("2d");
        var data = imageData.data;
        var kernelRadius = 3;
        for(var imgY=kernelRadius; imgY < this.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
            for(var imgX=kernelRadius; imgX < this.imageWidth; imgX+=1) {
                var allWhite = true;
                for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                    for(var kX=-kernelRadius; kX < kernelRadius; ++kX) { 
                        
                        // if(4*((imgX-kX) + (imgY-kY)*this.imageWidth)+2 > data.length) continue;
                        if(!(data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)] >=245 
                            && data[4*((imgX-kX) + (imgY-kY)*this.imageWidth) + 1] >=245 
                            && data[4*((imgX-kX) + (imgY-kY)*this.imageWidth) + 2] >=245)) {
                            allWhite = false;
                            break;
                        }
                    }
                    if(!allWhite) break;
                }
                if(allWhite) {
                    for(var kY=-kernelRadius; kY < kernelRadius; ++kY) { 
                        for(var kX=-kernelRadius; kX < kernelRadius; ++kX) { 
                            if(kY==-kernelRadius && kX==-kernelRadius) continue;
                            if(kY==-kernelRadius && kX==kernelRadius-1) continue;
                            if(kY==kernelRadius-1 && kX==-kernelRadius) continue;
                            if(kY==kernelRadius-1 && kX==kernelRadius-1) continue;
                           
                            data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)] = 0;
                            data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+1] = 0;
                            data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+2] = 0;
                            data[4*((imgX-kX) + (imgY-kY)*this.imageWidth)+3] = 0;
                        }
                    }
                    data[4*((imgX) + (imgY)*this.imageWidth)] = 255;
                    data[4*((imgX) + (imgY)*this.imageWidth)+1] = 255;
                    data[4*((imgX) + (imgY)*this.imageWidth)+2] = 255;
                    // data[4*((imgX) + (imgY)*this.imageWidth)+3] = 0;
                }
            }
        }
        //console.log("done applying morphological erosion");
        return imageData;
        
        
    }
    leastMeanSquaresEstim(xMatrix, yColVector) {
        var X = new Matrix(xMatrix);
        var Y = Matrix.columnVector(yColVector);
        var b = solve(X,Y,true);
        return b;
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
            for(let y=0; y < kernelLength; ++y) {
                kernel[x][y] /=sum;
            }
        }
        
        let kernelObj = {kernel:kernel, kernelRadius:kernelRadius, sig:sig}
        return kernelObj;
    }
     approximateEdgeBounds() {
        var canvas = document.getElementById(this.canvasId)
        var context = canvas.getContext("2d");
        var orderOfEq = 4;
        var mappedCurves = []
        var windowLength  = 250;
        var scale = this.imageHeight*this.imageWidth/(windowLength*windowLength)
        for(var imgY=0; imgY < this.imageHeight; imgY+=windowLength) {       //increment by 4 because its RGBA values
            for(var imgX=0; imgX < this.imageWidth; imgX+=windowLength) { 
                var imageData = context.getImageData(imgX,imgY,windowLength,windowLength);
                var data = imageData.data;
                var dataPts = [];
                var xMatrix = [];
                var yValues = [];
                for(let imgY2=0; imgY2 < windowLength;++imgY2) {
                    for(let imgX2=0; imgX2 < windowLength;++imgX2) {
                        let R = data[4*((imgY2)*windowLength + imgX2)]
                        let G = data[4*((imgY2)*windowLength + imgX2) + 1]
                        let B = data[4*((imgY2)*windowLength + imgX2) + 2]
                        let avg = (R + G + B)/3;
                        if(avg >= 255) {
                            dataPts.push({x:imgX2+imgX, y:imgY2+imgY})

                        }
                    }    
                }
                if(dataPts.length >orderOfEq) {
                    for(let a=0; a < dataPts.length; ++a) {
                        xMatrix.push(Array(orderOfEq).fill(dataPts[a].x))
                        //xMatrix.push([dataPts[a].x, dataPts[a].x, dataPts[a].x, dataPts[a].x])
                        yValues.push(dataPts[a].y)
                    }
                    //do order-3 equations
        
                    // console.log("xMatrix", xMatrix, "yValues", yValues)
                    var coeffs = this.leastMeanSquaresEstim(xMatrix,yValues);
                    
                    var X = [];
                    var Y = [];

                    // coeffs = coeffs.mul(scale);
                    for(let p=0; p < dataPts.length;++p) {

                        X.push(dataPts[p].x);
                        Y.push(dataPts[p].y);
                        // X.push(dataPts[p].x+imgX);
                        // Y.push(dataPts[p].y+imgY);
                    }
                    mappedCurves.push({xValues:X, yValues:Y, coeffs:coeffs, dataPts:dataPts})
                }
                console.log(`done with window at ${imgX}, ${imgY}  `)
            }
        } 
        // return new Promise((resolve,reject)=> { resolve(mappedCurves); });     
        return new Promise((resolve,reject)=> { resolve(mappedCurves); });     
    }
    edgeDetectComponent(kernelLength=5, middleValue=8, fillValue=-1, cornerValue=-1) {
        let kernel = new Array(kernelLength).fill(fillValue).map(() => new Array(kernelLength).fill(fillValue));
        let kernelRadius;
        if(kernelLength%2==0) {     //is even
            console.log("ERROR: Kernel length must be odd")
            return -1;
        }
        else {
            let middleIgradientX = Math.floor(kernelLength/2);
            kernel[middleIgradientX][middleIgradientX] = middleValue;
            kernel[0][0] = cornerValue
            kernel[0][kernelLength-1] = cornerValue
            kernel[kernelLength-1][0] = cornerValue
            kernel[kernelLength-1][kernelLength-1] = cornerValue
            kernelRadius = Math.floor(kernelLength/2);
        }
        let kernelObj = {kernel:kernel, kernelRadius:kernelRadius, sig:null}
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
    diffOfGauss(x,y,sigma) {
        let sigSquared = sigma*sigma;
        let kSquared = k*k;
        let exp1 = -.5*(x*x + y*y)/sigSquared;
        let A = 1/(2*Math.PI*sigSquared)
        let exp2 = -.5*(x*x + y*y)/(sigSquared*kSquared);
        let B = 1/(2*Math.PI*sigSquared*kSquared)
        let equation2 = A*Math.exp(exp1) - B*Math.exp(exp2);
        let equation1 = imageData.data //at x,y
    }
}