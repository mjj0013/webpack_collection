import React from 'react';
import { Link } from 'react-router-dom';

import Layout from './Layout';
import {Menu,Accordion,Card,Segment,Button, Header, Container, Divider, Icon } from 'semantic-ui-react';

import './layout.css';

import PropTypes from 'prop-types';

import CalculatorModal from './CalculatorModal';


// import bg_image1 from "../img/pine_tree.jpeg";
// import bg_image2 from "../img/high_res_grass.jpeg";
// import bg_image3 from "../img/IMG_2313.jpg";



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

        
        console.log("Mouse click.. x: " + x + ", y: " + y)
        
    }

	

	toggleCalculator() {
		let w = document.getElementById("cw");
        if(w.style.display=="none" || w.style.display=='') {
			
            w.style.display="block";
			window.setInterval(w.updateAnswer, 1000);
        }
        else { w.style.display="none"; }
	}

	toggleSettings(e) {
		
		
		let w = document.getElementById("sw");
		
        if(w.style.display=="none" || w.style.display=='') { w.style.display="block"; }
        else { w.style.display="none"; }
		if(e.target.id=="calcSettingsButton") {		//settings request came from calculator
			console.log("calculator button requested settings")
			console.log(document.getElementById('elementSettingsPage'));
			this.currentFocusedElement = "calc";
		}

		if(e.target.id=="homeSettingsButton") {		//settings request came from Home Page
			console.log("home button requested settings")
		}
	}

	

	
	//<img className="backgroundImage" src='../img/IMG_2313.jpg'/>
	render() {
		return (
			<Container id="homeRoot">
				<Layout id="homeLayout" className="homeLayout" title="Home" description="asdfasfd">
					
					
					<Header as="h2">This is the home page</Header>
					<p>This is a description about the home page.</p>
					
				</Layout>
				
				<Divider />
				
			</Container>
			
		  );
	}
}
/*<img src="" height="200" alt="Image preview..."></img>*/

/* <CalculatorModal id="cm" toggleSettings={this.toggleSettings}/>
<SettingsModal id='calcSettingsModal'/> */
Home.childContextTypes = {
	toggleSettings: PropTypes.func,

}
//<button id="calculatorButton">Calculator</button>

export default Home;

