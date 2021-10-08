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


export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }


//export default loadTextFile;






