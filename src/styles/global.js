import {createGlobalStyle} from "styled-components";


export default createGlobalStyle`
	@import url('https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap>');
	
	body {
	--nav-width:200px;
	margin: 0 0 0 var(--nav-width);
	font-family: 'Quicksand', sans-serif;
	font-size:18px;
}

a {
	color: #009579;
	

}

.pull-right {
  display: flex;
  justify-content: flex-end;
}

.h1 {
  margin-top: 10px !important;
  margin-bottom: 20px !important;
}


nav.menu {
	position: fixed;
	top: 0;
	left: 0;
	width: var(--nav-width);
	height: 100vh;
	background: #222222;

}

.nav-link {
	display: block;
	padding: 12px 18px;
	text-decoration: none;
	color: #eeeeee;
	font-weight: 500;


}

.nav-link:hover {
	background: rgba(255,255,255,0.05);
}

`;

