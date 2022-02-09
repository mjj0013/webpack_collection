import React from 'react';
import { Link } from 'react-router-dom';
import { Header, Container, Divider, Icon } from 'semantic-ui-react';

import NavBar from './NavBar';

import './layout.css';

//import ExtractImageDataModal from './ExtractImageData/ExtractImageData';

import PropTypes from 'prop-types';

class Layout extends React.Component {

	constructor(props, children) {
		super(props);
		
		this.title = props.title? props.title : 'Title';
		
		this.description = props.description? props.description : 'Description';
		
		this.toggleSettings = this.toggleSettings.bind(this);
		this.toggleCalculator = this.toggleCalculator.bind(this);
		this.toggleDataExtractDialog = this.toggleDataExtractDialog.bind(this);
		
		this.currentFocusedElement = 'calc';
		this.getChildContext = this.getChildContext.bind(this);

		
	}

	getChildContext() {
		return {
			toggleSettings:		this.toggleSettings,
			toggleCalculator:	this.toggleCalculator,
			toggleDataExtractDialog: this.toggleDataExtractDialog}
	}
	toggleDataExtractDialog(e) {
		let w = document.getElementById("imgDataModal");
		
        if(w.style.display=="none" || w.style.display=='') { w.style.display="block"; }
        else  w.style.display="none";
           
    
	}
	

	toggleCalculator() {
	
	}
	
	toggleSettings = (e) => {
		
	}
	render() {
		return(
			<Container>
				<NavBar />
				<TopSection className="mainHeader">
					<h2>{this.title}</h2>
					<p>{this.description}</p>
				</TopSection>
				
				<Container> {this.props.children} </Container>
					
				
				
				
			</Container>
			
		);
	}
	
}

function TopSection({children}) {


	const childrenWithProps = React.Children.map(children,child => {
		if(React.isValidElement(child)) {
			return React.cloneElement(child,{});

		}
		return child;
	});

	return (<div>{childrenWithProps}</div>);

}

Layout.childContextTypes = {
	toggleSettings: 	PropTypes.func,
	toggleCalculator:	PropTypes.func,
	toggleDataExtractDialog: PropTypes.func
}



export default Layout;
