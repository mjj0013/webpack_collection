import React from 'react';
import { Link } from 'react-router-dom';

import Layout from './Layout';
import {Menu,Accordion,Card,Segment,Button, Header, Container, Divider, Icon } from 'semantic-ui-react';

import './layout.css';

import PropTypes from 'prop-types';

import CalculatorModal from './CalculatorModal';


import bg_image from "../img/pine_tree.jpeg";
import bg_image2 from "../img/high_res_grass.jpeg";

import SettingsModal from './SettingsModal';


class Home extends React.Component {

	constructor(props) {
		super(props);


		this.bgCanvasRef = React.createRef();		//background canvas reference
        this.bgContextRef = React.createRef();		//background context reference
		this.mouseClickHandler = this.mouseClickHandler.bind(this);

		
		this.toggleSettings = this.toggleSettings.bind(this);
		this.toggleCalculator = this.toggleCalculator.bind(this);
	
		this.getChildContext = this.getChildContext.bind(this);
		

		this.state = { activeIndex: 0 }
	}

	

	getChildContext() {
		return {toggleSettings:this.toggleSettings}
	}

	mouseClickHandler = (canvas,e) =>{
		
		
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        /*this.physicalObjectMap.forEach((item,index) => {
                var isInside = false
                var item = this.physicalObjects[index];
                if(item.controllable==true) {
                    if((x >= item.x-item.radius) && (x <= item.x+item.radius)) {
                        if((y >= item.y-item.radius) && (y <= item.y+item.radius)) {
                            isInside=true;
                            this.controlledObjectIndex = index;
                        }
                    }
                }
        });*/
        
        console.log("Mouse click.. x: " + x + ", y: " + y)
        
    }

	componentDidMount = () => {

		this.bgCanvasRef.current.addEventListener('mousedown', (e) => {this.mouseClickHandler(this.bgCanvasRef.current,e)});


		this.bgContextRef.current = this.bgCanvasRef.current.getContext('2d');
		var image1 = new Image();
		image1.onload = () => {
			document.getElementById("subCanvas1").getContext('2d').drawImage(image1, 0, 0, image1.width, image1.height);
		}
		image1.src="../img/pine_tree.jpeg";


		var image2 = new Image();
		image2.onload = () => {
			document.getElementById("subCanvas2").getContext('2d').drawImage(image2, 0, image1.height, image2.width, image2.height);
		}
		image2.src="../img/high_res_grass.jpeg";


	}

	toggleCalculator() {
		let w = document.getElementById("cw");
		
        if(w.style.display=="none" || w.style.display=='') {
			
            w.style.display="block";
			window.setInterval(w.updateAnswer, 1000);
        }
        else {
            w.style.display="none";
        }
	}

	toggleSettings(e) {
		
		
		let w = document.getElementById("sw");
		
        if(w.style.display=="none" || w.style.display=='') {
			
            w.style.display="block";
			//window.setInterval(w.updateAnswer, 1000);
        }
        else {
            w.style.display="none";
        }
		
		

		if(e.target.id=="calcSettingsButton") {		//settings request came from calculator
			console.log("calculator button requested settings")

			//document.getElementById('elementSettingsPage').appendChild(this.calculatorSpecificSettings());
			console.log(document.getElementById('elementSettingsPage'));
			this.currentFocusedElement = "calc";
		}

		if(e.target.id=="homeSettingsButton") {		//settings request came from Home Page
			console.log("home button requested settings")
		}
	}



	
	render() {
		return (
			<Container id="homeRoot">
				
                
				
				<Layout title="Home" description="asdfasfd">
					<Header as="h2">This is the home page</Header>
					
					<p>This is a description about the home page.</p>
					
					<canvas ref={this.bgCanvasRef} className="backgroundCanvas" id="bgCanvas" width="1200px" height="1000px"></canvas>
					<canvas className="subCanvas" id="subCanvas1" width="800px" height="600px"></canvas>
					<canvas className="subCanvas" id="subCanvas2" width="800px" height="600px"></canvas>

				</Layout>
				
				<Divider />
				
				
				
				<CalculatorModal id="cm" toggleSettings={this.toggleSettings}/>
				<SettingsModal id='calcSettingsModal'/>
				
				
			</Container>
			
		  );
	}
}

Home.childContextTypes = {
	toggleSettings: PropTypes.func,

}
//<button id="calculatorButton">Calculator</button>

export default Home;


