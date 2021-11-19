import React, {useState} from 'react';
import { List, Pagination, Header, Container, Divider, Icon } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";



// export function imageReader(canvas, addr=null, filterInfo=null) {
//     //from https://www.youtube.com/watch?v=-AR-6X_98rM&ab_channel=KyleRobinsonYoung

//     //filterInfo will be object:    ex: {type:"gauss", kernelLength:5, sig:1}
//     var kernelObj = null;
//     if(filterInfo) {
//         let filterLength = filterInfo.kernelLength ? filterInfo.kernelLength : 5;
//         let filterSig = filterInfo.sig ? filterInfo.sig : 5;
//         if(filterInfo.type == "gauss") {
//             kernelObj = gaussianFilter(filterLength, filterSig);
//         }
//     }


//     var input = addr;
//     if(addr==null) {
//         input = document.querySelector('input[type="file"]');
//         console.log("input",input);
//     }
    
//     const file = document.querySelector('input[type=file]').files[0];
//     const reader = new FileReader();
//     var context = canvas.getContext("2d");

//     reader.addEventListener("load", function () {
//         const img = new Image();
//         img.onload = function() {
//             // /var canvas=document.createElement("canvas");
//             console.log("ieiewoqijfidsf");
            
//             context.drawImage(img,0,0);

//             var imageData = context.getImageData(0,0,canvas.width,canvas.height);
//             var data = imageData.data;

//             if(filterInfo) {
//                 for(var imgX=kernelObj.kernelRadius; imgX < data.length; imgX+=4) {       //increment by 4 because its RGBA values
//                     for(var imgY=kernelObj.kernelRadius; imgY < data.length; imgY+=4) {       //increment by 4 because its RGBA values
//                         // let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];
//                         let R = 0;
//                         let G = 0;
//                         let B = 0;
//                         for(var kX=-kernelObj.kernelRadius; kX < kernelObj.kernelRadius; ++kX) {       //increment by 4 because its RGBA values
//                             for(var kY=-kernelObj.kernelRadius; kY < kernelObj.kernelRadius; ++kY) {       //increment by 4 because its RGBA values
//                                 let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];

//                                 console.log(data[imgX-kX])
//                                 //console.log("imageData[imgX-kX][imgY-kY]", data[imgX-kX][imgY-kY]);
//                                 R += data[imgX-kX][imgY-kY][0]*value;
//                                 G += data[imgX-kX][imgY-kY][1]*value;
//                                 B += data[imgX-kX][imgY-kY][2]*value;
//                             }
//                         }
//                         imageData.data[imgX][imgY][0] = R;
//                         imageData.data[imgX][imgY][1] = G;
//                         imageData.data[imgX][imgY][2] = B;
//                     }
//                 }
//             }
//             context.putImageData(imageData);
//             console.log(imageData);
//         }
//         img.src = reader.result;
        
//       }, false);
    
//     if (file) {
//         reader.readAsDataURL(file);
//     }

    
    
// }

class FileManipPage extends React.Component {
    constructor(props) {
        super(props);
        this.loadText= this.loadText.bind(this);
        this.numOfPagesChanged= this.numOfPagesChanged.bind(this);
        this.state = {num:''};
        this.loadImage = this.loadImage.bind(this);
    }

    async loadText(e) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text=(e.target.result);
            const words  = text.split(' ');


            words.forEach((w) => {
                document.getElementById("fileText").value += w;
                document.getElementById("fileText").value += " ";
            });            
        };
        reader.readAsText(e.target.files[0]);
    }

    numOfPagesChanged(e) {
        this.setState({num: e.target.value});
        
    }
    loadImage(e) {
		var newImg = document.createElementNS("http://www.w3.org/2000/svg", 'image');
		newImg.setAttribute("filter","url(#edgeFilter)");

		const reader = new FileReader();
		//const file = document.querySelector('input[type=file]').files[0];
        const file = document.getElementById("imgFile").files[0];
		reader.addEventListener("load", function () {
			newImg.setAttribute("href",reader.result);
		}, false);
		if(file) reader.readAsDataURL(file)
		
		document.getElementById("mainSVG").append(newImg);
	}
   
    render() {
        return (
            <Layout title="File Loading Page" description="Description about file">
                
                <Header as="h3">Header about file loading</Header>
                <Container id="textFileLoader">
                    <label htmlFor="numOfPages" value='1'>Number of Pages: </label>
                    <select id="numOfPages" onChange={this.numOfPagesChanged}>
                        <option value='1'>1</option>
                        <option value='2'>2</option>
                        <option value='3'>3</option>
                        <option value='4'>4</option>
                        <option value='5'>5</option>
                        <option value='6'>6</option>
                        <option value='7'>7</option>
                    </select>

                    <label htmlFor="files">Choose text file: </label>
                    <input type="file" id="files" onChange={this.loadText}></input>
   
                </Container>  
                <Divider />
                
                <textarea id="fileText" cols='100' rows='30'></textarea>
                <Divider />
                <Container id="imageFileLoader">
                    <label htmlFor="imgFile">Choose image file: </label>
                    <input type="file" id="imgFile" onChange={this.loadImage}></input>
                </Container>
                <svg id="mainSVG" width="600" height="600" viewBox="0 0 1000 1000"> 
					<filter id="edgeFilter">
						<feGaussianBlur result="blur" in="SourceGraphic" stdDeviation="1" />
						<feBlend in="SourceGraphic" in2="blur" mode="difference" />
					</filter>
				</svg>
                
            </Layout>
      );


    }
}
export default FileManipPage;

	
