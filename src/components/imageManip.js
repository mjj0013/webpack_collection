import { Matrix, solve } from 'ml-matrix';

function gaussianBlurComponent(kernelLength=5,sig=1) {
    if(kernelLength%2!=1) {
        console.log("ERROR: kernelLength must be odd");
        return -1;
    }
    let kernelRadius=Math.floor(kernelLength/2);
    console.log("at kernel");

    //https://aryamansharda.medium.com/image-filters-gaussian-blur-eb36db6781b1 says to scale sigma value in proportion to radius
    //set minimum standard deviation as a baseline
    sig = Math.max((kernelRadius / 2), 1)      

    let kernel = new Array(kernelLength).fill(0).map(() => new Array(kernelLength).fill(0));
    
    let upperExp = sig*sig*2;
    let lowerExp;
    let sum = 0;
    for(let x=-kernelRadius; x <=kernelRadius; ++x) {
        for(let y=-kernelRadius; y <=kernelRadius; ++y) {
            lowerExp = (x*x) + (y*y);
            kernel[x+kernelRadius][y+kernelRadius] = Math.exp(-upperExp/lowerExp)/(Math.PI*lowerExp);
            sum += kernel[x+kernelRadius][y+kernelRadius];
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

function leastMeanSquaresEstim(xMatrix, yColVector) {
    var X = new Matrix(xMatrix);
    var Y = Matrix.columnVector(yColVector);
    var b = solve(X,Y,true);
    console.log("solved least mean squaresEstim");
    return b;


}

//represents a cluster of white pixels as a single pixel (if all pixels in the frame are white, they're all white except for the middle )
export function morphErosion(imageData) {
    // var context = canvas.getContext("2d");
    // var imageData = context.getImageData(0,0,canvas.width,canvas.height);

    var data = imageData.data;
    var imageWidth = imageData.width;
    var imageHeight= imageData.height;
    var kernelRadius = 3;
    for(var imgY=kernelRadius; imgY < imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
        for(var imgX=kernelRadius; imgX < imageWidth; imgX+=1) {

            var allWhite = true;
            for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                for(var kX=-kernelRadius; kX < kernelRadius; ++kX) { 
                    
                    // if(4*((imgX-kX) + (imgY-kY)*imageWidth)+2 > data.length) continue;
                    if(!(data[4*((imgX-kX) + (imgY-kY)*imageWidth)] >=225 
                        && data[4*((imgX-kX) + (imgY-kY)*imageWidth) + 1] >=225 
                        && data[4*((imgX-kX) + (imgY-kY)*imageWidth) + 2] >=225)) {
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
                       
                        data[4*((imgX-kX) + (imgY-kY)*imageWidth)] = 0;
                        data[4*((imgX-kX) + (imgY-kY)*imageWidth)+1] = 0;
                        data[4*((imgX-kX) + (imgY-kY)*imageWidth)+2] = 0;
                        data[4*((imgX-kX) + (imgY-kY)*imageWidth)+3] = 0;
                    }
                }
                data[4*((imgX) + (imgY)*imageWidth)] = 255;
                data[4*((imgX) + (imgY)*imageWidth)+1] = 255;
                data[4*((imgX) + (imgY)*imageWidth)+2] = 255;
                // data[4*((imgX) + (imgY)*imageWidth)+3] = 0;
            }
        }
    }
    console.log("done applying morphological erosion");
    return imageData;
    
    
}

function edgeDetectComponent(kernelLength=5, middleValue=8, fillValue=-1, cornerValue=-1) {
    let kernel = new Array(kernelLength).fill(fillValue).map(() => new Array(kernelLength).fill(fillValue));
    let kernelRadius;
    if(kernelLength%2==0) {     //is even
        console.log("ERROR: Kernel length must be odd")
        return -1;
    }
    else {
        let middleIdx = Math.floor(kernelLength/2);
        
        kernel[middleIdx][middleIdx] = middleValue;
        kernel[0][0] = cornerValue
        kernel[0][kernelLength-1] = cornerValue
        kernel[kernelLength-1][0] = cornerValue
        kernel[kernelLength-1][kernelLength-1] = cornerValue
        
        
        kernelRadius = Math.floor(kernelLength/2);
    }
    let kernelObj = {kernel:kernel, kernelRadius:kernelRadius, sig:null}
    return kernelObj;

}


// export function transferComponent()
function colorBlackWhiteTransferComponent(inRGBA) {
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
function colorGammaTransferComponent(inColor, amplitude, exponent, offset, isAlpha=false) {
    return amplitude*Math.pow(inColor,exponent) + offset;
}
function colorDiscreteTransferComponent(inColor, ranges, isAlpha=false) {
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

function simpleGrayscaleConvert(pixel, type="luminosity")  {
    
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


function diffOfGauss(x,y,sigma) {
    let sigSquared = sigma*sigma;
    let kSquared = k*k;
    let exp1 = -.5*(x*x + y*y)/sigSquared;
    let A = 1/(2*Math.PI*sigSquared)

    let exp2 = -.5*(x*x + y*y)/(sigSquared*kSquared);
    
    let B = 1/(2*Math.PI*sigSquared*kSquared)

    let equation2 = A*Math.exp(exp1) - B*Math.exp(exp2);

    let equation1 = imageData.data //at x,y
}

function getTranpose(array) {
    return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
}

function getImagePartition(array,imageWidth, startX, startY, partitionW,partitionH) {
    
    var partition = []
    console.log(array)
    for(let j=0; j < partitionH; ++j) {
        console.log(4*((startY+j)*(imageWidth)), 4*((startY+j)*(imageWidth+startX+partitionW)));
        partition.concat(partition,array.slice(4*((startY+j)*(imageWidth)), 4*((startY+j)*(imageWidth))+4*partitionW+1))
    }
    return partition;
}
export function approximateEdgeBounds(canvas) {
    var context = canvas.getContext("2d");
    var fullImageData = context.getImageData(0,0,canvas.width,canvas.height);
    // var fullData = fullImageData.data;
    var imageWidth = fullImageData.width;
    var imageHeight= fullImageData.height;
    var orderOfEq = 4;


    var mappedCurves = []

    var windowLength  = 50;
    var scale = imageHeight*imageWidth/(windowLength*windowLength)

    for(var imgY=0; imgY < imageHeight; imgY+=windowLength) {       //increment by 4 because its RGBA values
        for(var imgX=0; imgX < imageWidth; imgX+=windowLength) { 
            var imageData = context.getImageData(imgX,imgY,windowLength,windowLength);
            var data = imageData.data;
            var dataPts = [];
            var xMatrix = [];
            var yValues = [];
            
            for(let imgY2=0; imgY2 < windowLength;++imgY2) {
                for(let imgX2=0; imgX2 < windowLength;++imgX2) {
                    let R = data[4*(imgY2*windowLength + imgX2)]
                    let G = data[4*(imgY2*windowLength + imgX2) + 1]
                    let B = data[4*(imgY2*windowLength + imgX2) + 2]
                    let avg = (R + G + B)/3;
                    if(avg >= 250) {
                        dataPts.push({x:imgX2, y:imgY2})
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
    
                console.log("xMatrix", xMatrix, "yValues", yValues)
                var coeffs = leastMeanSquaresEstim(xMatrix,yValues);
                console.log("coeffs", coeffs.data)
                var X = [];
                var Y = [];

                // coeffs = coeffs.mul(scale);
                for(let p=0; p < dataPts.length;++p) {
                    X.push(dataPts[p].x+imgX);
                    Y.push(dataPts[p].y+imgY);
                }
                mappedCurves.push({xValues:X, yValues:Y, coeffs:coeffs})
            }
            console.log(`done with window at ${imgX}, ${imgY}  `)
            
        }
    } 
    // return new Promise((resolve,reject)=> { resolve(mappedCurves); });     
    return new Promise((resolve,reject)=> { resolve(mappedCurves); });     
}

export function imageReader(canvas, addr=null, filterInfo=null) {
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
    var context = canvas.getContext("2d");
    
    reader.addEventListener("load", function () {
        const img = new Image();
        img.onload = function() {
            context.drawImage(img,0,0);
            var imageData = context.getImageData(0,0,canvas.width,canvas.height);
            var data = imageData.data;
            var imageWidth = imageData.width;
            var imageHeight= imageData.height;
            
            if(filterInfo) {
                filterInfo.forEach(component => {
                    let componentLength = component.kernelLength ? component.kernelLength : 2;
                    let filterSig = component.sig ? component.sig : 5;
                    if(component.type == "gaussBlur") {
                        var temp = gaussianBlurComponent(componentLength, filterSig);

                        component.kernel = temp.kernel;
                        component.sig = temp.sig;
                        component.kernelRadius = temp.kernelRadius;
                    }
                    if(component.type == "edgeDetect") {
                        
                        var temp = edgeDetectComponent(componentLength, component.middleValue,component.fillValue, component.cornerValue);
                        component.kernel = temp.kernel;
                        component.kernelRadius = temp.kernelRadius;
                    }
                    if(["gammaTransfer", "discreteTransfer", "blackWhiteTransfer", "grayScale"].includes(component.type)) {
                        component.kernelRadius = 0;
                    }
                    
             
                    var kernelRadius = component.kernelRadius;
                    for(var imgY=kernelRadius; imgY < imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                        for(var imgX=kernelRadius; imgX < imageWidth; imgX+=1) {       //increment by 4 because its RGBA values

                            if(component.type=="grayScale") {
                                let pixel = [data[4*(imgY*imageWidth + imgX)],data[4*(imgY*imageWidth + imgX)+1],data[4*(imgY*imageWidth + imgX)+2],data[4*(imgY*imageWidth + imgX)+3]]
                                var newRGBA = simpleGrayscaleConvert(pixel,component.subType);
                                data[4*(imgY*imageWidth + imgX)] = newRGBA[0];
                                data[4*(imgY*imageWidth + imgX) + 1] = newRGBA[1]
                                data[4*(imgY*imageWidth + imgX) + 2] = newRGBA[2]
                                data[4*(imgY*imageWidth + imgX) + 3] = newRGBA[3]
                            }
                            else if(component.type=="blackWhiteTransfer") {
                                let R = data[4*(imgY*imageWidth + imgX)];
                                let G = data[4*(imgY*imageWidth + imgX) +1];
                                let B = data[4*(imgY*imageWidth + imgX) +2];
                                let A = data[4*(imgY*imageWidth + imgX) +3];
                                var newRGBA = colorBlackWhiteTransferComponent([R,G,B,A]);
                                data[4*(imgY*imageWidth + imgX)] = newRGBA[0];
                                data[4*(imgY*imageWidth + imgX) + 1] = newRGBA[1]
                                data[4*(imgY*imageWidth + imgX) + 2] = newRGBA[2]
                                data[4*(imgY*imageWidth + imgX) + 3] = newRGBA[3]

                            }
                            // let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];
                            else if(component.type=="gammaTransfer") {
                                let R = data[4*(imgY*imageWidth + imgX)];
                                let G = data[4*(imgY*imageWidth + imgX) +1];
                                let B = data[4*(imgY*imageWidth + imgX) +2];
                                let A = data[4*(imgY*imageWidth + imgX) +3];
                                
                                if(component.applyTo.includes("R")) {
                                    R = colorGammaTransferComponent(R, component.amplitude, component.exponent, component.offset);
                                }
                                if(component.applyTo.includes("G")) {
                                    G = colorGammaTransferComponent(G, component.amplitude, component.exponent, component.offset);
                                }
                                if(component.applyTo.includes("B")) {
                                    B = colorGammaTransferComponent(B, component.amplitude, component.exponent, component.offset);
                                }
                                if(component.applyTo.includes("A")) {
                                    A = colorGammaTransferComponent(A, component.amplitude, component.exponent, component.offset, true);
                                }
                                data[4*(imgY*imageWidth + imgX)] = R;
                                data[4*(imgY*imageWidth + imgX) + 1] = G;
                                data[4*(imgY*imageWidth + imgX) + 2] = B;
                                data[4*(imgY*imageWidth + imgX) + 3] = A;
                                
                            }
                            else if(component.type=="discreteTransfer") {
                                let R = data[4*(imgY*imageWidth + imgX)];
                                let G = data[4*(imgY*imageWidth + imgX) +1];
                                let B = data[4*(imgY*imageWidth + imgX) +2];
                                let A = data[4*(imgY*imageWidth + imgX) +3];
                                
                                if(component.applyTo.includes("R")) {
                                    R = colorDiscreteTransferComponent(R, component.tableValues);
                                }
                                if(component.applyTo.includes("G")) {
                                    G = colorDiscreteTransferComponent(G,component.tableValues);
                                }
                                if(component.applyTo.includes("B")) {
                                    B = colorDiscreteTransferComponent(B, component.tableValues);
                                }
                                if(component.applyTo.includes("A")) {
                                    A = colorDiscreteTransferComponent(B, component.tableValues, true);
                                }
                                data[4*(imgY*imageWidth + imgX)] = R;
                                data[4*(imgY*imageWidth + imgX) + 1] = G;
                                data[4*(imgY*imageWidth + imgX) + 2] = B;
                                data[4*(imgY*imageWidth + imgX) + 3] = A;
                                
                            }
                            
                            
                            else if(component.type=="gaussBlur" || component.type=="edgeDetect") {
                                let R = 0;
                                let G = 0;
                                let B = 0;
                                
                                for(var kY=-kernelRadius; kY < kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                                    for(var kX=-kernelRadius; kX < kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                                        let value = component.kernel[kY+kernelRadius][kX+kernelRadius];

                                        R += data[4*((imgX-kX) + (imgY-kY)*imageWidth)]*value;
                                        G += data[4*((imgX-kX) + (imgY-kY)*imageWidth)+1]*value;
                                        B += data[4*((imgX-kX) + (imgY-kY)*imageWidth)+2]*value;
                                        // R += data[imgX-kX][imgY-kY][0]*value;
                                        // G += data[imgX-kX][imgY-kY][1]*value;
                                        // B += data[imgX-kX][imgY-kY][2]*value;
                                    }
                                }
                                data[4*(imgX + imgY*imageWidth)] = R;
                                data[4*(imgX + imgY*imageWidth) + 1] = G;
                                data[4*(imgX + imgY*imageWidth) + 2] = B;
                            }
                        }
                    }
                })
            }
            
            imageData = morphErosion(imageData);
            console.log("imageData", imageData);
            
            context.putImageData(imageData, 0,0);


            
           
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
