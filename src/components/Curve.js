import { Matrix, solve } from 'ml-matrix';
// import {getStdDev, partitionItems, binomialCoeff} from './utility.js'           //distance, numberInRange, 
export class Curve {
    constructor(pts,equationId,order=2) {
        this.testLagrangePolyString = this.testLagrangePolyString.bind(this);
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

        this.curveData = this.fitCurveToPts(pts,order);
        this.currentEquationStr = this.curveData.equationStr;       //you would call geval/eval on this variable in another module
        this.currentEquationName = this.curveData.equationName;
        this.equationOrder = this.curveData.equationOrder;
        this.currentCoeffs = [];
    }

    fitCurveToPts(clusterPts, order=2) {       //use Method of Least Square to find a curve that fits points, not using Lagrange polynomial
        //https://www.youtube.com/watch?v=-UJr1XjyfME&ab_channel=Civillearningonline
        
        var n = clusterPts.length;
        var xVals = clusterPts.map(a=>a.x);
        var yVals = clusterPts.map(a=>a.y);
        var xyVals = clusterPts.map(a=>a.x*a.y);
        var xxyVals = clusterPts.map(a=>a.x*a.x*a.y);
        
        var xxVals = clusterPts.map(a=>a.x*a.x);
        var xxxVals = clusterPts.map(a=>a.x*a.x*a.x);
        var xxxxVals = clusterPts.map(a=>a.x*a.x*a.x*a.x);
        
        var xSum = xVals.reduce(function(a, b) { return a + b; }, 0);
        var ySum = yVals.reduce(function(a, b) { return a + b; }, 0);
        var xySum =  xyVals.reduce(function(a, b) { return a + b; }, 0);
        var xxySum = xxyVals.reduce(function(a, b) { return a + b; }, 0);
        
        var xxSum =  xxVals.reduce(function(a, b) { return a + b; }, 0);
        var xxxSum = xxxVals.reduce(function(a, b) { return a + b; }, 0);
        var xxxxSum =xxxxVals.reduce(function(a, b) { return a + b; }, 0);   
        var X,Y;
        if(order==2) {  // fits QUADRATIC curve to data. i.e c*x^2 + b*x + a
            X = new Matrix([[n, xSum, xxSum] , [xSum, xxSum, xxxSum], [xxSum, xxxSum, xxxxSum]]);
            Y = Matrix.columnVector([ySum, xySum, xxySum]);
        }
        else if(order==3) { // fits CUBIC curve to data. i.e d*x^3 + c*x^2 + b*x + a
            var xxxyVals = clusterPts.map(a=>a.x*a.x*a.x*a.y);
            var xxxySum = xxxyVals.reduce(function(a, b) { return a + b; }, 0);
            var xxxxxVals = clusterPts.map(a=>a.x*a.x*a.x*a.x*a.x);
            var xxxxxxVals = clusterPts.map(a=>a.x*a.x*a.x*a.x*a.x*a.x);
            var xxxxxSum =  xxxxxVals.reduce(function(a, b) { return a + b; }, 0);
            var xxxxxxSum = xxxxxxVals.reduce(function(a, b) { return a + b; }, 0);
            X = new Matrix([[n, xSum, xxSum, xxxSum] , [xSum, xxSum, xxxSum, xxxxSum], [xxSum, xxxSum, xxxxSum,xxxxxSum], [xxxSum, xxxxSum, xxxxxSum,xxxxxxSum]]);
            Y = Matrix.columnVector([ySum, xySum, xxySum, xxxySum]);
        }
        else return -1;
        var coeffs = solve(X,Y,true);
        let a = coeffs.get(0,0);
        let b = coeffs.get(1,0);
        let c = coeffs.get(2,0);
        var terms = [`(${a})`, `(${b}*x)`,`(${c}*x*x)`] //quadratic
        this.currentCoeffs = [a,b,c]
        this.currentDerivative = (x) =>{return b+2*c*x}
        //cubic
        if(order==3) {
            terms.push(`(${coeffs.get(3,0)}*x*x*x)`)
            this.currentCoeffs.push(coeffs.get(3,0));
        }
        var equation = `var curvePoly${this.equationId.toString()} = (x) => {return `+terms.join("+")+`}`;
        var curveObj = {xRange:this.xRange,equationOrder:order, equationStr:equation, equationName:`curvePoly${this.equationId.toString()}`}
        return curveObj;
    }

    getXRange(range) {
        var xMin=999999, xMax = -999999;
        for(let x=range[0]; x < range[1]; ++x) {
            xMax = this.xVals[x] > xMax? this.xVals[x] : xMax;
            xMin = this.xVals[x] < xMin? this.xVals[x] : xMin;
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
}