import React from 'react';
import { Link } from 'react-router-dom';
import { Header, Container, Divider, Icon } from 'semantic-ui-react';

import NavBar from './NavBar';

import './layout.css';


const Layout = ({title="Title", description="Description", children }) => {
  return (
  
	<Container>
		<NavBar />
		
		
		<Container className="mainHeader">
      			<h2>{title}</h2>
      			<p >{description}</p>
      	</Container>
		
      	

		<Container >
			{children}
		</Container>
		
    </Container>
  );
  
};

export default Layout;
