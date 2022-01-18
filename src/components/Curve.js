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
                segments.push(items.slice(d*segmentLen, rem+ segmentLen*(d+1)));
            }
            else {
                if(remAdded) {
                    segments.push(items.slice(d*segmentLen+rem, segmentLen*(d+1)+rem));
                }
                else {
                    segments.push(items.slice( d*segmentLen, segmentLen*(d+1) ));
                }   
            }
        } 
    }
    else {
        for(let d=0; d<k; ++d) {
            segments.push(this.pts.slice(d*segmentLen,segmentLen*(d+1)));
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
        this.getSlopes = this.getSlopes.bind(this);
        this.getXRange = this.getXRange.bind(this);
        this.optimizeCurve = this.optimizeCurve.bind(this);
        


        this.equationId = equationId;

        this.subCurves = [];

        this.pts = pts;
        this.N = this.pts.length;
        this.xVals = this.pts.map(a=>a.x);
        this.yVals = this.pts.map(a=>a.y);
        
        
        this.currentEquationStr = this.curveData.equationStr;       //you would call geval/eval on this variable in another module
        this.currentEquationName = this.curveData.equationName;
        this.equationOrder = this.curveData.equationOrder;

        this.xRange = this.getXRange(0,this.pts.length);
        this.xMin = this.xRange[0];
        this.xMax = this.xRange[1];


        this.optimizeCurve();
        
        
    }
    
    optimizeCurve(stdDevThreshold=1.5) {
        this.slopeSteps = this.getSlopes();      //the slopes between each consecutive point in the curve
        var slopeStdDev = getStdDev(this.slopeSteps);   //the std-deviation of the the slopes


        //divide slope points in half. if standard deviation is still high, then divide into quarters, then into eighths etc 

        var numSegments = 2;
        
        var slopeStdDev = getStdDev(this.slopeSteps);   //the std-deviation of the the slopes
        var isOptimal = slopeStdDev <= stdDevThreshold;
        
        var currentN = this.N;
        
        var currentRange = [0,this.N];
        var segmentLen = Math.floor((currentRange[1]-currentRange[0])/numSegments);
        var optimalSegments = [];
        
       

        
        if(currentN%numSegments==0) {           //segments are divided perfectly
            var segments = partitionItems(this.slopeSteps.slice(currentRange[0], currentRange[1]), numSegments)
            //segments is an array of partitions of the curve's slopes (still in order)
            var segmentResults = [];
            for(let seg =0; seg < segments.length; ++seg) {

                let stdDev = getStdDev(segments[seg])
                let subIsOptimal = false;
                if(stdDev <= stdDevThreshold) {
                    subIsOptimal = true;
                }
                segmentResults.push({idx:seg, status:subIsOptimal, segmentRange:segments[seg]})
            }
            for(let resultSeg=0; resultSeg < segmentResults.length; ++resultSeg) {
                if(segmentResults[resultSeg].status) {
                    //save this segment since the stdDev of its slopes were below threshold!!
                    
                }
                else  {
                    //further divide this segment into more sub segments!!
                }
            }

           
        }


        //experimental for unevenly divided
        else {          
            //for when points in each segment are NOT evenly divided
            //try every combination of remainder position, see which results in the least std-dev
            var oddResults = []
            for(let remPos=0; remPos < numSegments; ++remPos) {
                
                var segments = partitionItems(this.slopeSteps.slice(currentRange[0], currentRange[1]), numSegments,remPos)
                var subIsOptimal = true;
                for(let seg =0; seg < segments.length; ++seg) {
                    let stdDev = getStdDev(segments[seg])
                    if(stdDev > stdDevThreshold) {
                        subIsOptimal = false
                        break;
                    }
                }
                if(subIsOptimal) oddResults.push([stdDev,segments])
            }
            oddResults.sort(function(a,b){return a-b});
            optimalSegments.push(oddResults[0][1])
        }
        numSegments+=1;
        if(numSegments >= (currentRange[1]-currentRange[0])) break;
        
        
        this.curveData = this.testLagrangePolyString();
    }

    getXRange(xVals) {
        var xMin=99;
        var xMax = 0;
        for(let x=0; x < xVals.length; ++x) {
            if(xVals[x] > xMax) xMax = xVals[x];
            if(xVals[x] < xMin) xMin = xVals[x];
        }
        return [xMin, xMax]
    }

    getSlopes() {
        var slopes = [];
        var mappedFunc = []
        for(let x=0; x < this.xVals.length; ++x) {
            mappedFunc.push([this.xVals[x],this.yVals[x]])
        }

        var outputs = Object.fromEntries(mappedFunc);
        var sortedXVals = [...this.xVals].sort(function(a,b){return a-b});

        let lastX = 0;
        let lastY = 0;
        for(let x=0; x < sortedXVals.length; ++x) {
            let thisX = sortedXVals[x];
            let thisY = outputs[thisX];
            slopes.push((thisY-lastY)/(thisX-lastX))

            lastX = thisX;
            lastY = thisY;
        }

        return slopes;

    }

    testLagrangePolyString(range=null) {
        //range[0] is xMin
        //range[1] is xMax
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
        console.log("match likelihood: ", successNum/testPts.length);
        console.log("matchingPts", matchingPts)
        return successNum/testPts.length;
    
    }
}

