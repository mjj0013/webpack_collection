import { Matrix, solve } from 'ml-matrix';
import {distanceSquared} from './utility.js'           //distance, numberInRange, 
export class Curve {
    constructor(pts,equationId,order=2) {
        this.fitCurveToPts = this.fitCurveToPts.bind(this);
        this.getXRange = this.getXRange.bind(this);

        this.equationId = equationId;
        this.pts = pts;
        this.N = this.pts.length;
        this.xVals = this.pts.map(a=>a.x);
        this.yVals = this.pts.map(a=>a.y);
       
        this.xRange = this.getXRange([0,this.pts.length]);
        this.xMin = this.xRange[0];
        this.xMax = this.xRange[1];
        this.currentCoeffs = [];
        
        
        this.currentMidpointX = this.currentMidpointX.bind(this);
        this.currentDerivative = this.currentDerivative.bind(this);
        this.P1 = null;
        this.P2 = null;
        this.curveData = this.fitCurveToPts(pts,order);
        this.currentEquationStr = this.curveData.equationStr;       //you would call geval/eval on this variable in another module
        this.currentEquationName = this.curveData.equationName;
        this.equationOrder = this.curveData.equationOrder;
        

        this.findIntersection = this.findIntersection.bind(this);
    }


    findIntersection(otherCurve) {
        var intersection = null
        eval(this.currentEquationStr)
        eval(otherCurve.currentEquationStr)

        var thisFunc = eval(this.currentEquationName)
        var otherFunc = eval(otherCurve.currentEquationName)

        var numIntersections = 0;

        for(let x=this.xMin; x <= this.xMax; x+=1) {
            if(Math.round(thisFunc(x))==Math.round(otherFunc(x))) {
                intersection = {x:x, y:thisFunc(x)};
                ++numIntersections
            }
        }
        if(intersection==null) {
            for(let x=otherCurve.xMin; x <= otherCurve.xMax; x+=1) {
                if(Math.round(thisFunc(x))==Math.round(otherFunc(x))) {
                    intersection = {x:x, y:thisFunc(x)};
                    ++numIntersections
                }
            }
        }
        
        intersection["overlapRatio"] = numIntersections/(this.xMax-this.xMin);
        
        


        return intersection;
    }
    fitCurveToPts(clusterPts, order=2) {       //use Method of Least Square to find a curve that fits points, not using Lagrange polynomial
        //https://www.youtube.com/watch?v=-UJr1XjyfME&ab_channel=Civillearningonline
        
        var n = clusterPts.length;

        var xVals = [];
        var yVals = [];
        var xyVals = [];
        var xxyVals = [];
        var xxVals = [];
        var xxxVals = [];
        var xxxxVals = [];
        for(let i=0; i < n; ++i) {
            let xy = clusterPts[i].x*clusterPts[i].y;
            let xx = clusterPts[i].x*clusterPts[i].x;
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
        var terms = [`(${a})`, `(${b}*x)`,`(${c}*x*x)`] //quadratic

        this.currentCoeffs = []
        this.currentCoeffs.push(a);
        this.currentCoeffs.push(b);
        this.currentCoeffs.push(c);
        
       
        //cubic
        if(order==3) {
            terms.push(`(${coeffs.get(3,0)}*x*x*x)`)
            this.currentCoeffs.push(coeffs.get(3,0));
        }
        var tempFunc = (x) =>{return x*x*this.currentCoeffs[2] + x*this.currentCoeffs[1] + this.currentCoeffs[0]}
        var equation = `var curvePoly${this.equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        
       
        this.P1 = {x:this.xMin, y:tempFunc(this.xMin)}
        this.P2 = {x:this.xMax, y:tempFunc(this.xMax)}
       
        var curveObj = {xRange:this.xRange,equationOrder:order, equationStr:equation, equationName:`curvePoly${this.equationId.toString()}`}
        return curveObj;
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

        // let c = this.currentCoeffs[2];
        // let b = this.currentCoeffs[1];
        // return b+(2*c*x);
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
        return [xMin, xMax]
    }
    
}