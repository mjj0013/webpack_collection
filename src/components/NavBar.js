import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Header, Container, Divider, Icon,Button } from 'semantic-ui-react';


import './layout.css';

import Home from './Home'

import PropTypes from 'prop-types';



class NavBar extends React.Component {
	constructor(props) {
		super(props);

		this.toggleSettings = this.toggleSettings.bind(this);
		this.toggleCalculator = this.toggleCalculator.bind(this);
		this.getChildContext = this.getChildContext.bind(this);
	}
	getChildContext() {
		return {toggleSettings:this.toggleSettings}
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
			
		}

		if(e.target.id=="homeSettingsButton") {		//settings request came from Home Page
			console.log("home button requested settings")
		}
	}
		


	// <Menu className="nav-menu" vertical>
	// 	<Menu.Item className="menuItem">
	// 		<Link to="/" className="nav-link">Home</Link>
	// 	</Menu.Item>

	// 	<Menu.Item className="menuItem">
	// 		<Link to="/fileload" className="nav-link">File Load</Link>
	// 	</Menu.Item>

	// 	<Menu.Item className="menuItem">
	// 		<Link to="/animation" className="nav-link">Animation</Link>
	// 	</Menu.Item>

	// 	<Menu.Item className="menuItem">
	// 		<Link to="/game" className="nav-link">Game</Link>
	// 	</Menu.Item>
		
	// 	<Menu.Item className="menuItem">
	// 		<Button className="navBarButton" id='openCalc' onClick={this.toggleCalculator}>Calculator</Button> 
			
	// 		<Button className="navBarButton" id='openSettings' onClick={this.toggleSettings}>Settings</Button>
	// 	</Menu.Item>
	// </Menu>

	render() {
		return (	
			<div id="navBar" class="nav-menu">
				<Container>
					
					<Link to="/" className="nav-link">Home</Link>
				
					<Link to="/fileload" className="nav-link">File Load</Link>
				
					<Link to="/animation" className="nav-link">Animation</Link>
				
					<Link to="/game" className="nav-link">Game</Link>
					
					<div className="nav-item">
						<Button className="navBarButton" id='openCalc' onClick={this.toggleCalculator}>Calculator</Button> 
					</div>
					<div class="nav-item">
						<Button className="navBarButton" id='openSettings' onClick={this.toggleSettings}>Settings</Button> 
					</div>					
				</Container>
			</div>

				
			
		  );
	}

}

NavBar.childContextTypes = {
	toggleSettings: PropTypes.func,
}


export default NavBar;
