import React from 'react';
import { Link } from 'react-router-dom';

import Layout from './Layout';
import { Header, Container, Divider, Icon } from 'semantic-ui-react';
import './layout.css';

class Field extends React.Component {
	constructor() {
		super();
		this.handleChange = this.handleChange.bind(this);

		this.state = {value:''};
	}
	handleChange = (e) => {
		//this.setState({value:e.target.value});
		
		console.log('asdf');
	}

	render() {
		return (
			<input type="button" onClick={this.handleChange}></input>
		)
	}
}

export default Field;