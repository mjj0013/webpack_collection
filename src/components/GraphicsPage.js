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
        
        
        this.canvasRef = React.createRef();
        


    }
    

    componentDidMount() {
        this.context = this.canvasRef.current.getContext('2d');   // use { alpha: false } to optimize
        setInterval(() => {
            
            this.moveColors();
            this.draw();
        }, 1000/60);
        
        
        
        
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
        
        const drawSelection = document.getElementById("drawSelect");
        var baseRedVal = document.getElementById("redSlider");
        var baseGreenVal = document.getElementById("greenSlider");
        var baseBlueVal = document.getElementById("blueSlider");
        if(drawSelection==null) return;

        if(drawSelection.value == "Box1") {
            

            this.context.fillRect(25,25,100,100);
            this.context.clearRect(45,45,60,60);
            this.context.strokeRect(50,50,50,50);
            
       }
       if(drawSelection.value == "ColoredBox1") {
            var grid_length = 50;
            var color_gradient = (255/grid_length);

            //Background animation
            for(var i = 0; i <grid_length; ++i) {
                for(var j = 0; j <grid_length; ++j) {
                    
                    this.context.fillStyle = 'rgb(' 
                        + Math.floor(Math.abs(this.red%255-color_gradient*i)) +', ' 
                        + Math.floor(Math.abs(this.green%255-color_gradient*j)) +', '
                        + Math.floor(Math.abs(this.blue%255-color_gradient*j))         
                        +')';
                    this.context.fillRect(j*10,i*10,10,10);
                }
            }
            
            var radgrad2 = this.context.createRadialGradient(45, 45, 10, 50, 50, 30);
            radgrad2.addColorStop(0, 'rgb('+baseRedVal.value+', '+baseGreenVal.value+', '+baseBlueVal.value+')');
            radgrad2.addColorStop(0.75, '#FF0188');
            radgrad2.addColorStop(1, 'rgba(255, 1, 136, 0)');
            
            this.context.fillStyle = radgrad2;
            this.context.fillRect(0, 0, 250, 150);
                

       }
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