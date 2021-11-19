import React, {useRef} from 'react';

import { List, Pagination, Header, Container, Divider, Icon } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";





class GraphicsPage extends React.Component {
    
   
    constructor(props) {
        super(props);
        
        this.blue = 0;
        this.red = 0;
        this.green= 0;
        
        this.blueTarget = 255;
        this.greenTarget = 255;
        this.redTarget = 255;
        
        this.moveColors = this.moveColors.bind(this);
        this.draw = this.draw.bind(this);
        this.moveCurves = this.moveCurves.bind(this);
        this.clearWorld = this.clearWorld.bind(this);

        
        this.canvasRef = React.createRef();

        this.redCurve = {
            startDx:1, startDy:1, 
            endDx:15, endDy:15, 
            startX:100, startY:100, 
            control1X:25, control1Y:75, 
            control2X:50, control2Y:50, 
            endX:10, endY:200
        }
        this.greenCurve = {startDx:0, startDy:0,
            endDx:0, endDy:0,  startX:0, startY:0, control1X:0, control1Y:0, control2X:0, control2Y:0, endX:0, endY:0}
        this.blueCurve = {
            startDx:0, startDy:0,
            endDx:0, endDy:0,  
            startX:0, startY:0, 
            control1X:0, control1Y:0, 
            control2X:0, control2Y:0, 
            endX:0, endY:0
        }
        

        


    }
    clearWorld = () => {
        //this.canvasRef.current.getContext('2d').clearRect(0,0,this.canvasRef.current.width, this.canvasRef.current.height);
        this.context.fillStyle = 'white'
        this.context.fillRect(0,0,this.canvasRef.current.width,this.canvasRef.current.height);


        //this.contextRef.current.fillRect(0,0,1000,1000);
    }
    

    componentDidMount() {
        this.context = this.canvasRef.current.getContext('2d');   // use { alpha: false } to optimize
        setInterval(() => {
            this.clearWorld();
            this.moveColors();
            this.moveCurves();
            
            this.draw();

        }, 1000/60);
        
        
        
        
    }

    moveCurves() {
        
        if((this.redCurve.startX > this.canvasRef.current.width) || (this.redCurve.startX < 0)) {
            this.redCurve.startDx = -1*this.redCurve.startDx;
             
        }
        

        if((this.redCurve.startY > this.canvasRef.current.height) || (this.redCurve.startY < 0)) {
            this.redCurve.startDy = -1*this.redCurve.startDy;
        }

        if((this.redCurve.endX > this.canvasRef.current.width) || (this.redCurve.endX < 0)) {
            this.redCurve.endDx = -1*this.redCurve.endDx;
        }
        if((this.redCurve.endY > this.canvasRef.current.height) || (this.redCurve.endY < 0)) {
            this.redCurve.endDy = -1*this.redCurve.endDy;
        }


        this.redCurve.startX += this.redCurve.startDx;
        this.redCurve.startY += this.redCurve.startDy;
        this.redCurve.endX += this.redCurve.endDx;

        this.redCurve.endY += this.redCurve.endDy;

    }
    
    moveColors() {
        if(this.red ==this.redTarget) {
            if(this.redTarget == 255) {
                this.redTarget = 0;
                this.red -= 1;
            }
            else if(this.redTarget==0){
                this.redTarget = 255;
                this.red += 1;
            }
           
        } 
        else if(this.redTarget==0) {
            this.red -= 1;
        }
        else if(this.redTarget==255){
            this.red += 1;
        }
        if(this.green ==this.greenTarget) {
            if(this.greenTarget == 255) {
                this.greenTarget = 0;
                this.green -= 1;
            }
            else{
                this.greenTarget = 255;
                this.green += 1;
            }
           
        } 
        else if(this.greenTarget==0) {
            this.green -= 1;
        }
        else if(this.greenTarget==255){
            this.green += 1;
        }
        if(this.blue ==this.blueTarget) {
            if(this.blueTarget == 255) {
                this.blueTarget = 0;
                this.blue -= 1;
            }
            else{
                this.blueTarget = 255;
                this.blue += 1;
            }
           
        } 
        else if(this.blueTarget==0) {
            this.blue -= 1;
        }
        else if(this.blueTarget==255){
            this.blue += 1;
        }
       
    }
    
    

    draw() {
        
        this.context = this.canvasRef.current.getContext('2d');
        
        // const drawSelection = document.getElementById("drawSelect");
        // var baseRedVal = document.getElementById("redSlider");
        // var baseGreenVal = document.getElementById("greenSlider");
        // var baseBlueVal = document.getElementById("blueSlider");
        this.context.beginPath();
        this.context.strokeStyle = 'red';
        this.context.moveTo(this.redCurve.startX, this.redCurve.startY);
        this.context.bezierCurveTo(this.redCurve.control1X, 
                                    this.redCurve.control1Y, 
                                    this.redCurve.control2X, 
                                    this.redCurve.control2Y,
                                    this.redCurve.endX,
                                    this.redCurve.endY);
        
        this.context.stroke();


    //    if(drawSelection.value == "ColoredBox1") {
    //         var grid_length = 50;
    //         var color_gradient = (255/grid_length);

    //         //Background animation
    //         for(var i = 0; i <grid_length; ++i) {
    //             for(var j = 0; j <grid_length; ++j) {
                    
    //                 this.context.fillStyle = 'rgb(' 
    //                     + Math.floor(Math.abs(this.red%255-color_gradient*i)) +', ' 
    //                     + Math.floor(Math.abs(this.green%255-color_gradient*j)) +', '
    //                     + Math.floor(Math.abs(this.blue%255-color_gradient*j))         
    //                     +')';
    //                 this.context.fillRect(j*10,i*10,10,10);
    //             }
    //         }
            
    //         var radgrad2 = this.context.createRadialGradient(45, 45, 10, 50, 50, 30);
    //         radgrad2.addColorStop(0, 'rgb('+baseRedVal.value+', '+baseGreenVal.value+', '+baseBlueVal.value+')');
    //         radgrad2.addColorStop(0.75, '#FF0188');
    //         radgrad2.addColorStop(1, 'rgba(255, 1, 136, 0)');
            
    //         this.context.fillStyle = radgrad2;
    //         this.context.fillRect(0, 0, 250, 150);
                

    //    }
        //window.requestAnimationFrame(draw);
    }
    

    render() {
       
        return (
            <Layout title="Graphics Page" description="Welcome to the Graphics Page">
                
                <Header as="h3">Graphics Header</Header>
                <Divider />
                <canvas ref={this.canvasRef} id="graphicsView" width="800" height="600"></canvas>
                <Container id="canvasTools">
                    
                    

                    <Container id="colorSliders">
                        <label htmlFor="redSlider">Red</label>
                        <input id="redSlider" type="range" min='0' max='255'  onChange={this.draw}></input>

                        <label htmlFor="greenSlider">Green</label>
                        <input id="greenSlider" type="range" min='0' max='255' onChange={this.draw}></input>

                        <label htmlFor="blueSlider">Blue</label>
                        <input id="blueSlider" type="range" min='0' max='255' onChange={this.draw}></input>


                    </Container>

                    <select id="drawSelect">
                        <option value="ColoredBox1">ColoredBox1</option>
                        <option value="Box1">Box1</option>
                        
                    </select>
                    <button id="drawButton" onClick={this.draw}>Draw</button>
                </Container>  
            </Layout>
      );
    }
}

export default GraphicsPage;