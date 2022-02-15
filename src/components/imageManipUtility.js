export function isCorner(resultData,pixelIdx, eigenValEstimate=5000) {
    var currentR = resultData["harrisResponse"][pixelIdx];
    var currentEigenVals = resultData["eigenVals"][pixelIdx];
    if(currentR>0) {
        var real = currentEigenVals.realEigenvalues;
        if(real[0]>eigenValEstimate && real[1]>eigenValEstimate) return true;
    }
    return false;
}


export function scanRadiusForCorner(resultData,currentPixel, scanRadius=10, eigenValEstimate=5000) {
    var imageWidth = resultData.imageInfo.imageWidth;
    var imageHeight = resultData.imageInfo.imageHeight;
    if(isCorner(resultData, currentPixel, eigenValEstimate)) {
        var y = Math.floor(currentPixel/imageWidth)
        var x = currentPixel - y*imageWidth
        return {idx:currentPixel, x:x, y:y};
    }
   
    for(var kY=-scanRadius; kY <= scanRadius; ++kY) {  
        for(var kX=-scanRadius; kX <= scanRadius; ++kX) {   
            var pixelIdx = ((currentPixel.x-kX) + (currentPixel.y-kY)*imageWidth)
            if(pixelIdx<0 || pixelIdx>=imageWidth*imageHeight) continue;
            if(isCorner(resultData, pixelIdx, eigenValEstimate)) {
                var y = Math.floor(pixelIdx/imageWidth)
                var x = pixelIdx - y*imageWidth
                return {idx:pixelIdx, x:x, y:y};
            }
        }
    }
    return null;
}