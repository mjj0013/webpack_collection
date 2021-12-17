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

function edgeDetectComponent(kernelLength=5, middleValue=8) {
    let kernel = new Array(kernelLength).fill(-1).map(() => new Array(kernelLength).fill(-1));
    let kernelRadius;
    if(kernelLength%2==0) {     //is even

    }
    else {
        let middleIdx = Math.floor(kernelLength/2);
        kernel[middleIdx][middleIdx] = middleValue;
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
            console.log("before", imageData);
            var data = imageData.data;
            var imageWidth = imageData.width;
            var imageHeight= imageData.height;
            
            if(filterInfo) {
                filterInfo.forEach(component => {
                    console.log("component", component)
                    let componentLength = component.kernelLength ? component.kernelLength : 5;
                    let filterSig = component.sig ? component.sig : 5;
                    if(component.type == "gaussBlur") {
                        var temp = gaussianBlurComponent(componentLength, filterSig);

                        component.kernel = temp.kernel;
                        component.sig = temp.sig;
                        component.kernelRadius = temp.kernelRadius;
                    }
                    if(component.type == "edgeDetect") {
                        
                        var temp = edgeDetectComponent(componentLength, 10);
                        component.kernel = temp.kernel;
                        component.kernelRadius = temp.kernelRadius;
                    }
                    if(component.type=="gammaTransfer") {
                        component.kernelRadius = 0;
                    }
                    if(component.type=="discreteTransfer") {
                        component.kernelRadius = 0;
                    }

                    if(component.type=="blackWhiteTransfer") {
                        component.kernelRadius = 0;
                    }

                    
                    var kernelRadius = component.kernelRadius;
                    for(var imgY=kernelRadius; imgY < imageHeight; imgY+=1) {       //increment by 4 because its RGBA values
                        for(var imgX=kernelRadius; imgX < imageWidth; imgX+=1) {       //increment by 4 because its RGBA values
                            if(component.type=="blackWhiteTransfer") {
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
                                    // R = Math.max(0,R);
                                    // R = Math.min(255,R);
                                }
                                if(component.applyTo.includes("G")) {
                                    G = colorGammaTransferComponent(G, component.amplitude, component.exponent, component.offset);
                                    // G = Math.max(0,G);
                                    // G = Math.min(255,G);
                                }
                                if(component.applyTo.includes("B")) {
                                    B = colorGammaTransferComponent(B, component.amplitude, component.exponent, component.offset);
                                    // B = Math.max(0,B);
                                    // B = Math.min(255,B);
                                }
                                if(component.applyTo.includes("A")) {
                                    A = colorGammaTransferComponent(A, component.amplitude, component.exponent, component.offset, true);
                                    // B = Math.max(0,B);
                                    // B = Math.min(255,B);
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
                                    // R = Math.max(0,R);
                                    // R = Math.min(255,R);
                                }
                                if(component.applyTo.includes("G")) {
                                    G = colorDiscreteTransferComponent(G,component.tableValues);
                                    // G = Math.max(0,G);
                                    // G = Math.min(255,G);
                                }
                                if(component.applyTo.includes("B")) {
                                    B = colorDiscreteTransferComponent(B, component.tableValues);
                                    // B = Math.max(0,B);
                                    // B = Math.min(255,B);
                                }
                                if(component.applyTo.includes("A")) {
                                    A = colorDiscreteTransferComponent(B, component.tableValues, true);
                                    // B = Math.max(0,B);
                                    // B = Math.min(255,B);
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
                               
                                // imagedata.data[imgX][imgY][0] = R;
                                // imagedata.data[imgX][imgY][1] = G;
                                // imagedata.data[imgX][imgY][2] = B;
                                data[4*(imgX + imgY*imageWidth)] = R;
                                data[4*(imgX + imgY*imageWidth) + 1] = G;
                                data[4*(imgX + imgY*imageWidth) + 2] = B;
                            }
                        }
                    }
                    console.log("done with component: ", component)
                })
            }
           
            context.putImageData(imageData, 0,0);
            console.log("after", imageData);
            
        }
        img.src = reader.result;
        
        
      }, false);
    
    if (file) {
        reader.readAsDataURL(file);

    }
    
    
    return 0;
    
    
}
