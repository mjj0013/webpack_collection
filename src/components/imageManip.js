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
        
        
        this.approximateEdgeBounds = this.approximateEdgeBounds.bind(this);
        this.colorBlackWhiteTransferComponent = this.colorBlackWhiteTransferComponent.bind(this);
        this.colorGammaTransferComponent = this.colorGammaTransferComponent.bind(this);
        this.colorDiscreteTransferComponent = this.colorDiscreteTransferComponent.bind(this);
        this.simpleGrayscaleConvert = this.simpleGrayscaleConvert.bind(this);

        this.getTranpose = this.getTranpose.bind(this);
        this.getImagePartition = this.getImagePartition.bind(this);
        this.edgeDetectComponent = this.edgeDetectComponent.bind(this);
        this.detectBlobs = this.detectBlobs.bind(this);
        this.mapEdgesFromCorners = this.mapEdgesFromCorners.bind(this);
        this.hasIntersection = this.hasIntersection.bind(this)
        this.getAngleOfLines = this.getAngleOfLines.bind(this);
        this.imageLayers = [];
        this.mappedCurves = []
        this.selectedImage = null
    }

    detectBlobs() {
        // https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L12.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
        //  https://www.cs.toronto.edu/~mangas/teaching/320/calendar.html
        //  http://www.cs.toronto.edu/~jepson/csc420/notes/imageFeaturesIIIBinder.pdf
        //  https://milania.de/blog/Introduction_to_the_Hessian_feature_detector_for_finding_blobs_in_an_image
        //  https://www.youtube.com/watch?v=zItstOggP7M
        this.originalData = this.originalImageData.data;
        var data = this.imageData.data;     //should normally be this.originalImageData.data;

        // var componentLength = 7;
        // let sigMultiplier=20;
        // let sig0 = 10;
        // var sigStack = [sig0*Math.pow(sigMultiplier,2)]
        var componentLength = 7;
        let sigMultiplier=25;
        let sig0 = 1;
        var sigStack = [sig0*Math.pow(sigMultiplier,3)]

        // var sigStack = []
        // for(let s=0;s<3;++s)    sigStack.push(sig0*Math.pow(sigMultiplier,s));
        
        var layerStack = [];
        for(let s=0; s < sigStack.length; ++s) {
            var temp = this.gaussianBlurComponent(componentLength, sigStack[s]);
            var component = {kernel:temp.kernel, sig:sigStack[s], kernelRadius:temp.kernelRadius};
            layerStack.push({"component":component, "resultData":{"RGB":data.map((x)=>x),
            "mags":[],"yGradient1":[], "xGradient1":[],"magGradient1":[],"thetaGradient1":[], "zeroPoints":[],
            "yGradient2":[], "xGradient2":[],"magGradient2":[],"thetaGradient2":[],"harrisResponse":[], "nLoG":[],"slopeRateX1":[], "slopeRateY1":[],"slopeRateX2":[], "slopeRateY2":[], 
            "cornerLocations":[], "edgeData":[],"mappedCurves":[], "classification":[]}});
        }
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
        // get derivative of x-y gradients, add them together, multiply that by sigma^2,    <=== nLoG (Normalized Laplacian of Gauss)
        var windowR = 3; //3 worked good
        var tempKernel = this.gaussianBlurComponent(1+windowR*2, 1);
        var gaussKernel = tempKernel.kernel
        gaussKernel = new Matrix(gaussKernel)
        var k= .04;        //sensitivity factor, tried 0.04
        //gaussKernel is multipled to every product of sum (Ixx, Ixy, Iyy)

        console.log("calculating 1st and 2nd gradients...")
        for(let c=0; c < layerStack.length; ++c) {

            var lastCornerDetected = null;
            var parallelComponent = layerStack[c];
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) {      
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {      
                    let left = parallelComponent["resultData"]["mags"][(imgX-1) + (imgY)*this.imageWidth]
                    let right = parallelComponent["resultData"]["mags"][(imgX+1) + (imgY)*this.imageWidth]
                    let top = parallelComponent["resultData"]["mags"][(imgX) + (imgY-1)*this.imageWidth]
                    let bottom = parallelComponent["resultData"]["mags"][(imgX) + (imgY+1)*this.imageWidth]
                    
                    if(imgX==0 || imgX==this.imageWidth-1) { left = 0;  right = 0; }
                    if(imgY==0 || imgY==this.imageHeight-1) { top = 0;  bottom = 0; }

                    parallelComponent["resultData"]["xGradient1"].push((left-right));
                    parallelComponent["resultData"]["yGradient1"].push((top-bottom));
                    let magGrad = Math.sqrt((top-bottom)*(top-bottom) + (left-right)*(left-right))
                    let theta = Math.atan((top-bottom)/(left-right))
                    let slopeRateX1 = magGrad*Math.cos(theta);
                    let slopeRateY1 = magGrad*Math.sin(theta)
                    parallelComponent["resultData"]["magGradient1"].push(magGrad);
                    parallelComponent["resultData"]["thetaGradient1"].push(Math.atan((top-bottom)/(left-right)));   
                    parallelComponent["resultData"]["slopeRateX1"].push(slopeRateX1) //measure of horizontal-ness
                    parallelComponent["resultData"]["slopeRateY1"].push(slopeRateY1) //measure of vertical-ness
 
                }
            }
            for(var imgY=0; imgY < this.imageHeight; imgY+=1) {      
                for(var imgX=0; imgX < this.imageWidth; imgX+=1) {     
                    let left = parallelComponent["resultData"]["xGradient1"][(imgX-1) + (imgY)*this.imageWidth]
                    let right = parallelComponent["resultData"]["xGradient1"][(imgX+1) + (imgY)*this.imageWidth]
                    let top = parallelComponent["resultData"]["yGradient1"][(imgX) + (imgY-1)*this.imageWidth]
                    let bottom = parallelComponent["resultData"]["yGradient1"][(imgX) + (imgY+1)*this.imageWidth]
                   
                    if(imgX==0 || imgX==this.imageWidth-1) { left = 0;  right = 0; }
                    if(imgY==0 || imgY==this.imageHeight-1) { top = 0;  bottom = 0; }

                    parallelComponent["resultData"]["xGradient2"].push((left-right));
                    parallelComponent["resultData"]["yGradient2"].push((top-bottom));
                    
                    let magGrad = Math.sqrt((top-bottom)*(top-bottom) + (left-right)*(left-right))
                    let theta = Math.atan((top-bottom)/(left-right))
                    let slopeRateX2 = magGrad*Math.cos(theta);
                    let slopeRateY2 = magGrad*Math.sin(theta)
                    parallelComponent["resultData"]["magGradient2"].push(magGrad);
                    parallelComponent["resultData"]["thetaGradient2"].push(theta);
                    parallelComponent["resultData"]["slopeRateX2"].push(slopeRateX2) //measure of horizontal-ness
                    parallelComponent["resultData"]["slopeRateY2"].push(slopeRateY2) //measure of vertical-ness

                    // nLoG is ???
                    //parallelComponent["resultData"]["nLoG"].push(parallelComponent["component"].sig*parallelComponent["component"].sig*((left-right)+(top-bottom)))
                }
            }

            //3 by 3 window
            // Harris corner detector
            for(var imgY=windowR; imgY < this.imageHeight-windowR; imgY+=1) {      
                for(var imgX=windowR; imgX < this.imageWidth-windowR; imgX+=1) {   
                    let Ixx = [];
                    let Iyy = [];
                    let Ixy = [];

                    let Ixx2 = [];
                    let Iyy2 = [];
                    let Ixy2 = [];
                    let centerMag  = parallelComponent["resultData"]["magGradient2"][((imgX) + (imgY)*this.imageWidth)];
                    let isLocalPeak = true;   //meaning, the center pixel in the window is the maximum in the window
                    for(var kY=-windowR; kY <= windowR; ++kY) {  
                        var xRow = [];
                        var yRow = [];
                        var xyRow = [];

                        var xRow2 = [];
                        var yRow2 = [];
                        var xyRow2 = [];
                        for(var kX=-windowR; kX <= windowR; ++kX) {   
                            if(parallelComponent["resultData"]["magGradient2"][((imgX-kX) + (imgY-kY)*this.imageWidth)] > centerMag) {
                                isLocalPeak = false;
                                break;
                            }
                            let xComp = parallelComponent["resultData"]["xGradient1"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                            let yComp = parallelComponent["resultData"]["yGradient1"][((imgX-kX) + (imgY-kY)*this.imageWidth)];

                            let xComp2 = parallelComponent["resultData"]["xGradient2"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                            let yComp2 = parallelComponent["resultData"]["yGradient2"][((imgX-kX) + (imgY-kY)*this.imageWidth)];
                            
                            if((xComp!=0 || yComp!=0) && (xComp2==0 && yComp2==0)) {
                                parallelComponent["resultData"]["zeroPoints"].push({x:imgX, y:imgY})
                            }
                            
                            xRow.push(xComp*xComp)
                            xyRow.push(xComp*yComp)
                            yRow.push(yComp*yComp)

                            xRow2.push(xComp2*xComp2)
                            xyRow2.push(xComp2*yComp2)
                            yRow2.push(yComp2*yComp2)
                        }
                        if(!isLocalPeak) break;
                        Ixx.push(xRow);
                        Ixy.push(xyRow);
                        Iyy.push(yRow);

                        Ixx2.push(xRow2);
                        Ixy2.push(xyRow2);
                        Iyy2.push(yRow2);
                    }

                    if(!isLocalPeak) continue;

                    Ixx = new Matrix(Ixx);
                    Ixy = new Matrix(Ixy);
                    Iyy = new Matrix(Iyy);

                    //these are second gradient, for building Hessian Matrix
                    Ixx2 = new Matrix(Ixx2);
                    Ixy2 = new Matrix(Ixy2);
                    Iyy2 = new Matrix(Iyy2);

                    
                    // Ixx = Ixx.mmul(gaussKernel);
                    // Ixy = Ixy.mmul(gaussKernel);
                    // Iyy = Iyy.mmul(gaussKernel);
                    // let Sxx = Ixx.sum()
                    // let Sxy =Ixy.sum();
                    // let Syy =Iyy.sum();
                    // if(Sxx==0 && Sxy==0 && Syy==0) continue;
                    // let det = (Sxx*Syy) - (Sxy*Sxy);
                    // let trace = Sxx + Syy;
                    // var harrisResponse = det - k*(trace*trace);
                    // parallelComponent["resultData"]["harrisResponse"].push({x:imgX, y:imgY, R:harrisResponse});
                    // if(harrisResponse >0) {
                    //     //is a corner
                    //     var pixelIdx = parallelComponent["resultData"]["xGradient2"].length-1;
                    //     parallelComponent["resultData"]["cornerLocations"].push({x:imgX, y:imgY, pixelIdx:pixelIdx});
                    // }
                    // else if(harrisResponse < 0) {}  // is an edge
                        
                    
                    let det = Matrix.sub(Ixx.mmul(Iyy),  Ixy.mmul(Ixy));
                    let trace = Matrix.add(Ixx, Iyy);

                    var harrisResponse = Matrix.sub(det,  Matrix.mul(trace.mmul(trace), k))
                    //parallelComponent["resultData"]["harrisResponse"].push(harrisResponse);
                    
                    for(let row=0; row < harrisResponse.rows;++row) {
                        let determined=false;
                        for(let col=0; col < harrisResponse.columns; ++col) {
                            if(harrisResponse.get(row,col) > 75) {       //75
                                //is a corner
                                parallelComponent["resultData"]["classification"].push("corner")
                                var pixelIdx = ((imgX) + (imgY)*this.imageWidth);
                                lastCornerDetected = {x:imgX, y:imgY, pixelIdx:pixelIdx};
                                parallelComponent["resultData"]["cornerLocations"].push({x:imgX, y:imgY, pixelIdx:pixelIdx});
                                
                                //use Hessian Matrix, page 39 here https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
                                determined=true;
                                break;
                            }
                            else if(harrisResponse.get(row,col) < 0) {
                                // is an edge
                                parallelComponent["resultData"]["classification"].push("edge")
                                var theta = parallelComponent["resultData"]["thetaGradient1"][pixelIdx]
                                //parallelComponent["resultData"]["edgeData"].push({x:imgX, y:imgY, pixelIdx:pixelIdx});

                                //use theta of pixel to determine which "direction" the edge is ( add 90deg since theta is normal), move a window in that direction and keep doing it till you reach another corner
                                //ACTUALLY, use Hessian Matrix, page 39 here https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
                                determined=true;
                                break;
                            }
                            else {
                                parallelComponent["resultData"]["classification"].push("flat")
                                
                            }
                        }
                        if(determined) break;
                    }
                }
                console.log("iter completed")
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

            parallelComponent["resultData"]["curveData"] = this.mapEdgesFromCorners(parallelComponent);
                       
        }
        
        console.log("layerStack", layerStack)
        this.imageLayers = layerStack;
        return layerStack;
    }
    hasIntersection(segment1,segment2) {
        let x1 = segment1[0].x;
        let y1 = segment1[0].y;
        let x2 = segment1[1].x;
        let y2 = segment1[1].y;

        let x3 = segment2[0].x;
        let y3 = segment2[0].y;
        let x4 = segment2[1].x;
        let y4 = segment2[1].y;

        let upperLeft = det(x1,y1,x2,y2)
        let lowerLeft = det(x3,y3,x4,y4)

        let denominator = det(x1-x2, y1-y2, x3-x4, y3-y4);

        let xNumerator = det(upperLeft, x1-x2, lowerLeft, x3-x4);
        let yNumerator = det(upperLeft, y1-y2, lowerLeft, y3-y4);


        let xCoord = xNumerator/denominator;
        let yCoord = yNumerator/denominator;

        
        if((xCoord==segment1[0].x && yCoord==segment1[0].y) ||  (xCoord==segment1[1].x && yCoord==segment1[1].y) ||  (xCoord==segment2[0].x && yCoord==segment2[0].y) ||  (xCoord==segment2[1].x && yCoord==segment2[1].y)) {
            return false;   }
   
        
        let onSegment1X = Math.min(segment1[0].x,segment1[1].x) <= xCoord &&  xCoord <= Math.max(segment1[0].x,segment1[1].x);
        let onSegment1Y = Math.min(segment1[0].y,segment1[1].y) <= yCoord <= Math.max(segment1[0].y,segment1[1].y);
        let onSegment1 = onSegment1X && onSegment1Y;

        let onSegment2X = Math.min(segment2[0].x,segment2[1].x) <= xCoord &&  xCoord <= Math.max(segment2[0].x,segment2[1].x);
        let onSegment2Y = Math.min(segment2[0].y,segment2[1].y) <= yCoord <= Math.max(segment2[0].y,segment2[1].y);
        let onSegment2 = onSegment2X && onSegment2Y;
        return onSegment1 && onSegment2;

    }
    getAngleOfLines(lineA, lineB) {
        //lineA ==> this.M.edges[e].data , which has format [{x:x, y:y}, {x:x, y:y}]
        //lineB ==> this.M.edges[e].data , which has format [{x:x, y:y}, {x:x, y:y}]

        var dxLineA = lineA[1].x - lineA[0].x;
        var dyLineA = lineA[1].y - lineA[0].y;

        var dxLineB = lineB[1].x - lineB[0].x;
        var dyLineB = lineB[1].y - lineB[0].y;

        var angle = Math.atan2(dxLineA*dyLineB - dyLineA*dxLineB, dxLineA*dxLineB + dyLineA*dyLineB);
        angle = angle<0? angle*=-1 : angle;
        //console.log("angle", angle*(180/Math.PI));
        return angle*(180/Math.PI);


    }

    mapEdgesFromCorners(layerData) {
        //use Hessian Matrix, page 39 here https://www.cs.toronto.edu/~mangas/teaching/320/slides/CSC320L06.pdf
        console.log("mapping edges from corners...")
        let cornerData = layerData["resultData"]["cornerData"];
        let numCorners = cornerData.length;
        var ninetyDegRad = 1.5708;   //90 degrees = 1.5708 radians

        var mappedCurves = [];
        var searchRadius = 5;       //NOT USED CURRENTLY    

        
        

        for(let p=0; p < numCorners; ++p) {
            let cornerIdx = cornerData[p].pixelIdx
            let cornerX = cornerData[p].x
            let cornerY = cornerData[p].y

        
            var nextTheta1 = layerData["resultData"]["thetaGradient1"][cornerIdx];
            var nextTheta2 = layerData["resultData"]["thetaGradient2"][cornerIdx];
            var nextMagGradient1 = layerData["resultData"]["magGradient1"][cornerIdx]
            var nextMagGradient2 = layerData["resultData"]["magGradient2"][cornerIdx]
    


            var edgePts = []    //collection of coordinates under a SINGLE edge
            edgePts.push({x:cornerX, y:cornerY, pixelIdx:cornerIdx})
            var nextX =  ((1)*Math.cos(nextTheta1+ninetyDegRad)) - ((1)*Math.sin(nextTheta2)) +cornerX
            var nextY =  ((1)*Math.sin(nextTheta1+ninetyDegRad)) + ((1)*Math.cos(nextTheta2)) +cornerY
            var nextPtIdx = Math.ceil(nextX + (nextY)*this.imageWidth);
            nextMagGradient1 = layerData["resultData"]["magGradient1"][nextPtIdx]
            nextMagGradient2 = layerData["resultData"]["magGradient2"][nextPtIdx]
            
            
            for(let a=0; a < 20; ++a) {
                nextTheta1 = layerData["resultData"]["thetaGradient1"][nextPtIdx];
                nextTheta2 = layerData["resultData"]["thetaGradient1"][nextPtIdx];
                nextMagGradient1 = layerData["resultData"]["magGradient1"][nextPtIdx];
                nextMagGradient2 = layerData["resultData"]["magGradient2"][nextPtIdx];
                
                nextX =  ((1)*Math.cos(nextTheta1+ninetyDegRad)) - ((1)*Math.sin(nextTheta2)) +nextX
                nextY =  ((1)*Math.sin(nextTheta1+ninetyDegRad)) + ((1)*Math.cos(nextTheta2)) +nextY
                var nextPtIdx = Math.ceil(nextX + (nextY)*this.imageWidth);
                
                //if(layerData["resultData"]["magGradient1"][nextPtIdx]>10) {
                    edgePts.push({x:nextX, y:nextY, pixelIdx:nextPtIdx});
                //}
            }
            //console.log("edgePts",edgePts)
            layerData["resultData"]["edgeData"].push(edgePts);
            
            
        }
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
                context.putImageData(OBJ.imageData, 0,0);
                OBJ.detectBlobs();
                console.log("inserting layer0 imageData")
                let layerIndex = OBJ.imageLayers.length-1
                // let layerIndex =0
                for(var imgY=0; imgY < OBJ.imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                    for(var imgX=0; imgX < OBJ.imageWidth; imgX+=1) {       //increment by 4 because its RGBA xValues
                        let mag = OBJ.imageLayers[layerIndex]["resultData"]["magGradient1"][imgX + (imgY*OBJ.imageWidth)];
                        let theta = OBJ.imageLayers[layerIndex]["resultData"]["thetaGradient1"][imgX + (imgY*OBJ.imageWidth)];
                        let R = (mag*5)*Math.cos(theta)     //57.2958*
                        let G = 0
                        let B = (mag*5)*Math.sin(theta);
                        OBJ.data[4*(imgX + imgY*OBJ.imageWidth)] = R;
                        OBJ.data[4*(imgX + imgY*OBJ.imageWidth)+1] = G;
                        OBJ.data[4*(imgX + imgY*OBJ.imageWidth)+2] = B;
                    }
                }
                console.log("done inserting");
                context.putImageData(OBJ.imageData, 0,0);
                var cornerLocations = OBJ.imageLayers[OBJ.imageLayers.length-1]["resultData"]["cornerLocations"]
                for(let c=0; c < cornerLocations.length; ++c) {
                    context.beginPath();
                    context.arc(cornerLocations[c].x, cornerLocations[c].y, 1, 0, 2 * Math.PI)
                    context.fillStyle = "white"
                    context.fill()
                }
                
                var edgeData = OBJ.imageLayers[OBJ.imageLayers.length-1]["resultData"]["edgeData"]
                console.log("edgeData.length",edgeData.length)
                console.log("edgeData", edgeData)
                for(let l=0; l<edgeData.length; ++l) {
                    context.beginPath();
                    context.moveTo(edgeData[l][0].x,edgeData[l][0].y);

                    for(let c=1; c < edgeData[l].length; ++c) {
                        
                        context.lineTo(edgeData[l][c].x,edgeData[l][c].y);
                        
                    }
                    context.strokeStyle = "white"
                    context.stroke()
                }
                
                console.log("done inserting");
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
        
        var windowLength  = 250;
        
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
                        if(avg >= 255) {dataPts.push({x:imgX2+imgX, y:imgY2+imgY})}
                    }    
                }
                if(dataPts.length >orderOfEq) {
                    for(let a=0; a < dataPts.length; ++a) {
                        xMatrix.push(Array(orderOfEq).fill(dataPts[a].x))
                        yValues.push(dataPts[a].y)
                    }
                    //do order-3 equations
                    var coeffs = this.leastMeanSquaresEstim(xMatrix,yValues);
                    var X = [];
                    var Y = [];
                    for(let p=0; p < dataPts.length;++p) {
                        X.push(dataPts[p].x);
                        Y.push(dataPts[p].y);
                    }
                    this.mappedCurves.push({xValues:X, yValues:Y, coeffs:coeffs, dataPts:dataPts})
                }
                console.log(`done with window at ${imgX}, ${imgY}  `)
            }
        } 
        
        return new Promise((resolve,reject)=> { resolve(); });     
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