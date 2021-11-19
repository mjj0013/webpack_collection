import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Header, Container, Divider, Icon,Button, Dropdown } from 'semantic-ui-react';


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
		if(w == null) return;
        if(w.style.display=="none" || w.style.display=='') {
			
            w.style.display="block";
			window.setInterval(w.updateAnswer, 1000);
        }
        else w.style.display="none";
        
	}

	toggleSettings(e) {
		let w = document.getElementById("sw");
		
        if(w.style.display=="none" || w.style.display=='') { w.style.display="block"; }
        else w.style.display="none";

		if(e.target.id=="calcSettingsButton") {		//settings request came from calculator
			console.log("calculator button requested settings")
			console.log(document.getElementById('elementSettingsPage'));
		}

		//settings request came from Home Page
		if(e.target.id=="homeSettingsButton") {	console.log("home button requested settings"); }
	}
	render() {
		return (	
			<Menu id="navBar" className="nav-menu">
				
					<Link to="/" className="nav-link item">Home</Link>
					<Link to="/fileload" className="nav-link item">File Load</Link>
					<Link to="/animation" className="nav-link item">Animation</Link>
					<Link to="/game" className="nav-link item">Game</Link>
					
					<Dropdown item text="Tools">
						<Dropdown.Menu>
							<Dropdown.Item text="Calculator" onClick={this.toggleCalculator}/>
							
						</Dropdown.Menu>
					</Dropdown>
					
					<div class="nav-item item">
						<Button compact id='openSettings' onClick={this.toggleSettings}>
							<i className="icon cog"/>
						</Button> 
					</div>
							
				
			</Menu>
		  );
	}

	// render() {
	// 	return (	
	// 		<Menu id="navBar" className="nav-menu vertical">
	// 			<Container>
	// 				<Link to="/" className="nav-link vertical">Home</Link>
	// 				<Link to="/fileload" className="nav-link vertical">File Load</Link>
	// 				<Link to="/animation" className="nav-link vertical">Animation</Link>
	// 				<Link to="/game" className="nav-link vertical">Game</Link>
					
	// 				<div className="nav-item">
	// 					<Button className="navBarButton" id='openCalc' onClick={this.toggleCalculator}>Calculator</Button> 
	// 				</div>
					
	// 				<div class="nav-item">
	// 					<Button className="navBarButton" id='openSettings'  onClick={this.toggleSettings}>
	// 						<Icon id="settingsIcon" name="cog" />
	// 					</Button> 
	// 				</div>
							
	// 			</Container>
	// 		</Menu>
	// 	  );
	// }

}

NavBar.childContextTypes = {
	toggleSettings: PropTypes.func,
	toggleCalculator: PropTypes.func,
}


export default NavBar;
