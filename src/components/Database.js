import React, {useState} from 'react';


import {getRandomInt} from './utility.js';
import "regenerator-runtime/runtime";
// import { documentElement } from 'min-document';

import Layout from './Layout';
import {Table, Menu,Accordion,Card,Segment,Button, Header, Container, Divider, Icon } from 'semantic-ui-react';

import './layout.css';

var months = [{name:"January",length: 31},{name:"February",length:28},{name:"March",length:31},{name:"April",length:30},{name:"May",length:31},
{name:"June",length:30},{name:"July",length:31},{name:"August",length:31},{name:"September",length:30},{name:"October",length:31},{name:"November",length:30}, {name:"December",length:31}]
var minYear = 1800;
var maxYear = 2500;



var maleFirstNames = ["Tom","Tim","Tate","Tater","Ryan","Ronald","Riley","Bill","George","Barack","Jimmy","Skeeter","Kenny","Eric","Scooter","Alex", "Omar","Ahmed","Ali","Yassin","Peter", "Pierre","John","Mina","Habib","Juan","Jose","Antonio","Mateo","Robert","Will","David","Richard","Charles","Joseph","Diego","Liam","Ben", "Agustin","Sebastian","Thiago","Dylan","Matthew","Lucas","Daniel","Jayden"]
var femaleFirstNames = ["Rachel","Riley","Mary","Amber","Ann", "Marie", "Alex","Ambar","Roxanne","Isidora","Aria","Clara","Camila","Zoe", "Lily","Emma","Martha","Laura","Chloe","Mila","Mia","Isabella","Jennifer","Harper","Ava","Olivia","Linda","Julie","Julia","Ane","Alice","Victoria","Luna"]

var lastNames =["Smith","Brown","Davis","Wilson","Lee","Johnson","Tremblay", "Roberts",
"Mora","Araya","Rojas","Salas","Montes", "Cruz","Walker","Robinson","Miller","Taylor",
"Lewis","Evans","Phillips","Turner","Sanchez","King","Hall","White","Black", 
"Blackhead","Love","Hart","Wright", "Morris","Pearman","Jackson","Rivera","Nguyen",
"Baker","Clark", "Watson","Fisher","Barnes","Jenkins","Bailey","Bell","Cooper","Reed","Garcia","Young", "Hernandez","Phillips",
"Jeter","Brooks", "Shelby"]


var personAttributes = {
    name:['firstName','lastName'],
    interrelations:['step-son','step-daughter','mother','father','son','spouse','daughter','friend','acquaintance', 'grandmother','grandfather','grandchild'],
    relations:['pet','home','location','hometown'],
    attributes:['birthday','age','job']
}

var dataStruct = [
    {
        type:"person", 
        name:{
            firstName:"John", 
            lastName:'Smith'
        },
        relations:{
            mother:[1],
            father:[2],

        },
        attributes:{
            age:32,
            job:'technician',

        }
    },




]


class Person {
    constructor(firstName,lastName, birthday,birthMonth,birthYear) {
        this.firstName = firstName
        this.birthday = birthday;
        this.birthMonth = birthMonth;
        this.birthYear = birthYear;
    }
}


export class Database extends React.Component {
    constructor(props) {
        super(props);

        this.generateCommunity = this.generateCommunity.bind(this);
        this.generatePerson = this.generatePerson.bind(this);

    }
    generatePerson(leastYear,mostYear, lastName=-1) {
        
       
        var birthYear = getRandomInt(leastYear,mostYear);
        var birthMonth = getRandomInt(0, 11);
        var birthday = getRandomInt(1,months[birthMonth].length);
        var gender = getRandomInt(0,1);
        if(lastName== -1) {
            lastName = getRandomInt(0, lastNames.length);

        }
        lastName = lastNames[lastName];

        
        var firstName = gender==0||gender==-1? maleFirstNames[getRandomInt(0,maleFirstNames.length)]:femaleFirstNames[getRandomInt(0,femaleFirstNames.length)]
        var Gender;
        if(gender==-1) Gender = "unknown"
        else if(gender==0) Gender="male"
        else if(gender==1) Gender="female"
        new Person(firstName, lastName, birthday, birthMonth.name,birthYear);


    }
    generateCommunity() {

    }
    render() {

        return (
            <Container >
				<Layout id="dbLayout" className="dbLayout" title="Database" description="">
					<table className="ui celled table">
                        <thead>
                            <th></th>
                            <th></th>
                        </thead>

                    </table>
					
					
				</Layout>
				
				<Divider />
				
			</Container>
        );
    }
}