import { Matrix, solve } from 'ml-matrix';
import {distanceSquared} from './utility.js'           //distance, numberInRange, 
export class Curve {
    constructor(pts,equationId,order=2,anchor=null, xLimit=null, yLimit=null) {
        this.fitCurveToPts = this.fitCurveToPts.bind(this);
        this.getXRange = this.getXRange.bind(this);
        this.currentMidpointX = this.currentMidpointX.bind(this);
        this.currentDerivative = this.currentDerivative.bind(this);
        this.generateLagrangePolyString = this.generateLagrangePolyString.bind(this);
        this.split = this.split.bind(this);
        this.getCurrentLength = this.getCurrentLength.bind(this);
        this.getCurrentSlope = this.getCurrentSlope.bind(this);
        this.evaluate = this.evaluate.bind(this);
        
        this.equationId = equationId;
        this.pts = pts;
        this.N = this.pts.length;
        this.xVals=[];
        this.yVals=[];
        for(let pt=0; pt < this.pts.length; ++pt) {
            this.xVals.push(this.pts[pt].x);
            this.yVals.push(this.pts[pt].y);
        }
        this.xLimit = xLimit;
        this.yLimit = yLimit;
        this.xRange = this.getXRange([0,this.pts.length]);
        this.xMin = this.xRange[0];
        this.xMax = this.xRange[1];
        this.order = order
        this.anchor = anchor
        this.currentCoeffs = [];
        this.P1 = null;
        this.P2 = null;
        
        this.curveData = this.fitCurveToPts(pts,order,anchor)
        this.currentEquationStr = this.curveData.equationStr;       //you would call geval/eval on this variable in another module
        this.currentEquationName = this.curveData.equationName;
        this.equationOrder = this.curveData.equationOrder;

        this.timesSplit = 0;

    }

        
    
    evaluate(x) {           // this should replace the eval(<str>) method, which is problematic
        var result = this.currentCoeffs[0];
        for(let coeff=1; coeff < this.currentCoeffs.length; ++coeff) {
            result += this.currentCoeffs[coeff]*Math.pow(x,coeff);
        }
        // if(this.yLimit) {
        //     if(this.yLimit[0]) {
        //         if(this.yLimit[0] > result) result = this.yLimit[0];
        //     }
        //     if(this.yLimit[1]) {
        //         if(this.yLimit[1] < result) result = this.yLimit[1];
        //     }
        // }
        return result;
    }
   

    getCurrentSlope() {
        var slope = Math.round(this.P2.y-this.P1.y)/Math.round(this.P2.x-this.P1.x);
        if(slope==Infinity) return 'vertical'
        else if(slope==0) return 'horizontal'
        else return slope;
    }

    getCurrentLength() {
        //integral( mag(d/dx curve)) from 0 to 1
        return Math.sqrt(((this.P2.x-this.P1.x)*(this.P2.x-this.P1.x)) + ((this.P2.y-this.P1.y)*(this.P2.y-this.P1.y)))
    }


    split(splitPt) {
        if(this.getCurrentSlope() == "vertical") {
            // fix the limits here to improve the curve segmenting problem
            // there should be way to specify new minimums and maximums when splitting
            var curve1 = new Curve(this.pts, this.equationId+"_1", 2, null,null,  [this.P1.y,splitPt.y])         //splitPt.y is a maximum
            var curve2 = new Curve(this.pts, this.equationId+"_2", 2, null,null,  [splitPt.y,this.P2.y] )        //splitPt.y is a minimum
            return [curve1, curve2]
        }
        else {
            let lowerLimitX1 = 0
            let upperLimitX1 = 0
            let lowerLimitY1 = 0
            let upperLimitY1 = 0

            let lowerLimitX2 = 0
            let upperLimitX2 = 0
            let lowerLimitY2 = 0
            let upperLimitY2 = 0

            if(this.P1.x > splitPt.x && splitPt.x > this.P2.x) {
                lowerLimitX1 = this.P2.x
                upperLimitX1 = splitPt.x-5
                lowerLimitX2 = splitPt.x+5
                upperLimitX2 = this.P1.x
            }
            else if(this.P2.x > splitPt.x && splitPt.x > this.P1.x) {
                lowerLimitX1 = this.P1.x
                upperLimitX1 = splitPt.x-5
                lowerLimitX2 = splitPt.x+5
                upperLimitX2 = this.P2.x
            }
            if(this.P1.y > splitPt.y && splitPt.y > this.P2.y) {
                lowerLimitY1 = this.P2.y
                upperLimitY1 = splitPt.y-5
                lowerLimitY2 = splitPt.y+5
                upperLimitY2 = this.P1.y
            }
            else if(this.P2.y > splitPt.y && splitPt.y > this.P1.y ) {
                lowerLimitY1 = this.P1.y
                upperLimitY1 = splitPt.y-5
                lowerLimitY2 = splitPt.y+5
                upperLimitY2 = this.P2.y
            }

            var curve1 = new Curve(this.pts, this.equationId+"_1", 2, null,  [lowerLimitX1, upperLimitX1], [lowerLimitY1, upperLimitY1] )        //splitPt.x is a maximum
            var curve2 = new Curve(this.pts, this.equationId+"_2", 2, null,  [lowerLimitX2, upperLimitX2], [lowerLimitY2, upperLimitY2] )       //splitPt.x is a minimum
           
            return [curve1, curve2];
        }
    }

    async fitCurveToPts(clusterPts, order=2, anchor=null) {       //use Method of Least Square to find a curve that fits points, not using Lagrange polynomial
        //https://www.youtube.com/watch?v=-UJr1XjyfME&ab_channel=Civillearningonline

        //******************* decide when to use cubic or quadratic *******************
        return new Promise((resolve, reject)=>{
            console.log("Method of Least squares generated")
            var n = clusterPts.length;
            var xVals = [];
            var yVals = [];
            var xyVals = [];
            var xxyVals = [];
            var xxVals = [];
            var xxxVals = [];
            var xxxxVals = [];
            for(let i=0; i < n; ++i) {
                let xy = (clusterPts[i].x)*(clusterPts[i].y);
                let xx = (clusterPts[i].x)*(clusterPts[i].x);
                xVals.push(clusterPts[i].x);
                yVals.push(clusterPts[i].y);
                xyVals.push(xy);
                xxyVals.push(xx*clusterPts[i].y);
                xxVals.push(xx);
                xxxVals.push(xx*clusterPts[i].x);
                xxxxVals.push(xx*xx);
            }
            var xSum = 0, ySum = 0, xySum = 0, xxySum = 0, xxSum = 0, xxxSum = 0, xxxxSum = 0;
            for(let i=0; i < n; ++i) {
                xSum += xVals[i];
                ySum += yVals[i];
                xySum += xyVals[i];
                xxySum += xxyVals[i];
                xxSum += xxVals[i];
                xxxSum += xxxVals[i];
                xxxxSum += xxxxVals[i];
            }
            var X,Y;
            if(order==2) {  // fits QUADRATIC curve to data. i.e c*x^2 + b*x + a
                X = new Matrix([[n, xSum, xxSum] , [xSum, xxSum, xxxSum], [xxSum, xxxSum, xxxxSum]]);
                Y = Matrix.columnVector([ySum, xySum, xxySum]);
            }
            else if(order==3) { // fits CUBIC curve to data. i.e d*x^3 + c*x^2 + b*x + a
                var xxxySum =0 , xxxxxSum=0, xxxxxxSum=0;
                for(let i=0; i < clusterPts.length; ++i) {
                    let xx = clusterPts[i].x*clusterPts[i].x
                    xxxySum += xx*clusterPts[i].x*clusterPts[i].y;
                    xxxxxSum += xx*xx*clusterPts[i].x;
                    xxxxxxSum += xx*xx*xx
                }
                X = new Matrix([[n, xSum, xxSum, xxxSum] , [xSum, xxSum, xxxSum, xxxxSum], [xxSum, xxxSum, xxxxSum,xxxxxSum], [xxxSum, xxxxSum, xxxxxSum,xxxxxxSum]]);
                Y = Matrix.columnVector([ySum, xySum, xxySum, xxxySum]);
            }
            else return -1;
            var coeffs = solve(X,Y,true);
            var a = coeffs.get(0,0);
            var b = coeffs.get(1,0);
            var c = coeffs.get(2,0);
            this.currentCoeffs = [a,b,c]

            //cubic
            if(order==3) {
                this.currentCoeffs.push(coeffs.get(3,0));
            }
            // var tempFunc = (x) =>{return (x-anchor?anchor.x:0)*(x-anchor?anchor.x:0)*this.currentCoeffs[2] + (x-anchor?anchor.x:0)*this.currentCoeffs[1] + (anchor?anchor.y:0 - this.currentCoeffs[0])}
            var tempFunc = (x) =>{return (x)*(x)*this.currentCoeffs[2] + (x)*this.currentCoeffs[1] + (this.currentCoeffs[0])}
        
            
            this.P1 = {x:this.xMin, y:tempFunc(this.xMin)}
            this.P2 = {x:this.xMax, y:tempFunc(this.xMax)}
        
            var curveObj = {xRange:this.xRange,equationOrder:order}
            console.log("curveObj",curveObj)
            resolve(curveObj);
        })
    }

    currentDerivative(x, order=1) {
        //order means the nth derivative
        var getDeriv = (A) => {
            var tempCoeffs = [];
            for(let coeff=1; coeff< A.length; ++coeff) {
                tempCoeffs.push(A[coeff]*coeff);
            }
            return tempCoeffs;
        }
        var temp = [...this.currentCoeffs]
        for(let o=0; o < order; ++o) {
            temp = getDeriv(temp);
        }

        var result = 0;
        for(let c=0; c < temp.length; ++c) {
            result += Math.pow(x,c)*temp[c]
        }
        return result;
    }
    currentMidpointX() {
        let c = this.currentCoeffs[2];
        let b = this.currentCoeffs[1];
        return -b/(2*c);
    }

    getXRange(range) {
        var xMin=999999, xMax = -999999;
        for(let x=range[0]; x < range[1]; ++x) {
            xMax = this.xVals[x] > xMax? this.xVals[x] : xMax;
            xMin = this.xVals[x] < xMin? this.xVals[x] : xMin;
        }
        if(this.xLimit) {
            if(this.xLimit[0]) xMin = this.xLimit[0]
            if(this.xLimit[1]) xMax = this.xLimit[1]
        }
        return [xMin, xMax]
    }

    generateLagrangePolyString(pts) {
        var terms = [];
        for(let p=0; p < pts.length; ++p) {
            var numerator=`${this.yVals[p]}`
            var denominator = 1;
            for(let pk=0; pk < pts.length; ++pk) {
                if(p==pk) continue;
                numerator += `*(x - ${this.xVals[pk]})`
                denominator *= (this.xVals[p]-this.xVals[pk]);
            }
            terms.push("("+numerator+`/${denominator}`+")")
        }
        var equation = `var curvePoly${this.equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        var curveObj = {xRange:this.xRange,equationOrder:2, equationStr:equation, equationName:`curvePoly${this.equationId.toString()}`}
        return curveObj;
    }
}