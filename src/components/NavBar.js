import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Header, Container, Divider, Icon,Button, Dropdown } from 'semantic-ui-react';

import './layout.css';

import Home from './Home'

import PropTypes from 'prop-types';

// import "regenerator-runtime/runtime";



class NavBar extends React.Component {
	constructor(props) {
		super(props);
		this.toggleSettings = this.toggleSettings.bind(this);
		this.toggleCalculator = this.toggleCalculator.bind(this);
		this.getChildContext = this.getChildContext.bind(this);

		this.canvasRef = React.createRef();
        this.contextRef = React.createRef();
		
	
		this.coverTransformMatrix =  [1, 0, 0, 1, 0, 0];
		this.currentZoom = 2;
		
		
		this.intervals = [];

		this.coverTriangles = [];
		this.xSortedCoverTriangles = []
		this.ySortedCoverTriangles = []
		this.step = 0;
	}

	getChildContext() {
		return {toggleSettings:this.toggleSettings}
	}


	toggleCalculator() {}
	toggleSettings() {}

	render() {
		return (	
			<Container id='navBarContainer'>
				<canvas ref={this.canvasRef }id="coverCanvas" width="100%" />
				<Menu id="navBar"  inverted className="nav-menu">
					<Link to="/" className="nav-link item">Home</Link>
					<Link to="/fileload" className="nav-link item">File Load</Link>	
					<Dropdown item text="Tools">
						<Dropdown.Menu>
							<Dropdown.Item text="Calculator" onClick={this.toggleCalculator}/>
						</Dropdown.Menu>
					</Dropdown>

				</Menu>
			</Container>
		  );
	}

}

NavBar.childContextTypes = {
	toggleSettings: PropTypes.func,
	toggleCalculator: PropTypes.func,
}


export default NavBar;
