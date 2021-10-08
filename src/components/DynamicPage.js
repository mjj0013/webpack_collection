import React, {useState} from 'react';
import { List, Pagination, Header, Container, Divider, Icon } from 'semantic-ui-react';

import Layout from './Layout';
import "regenerator-runtime/runtime";


//import axios from 'axios;';


class DynamicPage extends React.Component {
    constructor(props) {
        super(props);
        this.showFile= this.showFile.bind(this);
        this.numOfPagesChanged= this.numOfPagesChanged.bind(this);
        this.state = {num:''};
    }

    async showFile(e) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text=(e.target.result);
            const words  = text.split(' ');


            words.forEach((w) => {
                document.getElementById("fileText").value += w;
                document.getElementById("fileText").value += " ";
            });            
        };
        reader.readAsText(e.target.files[0]);
    }

    numOfPagesChanged(e) {
        this.setState({num: e.target.value});
        
    }
   
    render() {
        return (
            <Layout title="File Loading Page" description="Description about file">
                
                <Header as="h3">Header about file loading</Header>
                <Container id="fileLoader">
                    <label htmlFor="numOfPages" value='1'>Number of Pages: </label>
                    <select id="numOfPages" onChange={this.numOfPagesChanged}>
                        <option value='1'>1</option>
                        <option value='2'>2</option>
                        <option value='3'>3</option>
                        <option value='4'>4</option>
                        <option value='5'>5</option>
                        <option value='6'>6</option>
                        <option value='7'>7</option>

                    </select>


                    <label htmlFor="files">Choose text file: </label>
                    
                    <input type="file" id="files" onChange={this.showFile}></input>

                   
                    
                </Container>  
                <Divider />
                
                <textarea id="fileText" cols='100' rows='30'></textarea>
                
                

            </Layout>
      );


    }
}
export default DynamicPage;
//GOAL: use pagination after loading text file
	
