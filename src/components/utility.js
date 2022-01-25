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