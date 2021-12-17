import React, {useState} from 'react';
import { List, Pagination, Header, Container, Divider, Icon } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";
import { documentElement } from 'min-document';


function imageReader(imgId) {
    var mappedEdges = [];   
    /*
    will contain objects of form 
    {
        pts:[{x:x, y:y}, ...],
        id:"",
        
    }
    */
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = document.getElementById(imgId);
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0 );
    var data = context.getImageData(0, 0, img.width, img.height);
    
    //looks at each pixel at (x,y)
    for(var imgX=0; imgX < data.length; imgX+=4) {       //increment by 4 because its RGBA values
        for(var imgY=0; imgY < data.length; imgY+=4) {       //increment by 4 because its RGBA values
            

            //try: moving the window below throughout image and calculating the density of white pixels in the window
                //if the density is >= a specific value, then add a point there to put in a path.
            //looking at neighboring pixels of pixel at (x,y)
            for(var kX=-kernelObj.kernelRadius; kX < kernelObj.kernelRadius; ++kX) {       //increment by 4 because its RGBA values
                for(var kY=-kernelObj.kernelRadius; kY < kernelObj.kernelRadius; ++kY) {       //increment by 4 because its RGBA values
                    let value = kernelObj.kernel[kX+kernelObj.kernelRadius][kY+kernelObj.kernelRadius];

                    // data[imgX][imgY][0] = R;
                    // data[imgX][imgY][1] = G;
                    // data[imgX][imgY][2] = B;
                    // data[imgX][imgY][3] = A;
                    
                    data[imgX-kX][imgY-kY][0]*value;
                    data[imgX-kX][imgY-kY][1]*value;
                    data[imgX-kX][imgY-kY][2]*value;
                }
            }
        }
    }   
}

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
        var testImgElement = document.getElementById("testImg");
        testImgElement.setAttribute("filter","url(#edgeFilter)")
        

        const reader = new FileReader();
        const file = document.getElementById("imgFile").files[0];
	
        reader.onload = function() {
            testImgElement.src = reader.result;
        }
		if(file) reader.readAsDataURL(file)

        imageReader("testImg");       

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
                
                <svg id="mainSVG" style={{display:"none"}} width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"> 
					<filter id="edgeFilter" color-interpolation-filters="sRGB">
                    
                        <feComponentTransfer result="colorTransfer1">
                                <feFuncR type="gamma" amplitude="25" exponent="5">
                                    <animate attributeName="exponent" attributeType="XML" from={5} to={25} dur="4s" start="0s" repeatCount="indefinite" />
                                </feFuncR>
                                <feFuncG type="gamma" amplitude="25" exponent="5">
                                    <animate attributeName="exponent" attributeType="XML" from={5} to={25} dur="4s" start="0s" repeatCount="indefinite"/>
                                </feFuncG>
                                <feFuncB type="gamma" amplitude="25" exponent="5">
                                    <animate attributeName="exponent" attributeType="XML" from={5} to={25} dur="4s" start="0s" repeatCount="indefinite"/>
                                </feFuncB>
                                <feFuncA type="gamma" amplitude="25" exponent="5"/>
                        </feComponentTransfer>
                        <feComponentTransfer in="colorTransfer1" result="colorTransfer2">
                                <feFuncR type="discrete" tableValues="0 254 255" />
                                <feFuncG type="discrete" tableValues="0 254 255" />
                                <feFuncB type="discrete" tableValues="0 254 255"  />
                                <feFuncA type="discrete" tableValues=".9 1" />

                        </feComponentTransfer>
                        <feColorMatrix in="colorTransfer2" result="blackandwhite" type="matrix" 
                        values="0.3333 0.3333 0.3333 0 0
                                0.3333 0.3333 0.3333 0 0
                                0.3333 0.3333 0.3333 0 0
                                0       0       0    1 0" />

                        
                        <feGaussianBlur result="blur" in="blackandwhite" stdDeviation="1"></feGaussianBlur>
                        <feBlend in="blackandwhite" in2="blur" result="edges" mode="difference" />

                        <feGaussianBlur result="blur2" in="edges" stdDeviation="1"></feGaussianBlur>
                       
					</filter>
				</svg>
                <img id="testImg" width={1000} height={1000} style={{top:window.screen.clientHeight,position:"absolute",display:"block", border:"1px solid black", filter:"url(#edgeFilter)"}} />
                
                {/* <iframe style={{filter:"url(#edgeFilter)"}} width="560" height="315" src="https://www.youtube.com/embed/k9wRPOeUhls" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> */}
                
                
                 
            </Layout>
            
      );
    }
}
export default FileManipPage;

	
