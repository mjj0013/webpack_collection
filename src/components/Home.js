import React from 'react';
// import { Link } from 'react-router-dom';
import Layout from './Layout';
import {Header, Container, Divider} from 'semantic-ui-react';
import './layout.css';
class Home extends React.Component {
	constructor(props) {
		super(props);
		this.bgCanvasRef = React.createRef();		//background canvas reference
        this.bgContextRef = React.createRef();		//background context reference
		this.mouseClickHandler = this.mouseClickHandler.bind(this);		
		this.state = { activeIndex: 0 }
	}

	mouseClickHandler = (canvas,e) =>{
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log("Mouse click.. x: " + x + ", y: " + y)
    }
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
export default Home;