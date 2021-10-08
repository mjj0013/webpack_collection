import _ from 'lodash';

import App from './components/App.js';


import React from 'react';
import ReactDOM from 'react-dom';

//import { hot } from "react-hot-loader/root";



function render(Component) {
	return ReactDOM.render(<Component />, document.getElementById("root"));
}



render(App);
//render(hot(App));









