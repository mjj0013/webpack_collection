import { Matrix, solve } from 'ml-matrix';

var preCalcFactorials = [1,1,2,6,24,120, 720, 5040, 40320, 362880,39916800, 479001600, 6227020800, 87178291200]
function binomialCoeff(n,i) {
    if(n > 13 || i > 13) return -1;
    var nFact = preCalcFactorials[n];
    var iFact = preCalcFactorials[i];
    var diffFact = preCalcFactorials[n-i];
    return nFact/(iFact*diffFact);
}

//NOTE: BEZIER PARAMETRIC FUNCTIONS BELOW ARE NOT THE SAME AS THE LAGRANGE POLYNOMIAL!!
function getBezierParametricFunctions(order) {
    //returns {xFunc:x(t), yFunc: y(t)}
    // https://stackoverflow.com/questions/5634460/quadratic-b%c3%a9zier-curve-calculate-points
    //For calculating point on Cubic bezier x(t) and y(t), 0 <= t <= 1 :
        //  x(t) = (1-t)*(1-t)*(1-t)*p[0].x + 3*(1-t)*(1-t)*t*p[1].x + 3*(1-t)*t*t*p[2].x + t*t*t*p[3].x
        //  y(t) = (1-t)*(1-t)*(1-t)*p[0].y + 3*(1-t)*(1-t)*t*p[1].y + 3*(1-t)*t*t*p[2].y + t*t*t*p[3].y
        //p[0] --> starting point
        //p[1] --> control point
        //p[2] --> control point
        //p[3] --> end point
    var xTerms = [];
    var yTerms = [];
    for(let i=0; i < order+1; ++i) {
        let thisBinomCoeff = binomialCoeff(order,i);
        let currentTerm = `(${thisBinomCoeff}*(1-t)`
        let repeatingFactors = order-i;
        if(repeatingFactors==0) currentTerm=`(${thisBinomCoeff}`;
        else {
            for(let fact=1; fact < repeatingFactors; ++fact) {currentTerm += `*(1-t)`}
        }
        if(i == 0) currentTerm+=`*1`
        else {
            currentTerm+=`*t`
            for(let tFact=1; tFact < i; ++tFact) {currentTerm+=`*t` }
            
        }
        currentTerm+=`*pts[${i}]`
        xTerms.push(currentTerm+`.x)`);
        yTerms.push(currentTerm+`.y)`);

    }
    eval(`var bezierParametric${order} = (t, pts) => {
        let xVal = ${xTerms.join(` + `)};
        let yVal = ${yTerms.join(` + `)};
        return {x:xVal, y:yVal}
    }`)
    return {func:`bezierParametric${order}`, order: order};
}

function partitionItems(items,k,remPos = 0) {
    //splits items into k segments and returns array of partitions
    //if there's a remainder, there is option to adjust where the remainder will be placed in the partitions.
    var segments = []
    var N = items.length;
    var segmentLen = Math.floor(N/k)
    if(N%k!=0) {
        var rem = N%k;
        var remAdded = false;
        for(let d=0; d<k; ++d) {
            if(d==remPos) {
                remAdded = true;
                segments.push({
                    indexRange:[d*segmentLen, rem+ segmentLen*(d+1)],
                    vals:items.slice(d*segmentLen, rem+ segmentLen*(d+1))
                });
            }
            else {
                if(remAdded) {
                    segments.push({
                        indexRange:[d*segmentLen+rem,segmentLen*(d+1)+rem],
                        vals:items.slice(d*segmentLen+rem, segmentLen*(d+1)+rem)
                    });
                }
                else {
                    segments.push({
                        indexRange:[d*segmentLen, segmentLen*(d+1)],
                        vals:items.slice( d*segmentLen, segmentLen*(d+1) )
                    });
                }   
            }
        } 
    }
    else {
        for(let d=0; d<k; ++d) {
            segments.push({
                indexRange:[d*segmentLen, segmentLen*(d+1)],
                vals:items.slice(d*segmentLen,segmentLen*(d+1))
            });
        }   
    }
    return segments;
}

function getStdDev(allItems) {
    var totalNum = allItems.length;
    var total = 0
    for(let i =0; i < allItems.length; ++i) total+=allItems[i];
    var average = total/totalNum;
    var summation = 0
    for(let i =0; i < allItems.length; ++i) {
        summation += (allItems[i]-average)*(allItems[i]-average)
    }
    return Math.sqrt(summation/(totalNum-1));
}
export class Curve {
    constructor(pts,equationId) {
        
        this.testPtsOnCurve = this.testPtsOnCurve.bind(this);
        this.testLagrangePolyString = this.testLagrangePolyString.bind(this);
        this.optimizeFunction = this.optimizeFunction.bind(this);
        
        this.getPointData = this.getPointData.bind(this);
        this.fitCurveToPts = this.fitCurveToPts.bind(this);
        
        this.getXRange = this.getXRange.bind(this);
        this.optimizeCurve = this.optimizeCurve.bind(this);

        this.equationId = equationId;
        this.subCurves = [];
        this.pts = pts;
        this.N = this.pts.length;
        this.xVals = this.pts.map(a=>a.x);
        this.yVals = this.pts.map(a=>a.y);

        // var ptData = this.getPointData()
        // this.slopeSteps = ptData.slopes;    //the slopes between each consecutive point in the curve
        // this.distSteps = ptData.dists;
       
        this.xRange = this.getXRange([0,this.pts.length]);
        this.xMin = this.xRange[0];
        this.xMax = this.xRange[1];


        this.curveData = this.testLagrangePolyString();
        this.currentEquationStr = this.curveData.equationStr;       //you would call geval/eval on this variable in another module
        this.currentEquationName = this.curveData.equationName;
        this.equationOrder = this.curveData.equationOrder;
        this.curveData = this.fitCurveToPts();
        //this.optimizeCurve();
        
    }

    fitCurveToPts(order=2) {       //use Method of Least Square to find a curve that fits points, not using Lagrange polynomial
        //https://www.youtube.com/watch?v=-UJr1XjyfME&ab_channel=Civillearningonline
        
        var n = this.pts.length;
        var xVals = this.pts.map(a=>a.x);
        var yVals = this.pts.map(a=>a.y);
        var xyVals = this.pts.map(a=>a.x*a.y);
        var xxyVals = this.pts.map(a=>a.x*a.x*a.y);
        
        var xxVals = this.pts.map(a=>a.x*a.x);
        var xxxVals = this.pts.map(a=>a.x*a.x*a.x);
        var xxxxVals = this.pts.map(a=>a.x*a.x*a.x*a.x);
        
        var xSum = xVals.reduce(function(a, b) { return a + b; }, 0);
        var ySum = yVals.reduce(function(a, b) { return a + b; }, 0);
        var xySum = xyVals.reduce(function(a, b) { return a + b; }, 0);
        var xxySum = xxyVals.reduce(function(a, b) { return a + b; }, 0);
        
        var xxSum =     xxVals.reduce(function(a, b) { return a + b; }, 0);
        var xxxSum =    xxxVals.reduce(function(a, b) { return a + b; }, 0);
        var xxxxSum =   xxxxVals.reduce(function(a, b) { return a + b; }, 0);
        
        var X,Y;
        // fits a QUADRATIC curve to data. i.e c*x^2 + b*x + a
        if(order==2) {
            X = new Matrix([[n, xSum, xxSum] , [xSum, xxSum, xxxSum], [xxSum, xxxSum, xxxxSum]]);
            Y = Matrix.columnVector([ySum, xySum, xxySum]);
        }
        else if(order==3) {
            var xxxyVals = this.pts.map(a=>a.x*a.x*a.x*a.y);
            var xxxySum = xxxyVals.reduce(function(a, b) { return a + b; }, 0);
            var xxxxxVals = this.pts.map(a=>a.x*a.x*a.x*a.x*a.x);
            var xxxxxxVals = this.pts.map(a=>a.x*a.x*a.x*a.x*a.x*a.x);
            var xxxxxSum =  xxxxxVals.reduce(function(a, b) { return a + b; }, 0);
            var xxxxxxSum = xxxxxxVals.reduce(function(a, b) { return a + b; }, 0);
            X = new Matrix([[n, xSum, xxSum, xxxSum] , [xSum, xxSum, xxxSum, xxxxSum], [xxSum, xxxSum, xxxxSum,xxxxxSum], [xxxSum, xxxxSum, xxxxxSum,xxxxxxSum]]);
            Y = Matrix.columnVector([ySum, xySum, xxySum, xxxySum]);
        }
        else return -1;
        
        var coeffs = solve(X,Y,true);
        let a = coeffs.get(0,0)
        let b = coeffs.get(1,0)
        let c = coeffs.get(2,0)
        var terms = [`(${a})`, `(${b}*x)`,`(${c}*x*x)`] //quadratic

        if(order==3) {
            let d = coeffs.get(3,0) //cubic
            terms.push(`(${d}*x*x*x)`)
        }
        var equation = `var curvePoly${this.equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        var result = {xRange:this.xRange,equationOrder:3, equationStr:equation, equationName:`curvePoly${this.equationId.toString()}`}
        return result;
    }

    //recursive helper function of optimizeCurve
    optimizeFunction(segmentRange, featureFocus="slope", numSegments=2,stdDevThreshold=1.5) {
       
        var segmentN = segmentRange[1];
        var thisSegment;
        if(featureFocus=="slope") {
            thisSegment = this.slopeSteps.slice(segmentRange[0], segmentRange[1])
        }
        else if(featureFocus=="distance") {
            thisSegment = this.distSteps.slice(segmentRange[0], segmentRange[1])
        }
        else return -1
        var stdDev = getStdDev(thisSegment);   //the std-deviation of the the slopes

        //divide slope points in half. if standard deviation is still high, then divide into quarters, then into eighths etc 
        var isOptimal = stdDev <= stdDevThreshold;
        if(isOptimal) {     //this segment is optimal
            return [{
                successRatio:stdDevThreshold/stdDev,
                segment:thisSegment, 
                segmentRange:segmentRange, 
                stdDev:stdDev}]
        }
        else if(segmentN % numSegments==0) {           //segments are divided perfectly
            var segments = partitionItems(thisSegment, numSegments) //segments is an array of partitions of the curve's slopes (still in order)
            var segmentResults = [];
            var optimalSegments = []

            for(let seg = 0; seg < segments.length; ++seg) {
                let stdDev = getStdDev(segments[seg].vals)
                let subIsOptimal = false;
                if(stdDev <= stdDevThreshold) subIsOptimal = true;
                segmentResults.push({
                    successRatio:stdDevThreshold/stdDev,
                    status:subIsOptimal, 
                    segment:segments[seg].vals, 
                    indexRange:segments[seg].indexRange,
                    stdDev:stdDev})
            }
            for(let resultSeg=0; resultSeg < segmentResults.length; ++resultSeg) {
                if(segmentResults[resultSeg].status) {
                    //save this segment since the stdDev of its slopes were below threshold
                    optimalSegments.push({
                        featureSegment:segmentResults[resultSeg].segment, 
                        indexRange:segmentResults[resultSeg].indexRange, 
                        stdDev:segmentResults[resultSeg].stdDev,
                        successRatio:stdDevThreshold/segmentResults[resultSeg].stdDev})
                }
                else  {     //attempt to further divide this segment into more sub segments
                    let nextIterRange = segmentResults[resultSeg].indexRange.length;
                    
                    if(nextIterRange > numSegments) {       //current segment can still be divided further
                        optimalSegments.concat(this.optimizeFunction(segmentResults[resultSeg].indexRange,featureSlope,numSegments, stdDevThreshold))
                    }
                    else {      //current segment can no longer be divided
                        optimalSegments.push({
                            successRatio:stdDevThreshold/segmentResults[resultSeg].stdDev,
                            featureSegment:segmentResults[resultSeg].segment, 
                            indexRange:segmentResults[resultSeg].indexRange, 
                            stdDev:segmentResults[resultSeg].stdDev})
                    }
                }
            }
            return optimalSegments;
        }
        else {          
            //for when points in each segment are NOT evenly divided
            //try every combination of remainder position, see which results in the least std-dev
            var oddResults = []
            for(let remPos=0; remPos < numSegments; ++remPos) {
                var segments = partitionItems(this.slopeSteps.slice(segmentRange[0], segmentRange[1]), numSegments,remPos)
                var segmentResults = [];
                var optimalSegments = []

                for(let seg = 0; seg < segments.length; ++seg) {
                    let stdDev = getStdDev(segments[seg].vals)
                    let subIsOptimal = false;
                    if(stdDev <= stdDevThreshold) subIsOptimal = true;
                    segmentResults.push({
                        successRatio:stdDevThreshold/stdDev,
                        status:subIsOptimal, 
                        segment:segments[seg].vals, 
                        indexRange:segments[seg].indexRange,
                        stdDev:stdDev})
                }
                for(let resultSeg=0; resultSeg < segmentResults.length; ++resultSeg) {
                    if(segmentResults[resultSeg].status) {      //save this segment since the stdDev of its slopes were below threshold
                        optimalSegments.push({
                            successRatio:stdDevThreshold/segmentResults[resultSeg].stdDev,
                            featureSegment:segmentResults[resultSeg].segment, 
                            indexRange:segmentResults[resultSeg].indexRange, 
                            stdDev:segmentResults[resultSeg].stdDev})
                    }
                    else  {     //further divide this segment into more sub segments
                        let nextIterRange = segmentResults[resultSeg].indexRange.length;
                        if(nextIterRange > numSegments) {
                            optimalSegments.concat(this.optimizeFunction(segmentResults[resultSeg].indexRange,featureSlope,numSegments, stdDevThreshold))
                        }
                        else {
                            optimalSegments.push({
                                successRatio:stdDevThreshold/segmentResults[resultSeg].stdDev,
                                featureSegment:segmentResults[resultSeg].segment, 
                                indexRange:segmentResults[resultSeg].indexRange, 
                                stdDev:segmentResults[resultSeg].stdDev})
                        }
                    }
                }
                let allSuccessRatios = optimalSegments.map(a=> a.successRatio)
                var successRatioSum = allSuccessRatios.reduce(function(a, b) { return a + b; }, 0);
                oddResults.push({result:optimalSegments, avgSuccessRatio:successRatioSum/allSuccessRatios.length})
            }
            //taking the best partition pattern ( result with the greatest success ratio of itself or its sub segments)
            oddResults.sort(function(a,b){return b.avgSuccessRatio-a.avgSuccessRatio});
            var bestSegmentResults = oddResults[0].result;
            
            for(let resultSeg=0; resultSeg < bestSegmentResults.length; ++resultSeg) {
                if(bestSegmentResults[resultSeg].status) {
                    //save this segment since the stdDev of its slopes were below threshold
                    optimalSegments.push({
                        featureSegment:bestSegmentResults[resultSeg].segment, 
                        indexRange:bestSegmentResults[resultSeg].indexRange, 
                        stdDev:bestSegmentResults[resultSeg].stdDev,
                        successRatio:stdDevThreshold/bestSegmentResults[resultSeg].stdDev})
                }
                else  {
                    //attempt to further divide this segment into more sub segments
                    let nextIterRange = bestSegmentResults[resultSeg].indexRange.length;
                    
                    if(nextIterRange > numSegments) {       //current segment can still be divided further
                        optimalSegments.concat(this.optimizeFunction(bestSegmentResults[resultSeg].indexRange,featureSlope,numSegments, stdDevThreshold))
                    }
                    else {      //current segment can no longer be divided
                        optimalSegments.push({
                            successRatio:stdDevThreshold/bestSegmentResults[resultSeg].stdDev,
                            featureSegment:bestSegmentResults[resultSeg].segment, 
                            indexRange:bestSegmentResults[resultSeg].indexRange, 
                            stdDev:bestSegmentResults[resultSeg].stdDev})
                    }
                }
            }
            return optimalSegments;
        }
    }
    
    optimizeCurve(numSegments=2, stdDevThreshold=1.5) {
        var ptData = this.getPointData()
        this.slopeSteps = ptData.slopes;    //the slopes between each consecutive point in the curve
        this.distSteps = ptData.dists;
        var currentRange = [0,this.N];

        // //the std-deviation of the the slopes
        // var slopeStdDev = getStdDev(this.slopeSteps.slice(currentRange[0], currentRange[1]));   
        // //divide slope points in half. if standard deviation is still high, then divide into quarters, then into eighths etc 
        // var slopeStdDev = getStdDev(this.slopeSteps);   //the std-deviation of the the slopes
        // var isOptimal = slopeStdDev <= stdDevThreshold;
        // if(isOptimal) {    
        //     //this segment is optimal
        //     return 
        // }
        var optimalSegmentation = this.optimizeFunction(currentRange, "slope", numSegments, stdDevThreshold);
    }

    getPointData() {
        //gets distances, slopes, and slopeDeltas between each consecutive point
        var dists = []
        var slopes = [];
        var mappedFunc = []
        for(let x=0; x < this.xVals.length; ++x)  mappedFunc.push([this.xVals[x],this.yVals[x]])
        
        var outputs = Object.fromEntries(mappedFunc);
        var sortedXVals = [...this.xVals].sort(function(a,b){return a-b});

        let lastX = 0, lastY = 0;
        
        for(let x=0; x < sortedXVals.length; ++x) {
            if(x!=0) {
                let pastX = sortedXVals[x-1];
                let pastY = outputs[pastX];
                let thisX = sortedXVals[x];
                let thisY = outputs[thisX];
                let dist = Math.sqrt((thisX-pastX)*(thisX-pastX) + (thisY-pastY)*(thisY-pastY))
                dists.push(dist)
            }
            let thisX = sortedXVals[x];
            let thisY = outputs[thisX];
            slopes.push((thisY-lastY)/(thisX-lastX))

            lastX = thisX;
            lastY = thisY;
        }
        
        return {slopes:slopes, dists:dists};
    }

    getXRange(range) {
        var xMin=99;
        var xMax = 0;
        for(let x=range[0]; x < range[1]; ++x) {
            if(this.xVals[x] > xMax) xMax = this.xVals[x];
            if(this.xVals[x] < xMin) xMin = this.xVals[x];
        }
        return [xMin, xMax]
    }

    testLagrangePolyString(range=null) {
        //range[0] is xMin,     range[1] is xMax
        if(range==null) range = this.xRange;
        var selectedPts = this.pts.slice(range[0],range[1]);
        var selectedXVals = this.xVals.slice(range[0],range[1]);
        var selectedYVals = this.yVals.slice(range[0],range[1]);
        var terms = [];

        for(let p=0; p < selectedPts.length; ++p) {
            var numerator=`${selectedYVals[p]}`
            var denominator = 1;
            for(let pk=0; pk < selectedPts.length; ++pk) {
                if(p==pk) continue;
                numerator += `*(x - ${selectedXVals[pk]})`
                denominator *= (selectedXVals[p]-selectedXVals[pk]);
            }
            if(denominator==0) terms.push("(0)")
            else terms.push("("+numerator+`/${denominator}`+")")
        }
        var equation = `var curvePoly${this.equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        var result = {pts:selectedPts, xRange:[range[0], range[1]],equationOrder:terms.length-1, equationStr:equation, equationName:`curvePoly${this.equationId.toString()}`}
        return result; 
    }
    testPtsOnCurve(testPts, tolerance=5) {
        //testPts is list of points to test if they intercept with the curve
        //tolerance:     how many pixels away can a point be from the line to be valid
        // attempt to do vote-process on what bezier curve has the most intercepts ( perhaps the # of intercepts has to be at least the distance b/w beginning and end) 
        //for help: look at https://javascript.tutorialink.com/calculating-intersection-point-of-quadratic-bezier-curve/
        let matchingPts = Array(testPts.length).fill(false);
        var curveFunc = geval(this.equationName)
        var curveXRange = this.xRange;
        var successNum = 0;
        var funcValPairs = []
        for(let x =curveXRange[0]; x <= curveXRange[1]; ++x) {
            var y = curveFunc(x)
            funcValPairs.push({x:x, y:y})
            var isFound = false;
            for(let tp=0; tp < testPts.length; ++tp) {
                if(testPts[tp].x==x && (testPts[tp].y==Math.floor(y) || testPts[tp].y==Math.ceil(y))) {
                    matchingPts[tp] = true;
                    isFound = true;
                    ++successNum;
                }
            }
        }
        if(matchingPts.includes(false)) {
            for(let tp=0; tp < matchingPts.length; ++tp) {
                if(matchingPts[tp]==false) {
                    var closestPt = null;
                    for(let i =0; i < funcValPairs.length; ++i) {
                        if(funcValPairs[i].x==testPts[tp].x) {
                            closestPt = funcValPairs[i];
                            break;
                        }
                    }
                    if(closestPt !=null) {
                        let dist = Math.sqrt((testPts[tp].x-closestPt.x)*(testPts[tp].x-closestPt.x) + (testPts[tp].y-closestPt.y)*(testPts[tp].y-closestPt.y))
                        if(dist <=tolerance) {
                            ++successNum;
                            matchingPts[tp] = true;
                            break;
                        }
                    }
                }
            }
        }
        return successNum/testPts.length;
    }
}