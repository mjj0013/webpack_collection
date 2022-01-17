export function loadTextFile(e) {
    console.log("asdf");
    
    const txt_file=document.getElementById('paragraph');
    txt_file.src = URL.createObjectURL(e.target.files[0]);

    const client = new XMLHttpRequest();
    
    client.onreadystatechange = function() {
        console.log(client.readyState);
        if(client.readyState==4) {
            if(client.status== 200) {console.log(client.responseText);}
            if(client.status== 404) {console.log('File or resource not found');}
        }


    };
    client.open('GET', e.target.files[0], true);
    
    client.send();


    return client;
}





export function det(a,b,c,d) {
    return a*d - b*c;
}

export function crossProduct(vectA, vectB) {
    let vectA_dx = vectA[1][0]-vectA[0][0];
    let vectA_dy = vectA[1][1]-vectA[0][1];

    let vectB_dx = vectB[1][0]-vectB[0][0];
    let vectB_dy = vectB[1][1]-vectB[0][1];

    let magVectA = Math.sqrt((vectA_dx)*(vectA_dx) + (vectA_dy)*(vectA_dy));
    let magVectB = Math.sqrt((vectB_dx)*(vectB_dx) + (vectB_dy)*(vectB_dy));

    let angleAB = Math.atan2(vectA_dy, vectA_dx) - Math.atan2(vectB_dy, vectB_dx);
    
    let result =  magVectA*magVectB*Math.sin(angleAB);

    console.log('result', result)
    return result;


}

export function replaceAll(str,find,replace) {
    return str.replace(new RegExp(find.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'), 'g'), replace)
};


export function radians_to_degrees(radians)
{
  var pi = Math.PI;
  return radians * (pi/180);
}

export function getAvgRgbaOfImage(image_url) {
    var temp_canvas = document.createElement('canvas');
    var temp_context = temp_canvas.getContext('2d');

    var img = new Image();
    var avgR = 0;
        var avgG = 0;
        var avgB = 0;
        var avgA = 0;
    img.onload = () => {
        
        var img_w;
        var img_h; 
        var count =0;

        var blockSize = 300;
        console.log("loading");
        temp_context.drawImage(img,0,0);
        

        img_w = img.width;
        img_h = img.height;
        
        
        var imgData = temp_context.getImageData(0,0,img_w, img_h);

        var rgba_data = imgData.data;
        var arraySize = rgba_data.length;

       
        var i = 0 ;
        

        while((i + blockSize*4) < arraySize ) {
            ++count;
            
            avgR += (255-rgba_data[i]);
            avgG += (255-rgba_data[i+1]);
            avgB += (255-rgba_data[i+2]);
            
        }
        
        console.log(count);
        avgR = Math.floor(avgR/(count));
        avgG = Math.floor(avgG/(count));
        avgB = Math.floor(avgB/(count));
        avgA = 1.0;
        console.log(avgR+","+avgG+","+avgB);
        return (avgR+","+avgG+","+avgB);

    }
    img.src= image_url;
    
    

}
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



export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }


//export default loadTextFile;






