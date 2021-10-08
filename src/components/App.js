//var ReactDOM = require('react-dom');

import React from 'react';

import { Switch, BrowserRouter, Route } from 'react-router-dom';

import DynamicPage from './DynamicPage'; 
import BasicForm from './PersonFormPage';
import GraphicsPage from './GraphicsPage';

//import Loading from './Loading';
import Home from './Home';
//import { hot } from "react-hot-loader/root";

import Game from './Game/Game';

window.addEventListener('beforeunload', event => {
	event.preventDefault();
	window.localStorage.clear();
	//event.returnValue = 'Are you sure?'
	
	
	
});

function App() {

	return(
		<BrowserRouter>
			<div>
				<Switch>
					
					<Route path="/fileload" component={DynamicPage} />
					
					<Route path="/animation" component={GraphicsPage} />
					<Route path="/game" component={Game} />
					<Route  path="/" component={Home} />
					
				</Switch>
			</div>
			
		</BrowserRouter>
	);
}

//export default hot(App);


export default App;


