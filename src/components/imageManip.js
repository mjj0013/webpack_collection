export function gaussianFilter(kernelLength=5,sig=1) {
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


export function imageReader(canvas, addr=null, filterInfo=null) {
    //from https://www.youtube.com/watch?v=-AR-6X_98rM&ab_channel=KyleRobinsonYoung

    //filterInfo will be object:    ex: {type:"gauss", kernelLength:5, sig:1}
    var kernelObj = null;
    if(filterInfo) {
        let filterLength = filterInfo.kernelLength ? filterInfo.kernelLength : 5;
        let filterSig = filterInfo.sig ? filterInfo.sig : 5;
        if(filterInfo.type == "gauss") {
            kernelObj = gaussianFilter(filterLength, filterSig);
        }
    }


    var input = addr;
    if(addr==null) {
        input = document.querySelector('input[type="file"]');
        console.log("input",input);
    }
    
    console.log("ueueueuueue");

    const preview = document.querySelector('img');
    const file = document.querySelector('input[type=file]').files[0];
    const reader = new FileReader();
    var context = canvas.getContext("2d");

    reader.addEventListener("load", function () {
        const img = new Image();
        
        
        img.onload = function() {
            // /var canvas=document.createElement("canvas");
            console.log("ieiewoqijfidsf");
            
            context.drawImage(img,0,0);

            var imageData = context.getImageData(0,0,canvas.width,canvas.height);
            var data = imageData.data;

            if(filterInfo) {
                for(var imgX=kernelObj.kernelRadius; imgX < data.length; imgX+=4) {       //increment by 4 because its RGBA values
                    for(var imgY=kernelObj.kernelRadius; imgY < data.length; imgY+=4) {       //increment by 4 because its RGBA values
                        // let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];
                        let R = 0;
                        let G = 0;
                        let B = 0;
                        for(var kX=-kernelObj.kernelRadius; kX < kernelObj.kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                            for(var kY=-kernelObj.kernelRadius; kY < kernelObj.kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                                let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];

                                console.log(data[imgX-kX])
                                //console.log("imageData[imgX-kX][imgY-kY]", data[imgX-kX][imgY-kY]);
                                R += data[imgX-kX][imgY-kY][0]*value;
                                G += data[imgX-kX][imgY-kY][1]*value;
                                B += data[imgX-kX][imgY-kY][2]*value;
                            }
                        }
                        imageData.data[imgX][imgY][0] = R;
                        imageData.data[imgX][imgY][1] = G;
                        imageData.data[imgX][imgY][2] = B;
                    }
                }
            }
            context.putImageData(imageData);
            console.log(imageData);
        }
        img.src = reader.result;
        
      }, false);
    
    if (file) {
        reader.readAsDataURL(file);
    }

    
    
}


// export function manip(addr=null) {
//     imageReader(addr)

    
// }