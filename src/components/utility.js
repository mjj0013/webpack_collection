export function partitionItems(items,k,remPos = 0) {
    //splits items into k segments and returns array of partitions
    //if there's a remainder, there is option to adjust where the remainder will be placed in the partitions.
    var segments = []
    var N = items.length;
    var segmentLen = Math.floor(N/k)
    if(N%k!=0) {
        var rem = N%k, remAdded = false;
        for(let d=0; d<k; ++d) {
            if(d==remPos) {
                remAdded = true;
                segments.push({ indexRange:[d*segmentLen, rem+ segmentLen*(d+1)], vals:items.slice(d*segmentLen, rem+ segmentLen*(d+1)) });
            }
            else {
                if(remAdded)  segments.push({ indexRange:[d*segmentLen+rem,segmentLen*(d+1)+rem], vals:items.slice(d*segmentLen+rem, segmentLen*(d+1)+rem)  });
                else  segments.push({ indexRange:[d*segmentLen, segmentLen*(d+1)], vals:items.slice( d*segmentLen, segmentLen*(d+1) )});
            }
        } 
    }
    else {
        for(let d=0; d<k; ++d) {  segments.push({ indexRange:[d*segmentLen, segmentLen*(d+1)], vals:items.slice(d*segmentLen,segmentLen*(d+1))}); }   
    }
    return segments;
}

export function loadTextFile(e) {
    const txt_file=document.getElementById('paragraph');
    txt_file.src = URL.createObjectURL(e.target.files[0]);
    const client = new XMLHttpRequest();
    client.onreadystatechange = function() {
        console.log(client.readyState);
        if(client.readyState==4) {
            if(client.status== 200) console.log(client.responseText);
            if(client.status== 404) console.log('File or resource not found');
        }
    };
    client.open('GET', e.target.files[0], true);
    client.send();
    return client;
}

export function replaceAll(str,find,replace) {return str.replace(new RegExp(find.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'), 'g'), replace)};
export function radians_to_degrees(radians) {return radians * (Math.PI/180);}
export function det(a,b,c,d) {return a*d - b*c;}

export function crossProduct(vectA, vectB) {
    let vectA_dx = vectA[1][0]-vectA[0][0];
    let vectA_dy = vectA[1][1]-vectA[0][1];
    let vectB_dx = vectB[1][0]-vectB[0][0];
    let vectB_dy = vectB[1][1]-vectB[0][1];
    let magVectA = Math.sqrt((vectA_dx)*(vectA_dx) + (vectA_dy)*(vectA_dy));
    let magVectB = Math.sqrt((vectB_dx)*(vectB_dx) + (vectB_dy)*(vectB_dy));
    let angleAB = Math.atan2(vectA_dy, vectA_dx) - Math.atan2(vectB_dy, vectB_dx);
    return magVectA*magVectB*Math.sin(angleAB);
}
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

export function numberInRange(number, target, degreeOfTolerance) {
    return (number>=(target-degreeOfTolerance) && number<=(target+degreeOfTolerance)); 
}


export function distance(A,B) {
    return Math.sqrt((A.x - B.x)*(A.x - B.x) + (A.y - B.y)*(A.y - B.y))
}

export function getStdDev(allItems) {
    var totalNum = allItems.length,  total=0;
    for(let i =0; i < allItems.length; ++i) total+=allItems[i];
    var average = total/totalNum, summation = 0;
    for(let i =0; i < allItems.length; ++i) {
        summation += (allItems[i]-average)*(allItems[i]-average)
    }
    return Math.sqrt(summation/(totalNum-1));
}

var preCalcFactorials = [1,1,2,6,24,120, 720, 5040, 40320, 362880,39916800, 479001600, 6227020800, 87178291200]
export function binomialCoeff(n,i) {
    if(n > 13 || i > 13) return -1;
    var nFact = preCalcFactorials[n];
    var iFact = preCalcFactorials[i];
    var diffFact = preCalcFactorials[n-i];
    return nFact/(iFact*diffFact);
}



//NOTE: BEZIER PARAMETRIC FUNCTIONS BELOW ARE NOT THE SAME AS THE LAGRANGE POLYNOMIAL!!
export function getBezierParametricFunctions(order) {
    // https://stackoverflow.com/questions/5634460/quadratic-b%c3%a9zier-curve-calculate-points
    // For calculating point on Cubic bezier x(t) and y(t), 0 <= t <= 1 :
        //  x(t) = (1-t)*(1-t)*(1-t)*p[0].x + 3*(1-t)*(1-t)*t*p[1].x + 3*(1-t)*t*t*p[2].x + t*t*t*p[3].x
        //  y(t) = (1-t)*(1-t)*(1-t)*p[0].y + 3*(1-t)*(1-t)*t*p[1].y + 3*(1-t)*t*t*p[2].y + t*t*t*p[3].y
        //p[0] --> starting point,  p[1] --> control point,  p[2] --> control point,  p[3] --> end point

    var xTerms = [], yTerms = [];
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
    eval(`var bezierParametric${order} = (t, pts) => { let xVal = ${xTerms.join(` + `)}; let yVal = ${yTerms.join(` + `)}; return {x:xVal, y:yVal} }`)
    return {func:`bezierParametric${order}`, order: order};
}