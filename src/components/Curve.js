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
    // geval(`var bezierX${order} = (t, pts) => {return ()}`)
    // geval(`var bezierY${order} = (t, pts) => {return (${yTerms.join(` + `)})}`)
    
    return {func:`bezierParametric${order}`, order: order};
}

class Curve {
    constructor(curveId, pts) {
        this.testPtsOnCurve = this.testPtsOnCurve.bind(this);
        this.testLagrangePolyString = this.testLagrangePolyString.bind(this);

        this.curveId = curveId;
        this.pts = pts;
        this.curveData = this.testLagrangePolyString();
        
        this.xVals = this.pts.map(a=>a.x);
        this.yVals = this.pts.map(a=>a.y);
        
        this.currentEquationStr = this.curveData.equationStr;       //you would call geval/eval on this variable in another module
        this.currentEquationName = this.curveData.equationName;
        this.equationOrder = this.curveData.equationOrder;

        this.xRange = this.curveData.xRange;
        this.xMin = this.curveData.xRange[0];
        this.xMax = this.curveData.xRange[1];
    }
    testLagrangePolyString() {
        var terms = [];
        for(let p=0; p < this.pts.length; ++p) {
            var numerator=`${this.yVals[p]}`
            var denominator = 1;
            for(let pk=0; pk < this.pts.length; ++pk) {
                if(p==pk) continue;
                numerator += `*(x - ${this.xVals[pk]})`
                denominator *= (this.xVals[p]-this.xVals[pk]);
            }
            if(denominator==0) terms.push("(0)")
            else terms.push("("+numerator+`/${denominator}`+")")
        }
        
        var equation = `var curvePoly${equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        var result = {pts:this.pts, xRange:[leastX, mostX],equationOrder:terms.length-1, equationStr:equation, equationName:`curvePoly${equationId.toString()}`}
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

export default Curve;