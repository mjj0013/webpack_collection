import { func } from 'prop-types';
import React from 'react';

import {Dropdown,Icon } from 'semantic-ui-react';

import PropTypes from 'prop-types';
import './CalculatorModal.css'

import {replaceAll} from './utility.js'

import {CloseIcon} from '../icons/importSVG';

import bg_image from '../img/calcAnimation.gif';

// var allTerms=[];
// class Term {
//     constructor(term_addr,parent_term=false) {
//         this.term_addr = term_addr;     //term_addr will always inherit from parent term on creation
//         //term_addr is 'coordinates'
//         //example:  1 + 3*(x+1) + ((6+1)*9)   :   (6+1) has term_addr=[2,0]
        


//         this.parent_term=parent_term;
//         this.str_form = '';

//         this.inner_term_iter = 0;
//         this.inner_terms = [];  //string form of Javascript readable math; example: 3+1+X+A+pi
//         this.outer_terms = [];  //example: e^(X), ln(X), 5*Term[0,1,3]/9
//                                 //outer Term objects of this will be expresses as Term[term_addr] in  str_form  
//         this.process_str_form = this.process_str_form.bind(this);
//         this.isInverse = false; 
        
        



//     }
//     process_str_form() {            //splits str_form into inner_terms and outer_terms
//         let replaceParentheses=  this.str_form.replace(/\(/, '(;');
//         replaceParentheses=  this.str_form.replace(/\)/, ';)');
//         let temp = replaceParentheses.split(/;/);
//         if(temp.indexOf('(') == 1) {
//             let outerExpr = temp[0];
//             if(outerExpr.search(/sin/) > -1){        //for sin
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('sin'));
//                 this.isInverse = factor[-1]=='/';
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'sin', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/cos/) > -1){        //for cos
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('cos'));
//                 this.isInverse = factor[-1]=='/';
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'cos', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/tan/) > -1){        //for tan
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('tan'));
//                 this.isInverse = factor[-1]=='/';
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'tan', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/e\^/) > -1){        //for e^
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('e^'));
//                 this.isInverse = factor[-1]=='/';
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'e^', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/^Term\[.*\]$/) > -1){        //for other Term multiplcation or divide
//                 let term = outerExpr;
//                 this.isInverse = factor[-1]=='/';
//                 term = term.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'Term', factor:term, negative:term.includes('-')})
//             }
//             else if(outerExpr.search(/^Term\[.*\]\^$/) > -1){        //Term^this  ; for Term raised to power of this
//                 let term = outerExpr;
//                 this.isInverse = factor[-1]=='/';
//                 term = term.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'powOf', factor:term, negative:term.includes('-')})
//             }
//             else if(outerExpr.search(/[A-Z]/) > -1) {             //variable
//                 let x = outerExpr;
//                 this.isInverse = x[-1]=='/';                
//                 x = x.replace(/\*|\//, '');
//                 let factor = x.search(/[0-9]/);
//                 let xName = x;
//                 if(factor > -1) {
//                     factor = x.substr(0,x.search(/[A-Z]/));
//                     xName = x.substr(x.search(/[A-Z]/));
//                 }
//                 this.outer_terms.push({func:'var', varName:xName, factor:factor, negative:x.includes('-')});
//             }
//             //this.outer_terms.push(outerExpr);
//         }
//         if(temp.indexOf(')') < temp.length-1) {
//             //this.outer_terms.push(temp[temp.length-1]);
//             let outerExpr = temp[temp.length-1];
//             if(outerExpr.search(/sin/) > -1){        //for sin
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('sin'));             
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'sin', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/cos/) > -1){        //for cos
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('cos'));              
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'cos', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/tan/) > -1){        //for tan
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('tan'));            
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'tan', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/e\^/) > -1){        //for e^
//                 let factor = outerExpr.substr(0,outerExpr.indexOf('e^'));             
//                 factor = factor.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'e^', factor:factor, negative:factor.includes('-')})
//             }
//             else if(outerExpr.search(/^Term\[.*\]$/) > -1){        //for other Term multiplcation or divide
//                 let term = outerExpr;              
//                 term = term.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'Term', factor:term, negative:term.includes('-')})
//             }
//             else if(outerExpr.search(/^Term\[.*\]\^$/) > -1){        //Term^this  ; for Term raised to power of this
//                 let term = outerExpr;           
//                 term = term.replace(/\*|\//, '');
//                 this.outer_terms.push({func:'powOf', factor:term, negative:term.includes('-')})
//             }
//             else if(outerExpr.search(/[A-Z]/) > -1) {             //variable
//                 let x = outerExpr;               
//                 x = x.replace(/\*|\//, '');
//                 let factor = x.search(/[0-9]/);
//                 let xName = x;
//                 if(factor > -1) {
//                     factor = x.substr(0,x.search(/[A-Z]/));
//                     xName = x.substr(x.search(/[A-Z]/));
//                 }
//                 this.outer_terms.push({func:'var', varName:xName, factor:factor, negative:x.includes('-')});
//             }
//         }
//         replaceParentheses.split(/\+/)
//     }
// }

function radians_to_degrees(radians)
{
  var pi = Math.PI;
  return radians * (pi/180);
}

const calcOptions = [{text:"Settings",value:"Settings"},
{text:"Standard", value:"Standard"},
{text:"Advanced", value:"Advanced"},
{text:"Graphing", value:"Graphing"},
];
class CalculatorModal extends React.Component {


    constructor(props, {toggleSettings}) {
        super(props);
        
        this.open=false;
        
        this.setOpen = this.setOpen.bind(this);

        this.termCache = [];         //each element in this list will be a term (strings of numbers possibly divided with / or * )
        this.currentTermStr = '';        //this will represent the current term I.E **the term that the cursor is next to as well**
       


        this.charBuffer = '';       //this will hold the last keys(letters) typed, for determining if its a variable or PI, etc.

        this.currentExprType = 'num';
        this.typeMode = 'normal';   //normal, superscript, subscript

        this.makeDraggable = this.makeDraggable.bind(this);
        this.closeDragElement = this.closeDragElement.bind(this);
        this.elementDrag = this.elementDrag.bind(this);
        this.dragMouseDown = this.dragMouseDown.bind(this);

        this.dropDownItemClicked = this.dropDownItemClicked.bind(this);
        this.showGraph = this.showGraph.bind(this);
        this.graphExtended = false;

        this.showAdvanced = this.showAdvanced.bind(this);
        this.showStandard = this.showStandard.bind(this);
        this.startGraphing = this.startGraphing.bind(this);
        this.changeEquationLineEdit = this.changeEquationLineEdit.bind(this);

        this.updateEquationString = this.updateEquationString.bind(this);
        this.updateAnswer = this.updateAnswer.bind(this);
        this.showVariablePanel = this.showVariablePanel.bind(this);
        
        this.initGraph = this.initGraph.bind(this);
        this.keyHandler = this.keyHandler.bind(this);
        this.variablePanelShowing = false;
        this.posPrediction = {pos1:0, pos2:0, pos3: 0, pos4:0}
        this.current_parentheses_depth = 0;


        this.state={data:''};

        

        this.toggleSettings = toggleSettings;

        this.parentheses_structs = [];

        this.current_function = {name:null, lastParenthesisIndex:0};
        
        this.lastWindowPathName = '/home';
        this.variableList = [];
        this.updateVariableList = this.updateVariableList.bind(this);

        this.calcButtonPressed = this.calcButtonPressed.bind(this);
        this.currentCalcOption = "Standard";
        this.selectableOptions = [
            {key:1, text:'Show Graph', value:1},
            {key:2, text:'Show Extended Operations', value:2},

        ]

        this.focusIn = this.focusIn.bind(this);
        

        //this.baseLevelTerms = [];
        //this.baseLevelTerm = null;

        // ******************  Graphing section  ******************
        this.canvasRef = React.createRef();


    }

    focusIn(e) {
        //if(e.target)
        var cw = document.getElementById('cwh');
        // var cwh = document.getElementById('cwh');
        // if(cw == document.activeElement) {

        // }
        cw.addEventListener("keydown", this.keyHandler);
    }

    startGraphing() {
        var xVar = null;
        this.variableList.forEach((v) => {
            if(v.name=='X') {
                xVar = v;
            }
        })
        if(xVar==null) {
            console.log("No X variable detected");
            return;
        }

        
        
        var originX = this.canvasRef.current.width/2;
        var originY = this.canvasRef.current.height/2;

    
        var eqCopy = this.complete_equation_str;

        var pastX=null;
        var pastY=null;
        this.context.beginPath();
        
        console.log("asdf: "+ eqCopy.replaceAll('X','0'));
        console.log("at 0: "+ eval(eqCopy.replaceAll('X','0')));
        for(var x =-this.canvasRef.current.width/2; x < this.canvasRef.current.width/2;++x) {
            
            var thisIteration = eqCopy.replaceAll('X',x.toString());


            try{

                var thisY = this.canvasRef.current.height/2 -  eval(thisIteration);
                if(pastX==null && pastY==null) {
                    pastX = x;
                    pastY = thisY;
                }
                else {


                    this.context.moveTo(this.canvasRef.current.width/2 + pastX, pastY);
                    this.context.lineTo(this.canvasRef.current.width/2 + x,thisY);
                    this.context.stroke();

                    pastX = x;
                    pastY = thisY;
                }

                
                
            }
            catch(error) {"ERROR in graphing equation at x = "+x}
            

        }
        
    }

    initGraph() {
        this.context.beginPath();
        this.context.moveTo(this.canvasRef.current.width/2,0);
        this.context.lineTo(this.canvasRef.current.width/2,this.canvasRef.current.height);
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(0,this.canvasRef.current.height/2);
        this.context.lineTo(this.canvasRef.current.width,this.canvasRef.current.height/2);
        this.context.stroke();

    }
    

    closeDragElement() {
        
        document.onmouseup = null;
        document.onmousemove = null;
    }
    elementDrag(e) {
        
        e = e || window.event;
        e.preventDefault();

        this.posPrediction.pos1 = this.posPrediction.pos3 - e.clientX;
        this.posPrediction.pos2 = this.posPrediction.pos4 - e.clientY;

        this.posPrediction.pos3 = e.clientX;
        this.posPrediction.pos4 = e.clientY;

        let w = document.getElementById("cw");
        w.style.top = (w.offsetTop - this.posPrediction.pos2) + "px";
        w.style.left = (w.offsetLeft - this.posPrediction.pos1) + "px";
    }

    dragMouseDown(e) {
        /*if(e.target.value=="Standard" || 
        e.target.value=="Extended Operations" ||
        e.target.value=="Show Graph" ||
        e.target.value=="Button") return;*/
        
        e = e || window.event;
        
        e.preventDefault();
        this.posPrediction.pos3 = e.clientX;
        this.posPrediction.pos4 = e.clientY;


        document.onmouseup = this.closeDragElement;
        document.onmousemove = this.elementDrag;


    }
    
    makeDraggable(item_id) {
        var item = document.getElementById(item_id)
        this.posPrediction = {pos1:0, pos2:0, pos3: 0, pos4:0}
        item.onmousedown = this.dragMouseDown;
    }

    changeEquationLineEdit(expr,subOutExpr=null) {
        var eqLineEdit = document.getElementById('equationLineEdit');
        
        if(this.typeMode=='normal') {
            if(subOutExpr) {
                for(let i=0; i < subOutExpr.length; ++i) {
                    eqLineEdit.removeChild(eqLineEdit.lastChild);
                }
            }
            
            if(expr=="Backspace") {
                console.log(eqLineEdit);
                eqLineEdit.removeChild(eqLineEdit.lastChild);
            }
            else {
                if(this.current_function.name!=null && this.current_function.name!='exp') {          //either sine, cos, tan, e^
                    if(subOutExpr) {
                        for(let i=0; i < subOutExpr.length; ++i) {
                            eqLineEdit.removeChild(eqLineEdit.lastChild);
                        }
                        //
                    }
                    eqLineEdit.removeChild(eqLineEdit.lastChild);
                    
                    
                    //eqLineEdit.insertAdjacentHTML('beforeend',expr);
                    for(var i=0; i < expr.length; ++i) {
                        eqLineEdit.insertAdjacentHTML('beforeend',expr[i]);
                        
                    }
                    eqLineEdit.insertAdjacentHTML('beforeend',')');

                }
                else {
                    for(var i=0; i < expr.length; ++i) {
                        eqLineEdit.insertAdjacentHTML('beforeend',expr[i]);
                    }
                }
                

                
            }
            
        }
        else if(this.typeMode=='superscript') {
            if(subOutExpr) {
                for(let i=0; i < subOutExpr.length; ++i) {
                    eqLineEdit.removeChild(eqLineEdit.lastChild);
                }
            }
            if(expr=="Backspace") {
                eqLineEdit.removeChild(eqLineEdit.lastChild);
                console.log(eqLineEdit);
            }
            else {
                for(var i=0; i < expr.length; ++i) {
                    eqLineEdit.insertAdjacentHTML('beforeend','<sup>'+expr[i]+'</sup>');
                }
                
            }
            
        }
        
    }
    updateAnswer() {
        
        // this.variableList.forEach((v)=> {
        //     if(v.value !=null) {
        //         this.complete_equation_str = replaceAll(this.complete_equation_str,v.name,v.value.toString());
        //     }
        // })

        var answerLine = document.getElementById('answerLine');
        answerLine.textContent = "";
        try {
            
            
            if(eval(this.complete_equation_str)==Infinity) {
                
                answerLine.textContent = " = " + String.fromCharCode(8734);
            }
            else {
                answerLine.textContent = " = " + eval(this.complete_equation_str).toFixed(4);
            }
            
            
            console.log("current answer = " + eval(this.complete_equation_str).toFixed(4));
        }
        catch(error) {
            var strCopy= this.complete_equation_str;
            if(this.variableList.length > 0) {
                
    
                this.variableList.forEach((v,index) => {
                    if(v.value!=null) {
                       
                        strCopy = replaceAll(strCopy,v.name,v.value);
                    }
                })
    
    
                console.log("new answer: " + strCopy);
            }
            try {
                if(eval(strCopy)==Infinity) {
                
                    answerLine.textContent = " = " + String.fromCharCode(8734);
                }
                else {
                    answerLine.textContent = " = " + eval(strCopy).toFixed(4);
                }
                
                return;
            }
                
            catch(error) {

            }
                //console.log("current answer = " + eval(this.complete_equation_str).toFixed(4));
            //var strCopy = this.complete_equation_str;
            
            //var base_level = replaceAll(strCopy,/ *([0-9])*(\*|\/)*(sin|cos|tan)*\(.*\) */g, "");      //ignore content in parenthesis
            var base_level = strCopy.replace(/ *([0-9])*(\*|\/)*(sin|cos|tan)*\(.*\) */g, "");
           
            var next_level = strCopy.match(/ *([0-9])*(\s)*(\*|\/)*(sin|cos|tan)\(.*\)* /g);
    
            var base_level_terms = base_level.split(/(?=\+|\-)/);
            var isVariable =  new RegExp(/^[^0-9]+$/);
            var isSignedNumber = new RegExp(/^[\-|\+]*[0-9]+$/)
    
            //var simplified_terms = [];
            var valid_numbers = ''
            base_level_terms.forEach((term,index) => {
                if(isSignedNumber.test(term)) {
                    valid_numbers += term;
                }
                if(!isVariable.test(term)) {
    
                }
            })
            if(valid_numbers.length > 0) {
                var simplified_num = eval(valid_numbers);
                console.log('simplified_num: '+simplified_num);
                var simplified_str = simplified_num.toString();
                if(simplified_str[0] != '-' || simplified_str[0]!='+') {
                    base_level = base_level.replace(valid_numbers,'+'+simplified_str)
                }
                console.log('base_level:  '+base_level);
                
                //answerLine.textContent = "";
                console.log("Error when evaluating expression");


                
            }
            try {
                
                if(eval(base_level)==Infinity) {
                
                    answerLine.textContent = " = " + String.fromCharCode(8734);
                }
                else {
                    answerLine.textContent = " = " + eval(base_level).toFixed(4);
                }
            }
            catch(error) {
                answerLine.textContent = " =  NaN";
            }
            
            
           
            
            
            // /*\([^)]*\)*.*/g
           

            
        }
    }
    updateEquationString(c) {
        
        
        console.log("complete str: " + this.complete_equation_str);
        if(this.current_function.name !=null) {
            //this.complete_equation_str = this.complete_equation_str.replace(/(\/|\*)*(?!Math\.)PI/,'');

            this.complete_equation_str = this.complete_equation_str.substr(0,this.current_function.lastParenthesisIndex) 
            + c + this.complete_equation_str.substr(this.current_function.lastParenthesisIndex+1);
            
            


            console.log("first half: "+ this.complete_equation_str.substr(0,this.current_function.lastParenthesisIndex) )
            console.log("middle: "+c);
            console.log("second half: " + this.complete_equation_str.substr(this.current_function.lastParenthesisIndex));
            
           
            
           
            this.current_function.lastParenthesisIndex = this.current_function.lastParenthesisIndex + c.length;
        }
        else {this.complete_equation_str += c;}
        
        
        
        // this.complete_equation_str = this.complete_equation_str.replace('SIN(','Math.sin(radians_to_degrees(');
        // this.complete_equation_str = this.complete_equation_str.replace('COS(','Math.cos(radians_to_degrees(')
        // this.complete_equation_str = this.complete_equation_str.replace('TAN(','Math.tan(radians_to_degrees(')
        
    }
    updateVariableList(loadCharBuff=false) {
        //this.complete_equation_str = this.complete_equation_str.replace(/[^Math.]*PI/,'');
        
        // this.complete_equation_str = this.complete_equation_str.replace('PI*Math.PI','Math.PI');
        // this.complete_equation_str = this.complete_equation_str.replace('SIN(','Math.sin(');
        // this.complete_equation_str = this.complete_equation_str.replace('COS(','Math.cos(')
        // this.complete_equation_str = this.complete_equation_str.replace('TAN(','Math.tan(')

        this.variableList.forEach((item,index) => {
            if(item.name=='TAN') {
                if(item.hasRangeElement) {
                    document.getElementById(item.name+"_varItem").remove();
                  
                }
                this.variableList.splice(index);
                
            }
            if(item.name == 'COS') {
                if(item.hasRangeElement) {
                    document.getElementById(item.name+"_varItem").remove();
                }
                this.variableList.splice(index);
            }
            if(item.name=='SIN') {
                if(item.hasRangeElement) {
                    document.getElementById(item.name+"_varItem").remove();
                }
                this.variableList.splice(index);
            }
            if(item.name=='E') {
                if(item.hasRangeElement) {
                    document.getElementById(item.name+"_varItem").remove();
                }
                this.variableList.splice(index);
            }
            if(item.name=='') {
                if(item.hasRangeElement) {
                    document.getElementById(item.name+"_varItem").remove();
                }
                this.variableList.splice(index);
            }
        })
        
        

        this.variableList.forEach((v) =>{
            if(this.complete_equation_str.search(v.name)==-1) {
                console.log(v.name +" not in expression");
                this.variableList.splice(v);
            }
        })
    
        if(loadCharBuff) {
            var alreadyMade = false;
            this.variableList.forEach((item) => {
                if(item.name==this.charBuffer) {
                    alreadyMade = true;
                }
            })
            if(!alreadyMade) {this.variableList.push({name: this.charBuffer, value:null, hasRangeElement:false});}
            this.charBuffer = '';
            this.showVariablePanel('show');
        }
        
        
        if(this.variableList.length== 0) {
            console.log("ieieieiei");
            this.showVariablePanel('hide');
        }
        
        
        //console.log("Variables: " + this.variableList);
    }

    keyHandler = (e) => {
        
       
        if(window.location.href != 'http://localhost:8080/') return;
        console.log(e.code);
        if(e.shiftKey) {
            
            if(e.code=='Equal') {
                console.log("Plus");
                if(this.currentExprType=='var') this.updateVariableList(true);
                this.changeEquationLineEdit('+');

                //this.currentTermObj.inner_term_iter += 1;
                //document.getElementById('equationLineEdit').insertAdjacentHTML('beforeend','+');
                this.currentTermStr += '+';
                
                //this.complete_equation_str +='+';
                this.updateEquationString('+');
                this.currentExprType = 'op';
                //this.currentTermObj.str_form += this.currentTermStr;
            }
            
            else if(e.code=='Minus') {
                if(this.currentExprType=='var') this.updateVariableList(true);
                if(this.currentTermStr.endsWith("_")) {console.log("INPUT ERROR");}
                else {
                    //this.currentTermStr 
                    this.currentExprType = 'op';
                    this.typeMode = 'subscript';
                }
            }
            else if(e.code=='Digit1') {
                console.log("Factorial");


            }
            else if(e.code=='Digit6') {
                console.log("ToThePower");
                if(this.currentExprType=='var') this.updateVariableList(true);
                
                if(this.currentTermStr.endsWith("^")) {console.log("INPUT ERROR");console.log(this.currentTermStr)}
                else {
                    this.currentExprType = 'op';
                    this.currentTermStr += '^';
                    //this.complete_equation_str += 'Math.pow';
                    //this.complete_equation_str +='(';
                    
                    
                    this.typeMode = 'superscript';
                    

                }
            }
            else if(e.code=='Digit7') {
                console.log("Percent");
                
                
            }
            else if(e.code=='Digit8') {
                if(this.currentExprType=='var') this.updateVariableList(true);
                console.log("Multiply");
                
                this.changeEquationLineEdit("*");
                this.currentTermStr +='*';
                //this.complete_equation_str +='*';
                this.updateEquationString('*');
                this.currentExprType = 'op';
     
            }
            else if(e.code=='Digit9') {
                //document.getElementById('equationLineEdit').insertAdjacentHTML('afterbegin','(');
                //document.getElementById('equationLineEdit').insertAdjacentHTML('beforeend',')');
                if(this.currentExprType=='var') this.updateVariableList(true);

               
                this.current_parentheses_depth +=1;
               
                // let newTermAddress = this.currentTermObj.term_addr.concat([this.currentTermObj.inner_term_iter]);
                // this.currentTermObj.str_form += `Term[${newTermAddress}]`;
                
                // this.changeEquationLineEdit("(");
                // let newTerm = new Term(newTermAddress, this.currentTermObj);
                // allTerms.push(newTerm);
                this.changeEquationLineEdit("(");
                this.currentTermStr += '(';

                //this.complete_equation_str +='(';
                this.updateEquationString('(');

                //this.addParentheses();
                // this.currentTermObj = newTerm;
                
                
            }
            else if(e.code=='Digit0') {
                    this.updateEquationString(')');
                    //this.complete_equation_str +=')';
                    this.changeEquationLineEdit(")");
                    if(this.currentExprType=='var') this.updateVariableList(true);
                    //this.updateVariableList();
                    this.current_parentheses_depth -=1;
                    
                    this.complete_equation_str +=')';
                    // this.currentTermObj.str_form = this.currentTermStr;
                    // this.currentTermObj = this.currentTermObj.parent;
                    
                    // this.currentTermStr += ')';
                    
                
                

                
            }
        }
        else if(e.code=='ArrowRight') {
            if(this.currentExprType=='var') this.updateVariableList(true);
            this.typeMode='normal';
            let currentScope = this.currentTermStr.slice(this.current_function.lastParenthesisIndex);
            if(this.current_function.name != null) {
                this.current_function.name = null;//eqLineEdit.insertAdjacentHTML('beforeend',expr);
                this.current_function.lastParenthesisIndex = 0;
                
            }
            this.updateVariableList();
        }
        else if(e.code=='Minus') {
            console.log('Minus');
            
            if(this.currentTermStr.endsWith("-")) {console.log("INPUT ERROR");}
            else {
                if(this.currentExprType=='var') this.updateVariableList(true);
       
                this.currentTermStr +='+-';    //added '+' for when using regexp processing later
          
                this.updateEquationString('-');
                this.changeEquationLineEdit("-");      //
                this.currentExprType=='op'
                //this.currentTermObj.str_form = this.currentTermStr;
            }
           
            
        }
        else if(e.code=='Slash') {
            console.log('Divide');
            if(this.currentExprType=='var') this.updateVariableList(true);
            if(this.currentTermStr.endsWith("/")) {console.log("INPUT ERROR");}
            else {
                //this.currentTermStr.push('/');
                this.changeEquationLineEdit("/");
                //this.complete_equation_str +='/';
                this.updateEquationString('/');
                //document.getElementById('equationLineEdit').textContent += '/';
                this.currentExprType = 'op';
            }
            
        }
        
        
        else if(e.code == "Backspace") {
            /*if(this.charBuffer.length > 0) {
                
                this.charBuffer = this.charBuffer.substring(0, this.charBuffer.length - 1);
            }*/
            if(this.complete_equation_str.length>0) {

                if(this.current_function.name !=null) {
                    this.complete_equation_str = this.complete_equation_str.substr(0,this.current_function.lastParenthesisIndex-1) 
                        + this.complete_equation_str.substr(this.current_function.lastParenthesisIndex);

                    --this.current_function.lastParenthesisIndex;
                    this.changeEquationLineEdit("Backspace");
                }
                else {
                    this.currentTermStr = this.currentTermStr.substring(0, this.currentTermStr.length - 1);
                    this.complete_equation_str = this.complete_equation_str.substring(0, this.complete_equation_str.length - 1);
                    this.changeEquationLineEdit("Backspace");
                }

            }
            
        }
        else if(e.code.substr(0,3)=="Key") {
            this.charBuffer +=e.code[3];
            
            this.currentExprType = 'var';
            this.changeEquationLineEdit(e.code[3]);
            
            this.currentTermStr +=e.code[3];
            
            this.updateEquationString(e.code[3]);
            //this.complete_equation_str +=e.code[3];

        }
         
        else if(e.code.substr(0,5)=="Digit") {
            if(this.currentExprType=='var') this.updateVariableList(true);
            //var intVal = parseInt(e.code[5]);
            this.currentTermStr += e.code[5];
            this.updateEquationString(e.code[5]);
            //this.complete_equation_str += e.code[5];
            this.changeEquationLineEdit(e.code[5]);
            
            
            this.currentExprType = 'num';
            this.updateVariableList();
        }
        if(this.charBuffer =='E') {
            this.changeEquationLineEdit('e','E');
            
            this.complete_equation_str = this.complete_equation_str.replace('E', "Math.exp()");
            this.current_function.name = 'exp';
            this.current_function.lastParenthesisIndex = this.complete_equation_str.length -1;

            
            this.updateVariableList();
            
        }
        if(this.charBuffer.includes('SIN')) {
            
            this.changeEquationLineEdit('sin()','SIN');
            
            this.complete_equation_str = this.complete_equation_str.replace('SIN', "Math.sin(radians_to_degrees())");
            this.current_function.name = 'sin';
            this.current_function.lastParenthesisIndex = this.complete_equation_str.length -2;
            

            this.updateVariableList();
            
        }
        if(this.charBuffer.includes('COS')) {
            this.changeEquationLineEdit('cos()','COS');
            this.complete_equation_str = this.complete_equation_str.replace('COS', "Math.cos(radians_to_degrees())");
            this.current_function.name = 'cos';
            this.current_function.lastParenthesisIndex = this.complete_equation_str.length -2;
            this.updateVariableList();
        }

        if(this.charBuffer.includes('TAN')) {
            this.changeEquationLineEdit('tan()','TAN');
            this.complete_equation_str = this.complete_equation_str.replace('TAN', "Math.tan(radians_to_degrees())");
            this.current_function.name = 'tan';
            this.current_function.lastParenthesisIndex = this.complete_equation_str.length -2;
            this.updateVariableList();
        }

        if(this.charBuffer.includes('PI')) {
            
            this.changeEquationLineEdit(String.fromCharCode(960),'PI');

            //this.complete_equation_str = this.complete_equation_str.replace('PI', "Math.PI");
            //this.current_function.lastParenthesisIndex = this.complete_equation_str.length +3;


            if(this.current_function.name != null) {
                this.current_function.lastParenthesisIndex = this.current_function.lastParenthesisIndex -2;
            }
            this.complete_equation_str =  this.complete_equation_str.replace(/(?<!Math\.)PI/,'');
            this.charBuffer = this.charBuffer.replace(/PI/,'');
            
            this.currentTermStr += String.fromCharCode(960);
            
            //if(this.currentExprType=='num' || this.currentExprType=='var') this.updateEquationString("*Math.PI");
            //else {this.updateEquationString("Math.PI");}
            this.updateEquationString("Math.PI");
            console.log(this.complete_equation_str);
            this.updateVariableList();


            this.currentExprType = 'num';
        }
        
        
        // var answerLine = document.getElementById('answerLine');
        // try {
            
        //     answerLine.textContent = "";
        //     if(eval(this.complete_equation_str)==Infinity) {
                
        //         answerLine.textContent = " = " + String.fromCharCode(8734);
        //     }
        //     else {
        //         answerLine.textContent = " = " + eval(this.complete_equation_str).toFixed(4);
        //     }
            
            
        //     console.log("current answer = " + eval(this.complete_equation_str).toFixed(4));
        // }
        // catch(error) {
        //     answerLine.textContent = "";
        //     console.log("Error when evaluating expression");
        // }


    }
   

    
    

    componentDidMount() {
        this.makeDraggable('cwh');
        this.context = this.canvasRef.current.getContext('2d');
        let w = document.getElementById("cwh");
        window.addEventListener("keydown", this.keyHandler);
        
        

        //window.setInterval(()=>{console.log(this.variableList)}, 5000);
        
        
        this.complete_equation_str = ''
        // this.baseLevelTerm = new Term([0]);
        // allTerms.push(this.baseLevelTerm);
        //this.currentTermObj = this.baseLevelTerm;
        console.log("here");
        
        // if(window.location.pathname != this.lastWindowPathName) {
        //     console.log("resetting event listener")
        //     //try--> RESETTING EVENT listener
        //     window.removeEventListener("keydown", this.keyHandler);
        //     window.addEventListener("keydown", this.keyHandler);
        //     this.lastWindowPathName = window.location.pathname;
        // }
            
    }

    
    showVariablePanel(action) {
        var calWindow = document.getElementById('cw');
        if(action=='show') {
            
            calWindow.classList.add('extended');

            //****************************************************************************** */
            var varPanel = document.getElementById('variablePanel');
            varPanel.style.display='inline-grid';
            this.variableList.forEach((item,index) => {
                if(!item.hasRangeElement) {
                    item.hasRangeElement=true;
                    varPanel.insertAdjacentHTML('beforeend', 
                        `
                        <div id=${item.name+"_varItem"} class='varItem' >
                            <label for=${item.name+"_input"}>${item.name}:</label>
                            <Input id=${item.name+"_input"} type="number"/>
                            
                        </div>
                        `
                    )
                    //document.getElementById(item.name+"_varItem").style.display="inline"
                    document.getElementById(item.name+"_input").addEventListener("change", (e)=>{item.value=e.target.value;})
                    document.getElementById(item.name+"_input").style.maxWidth="50px";
                    
                }
            })
            //****************************************************************************** */
            this.variablePanelShowing = true;

        }
       
        else if(action=='hide'){
            var varPanel = document.getElementById('variablePanel');
            varPanel.style.display='none';
            calWindow.classList.remove('extended');
        }
        
    }

    setOpen = () =>{
        
        
        let w = document.getElementById("cw");
        
        if(w.style.display=="none") {
            
            w.style.display="inline-grid";
        }
        else {
            w.style.display="none";
        }
        
    }
    
    showGraph = () =>{
        let w = document.getElementById("cw");
        if(this.currentCalcOption=="Graphing" && this.graphExtended) {
            
            document.getElementById('cw').classList.remove('graph');
            document.getElementById('graphCanvas').style.display='none';
            this.graphExtended = false;
            
        }
        else {
            document.getElementById('cw').classList.add('graph');
            this.initGraph();
            
            document.getElementById('graphCanvas').style.display='inline-grid';
            this.graphExtended =true;
            this.startGraphing();
        }
    }       
    
    showStandard = () => {
        if(this.currentCalcOption=="Standard") {
            //document.getElementById('cw').classList.remove('extended');
            
            document.getElementById('abg').childNodes.forEach((node) => {
                node.style.display='none';
            })
            document.getElementById('abg').style.display='none';
            document.getElementById('graphCanvas').style.height = '300px';
        }
    }

    showAdvanced = () =>{
        if(this.currentCalcOption=="Advanced") {
            //code for displaying panel
            console.log("extending calculator")

            document.getElementById('abg').childNodes.forEach((node) => {
                node.style.display='block';
            })
            document.getElementById('abg').style.display='inline-grid';
           
            document.getElementById('graphCanvas').style.height = '380px';
        
        }
        
    }

    
    dropDownItemClicked = (e, { value }) => {
       switch(e.target.innerText) {
           case "Settings":
                this.toggleSettings(e);
                break;

           case "Standard":
                document.getElementById('cwh').lastChild.textContent = document.getElementById('cwh').lastChild.textContent.replace(this.currentCalcOption, "Standard");
             
                this.currentCalcOption = "Standard";
                this.showStandard();
                break;

            case "Advanced":
                document.getElementById('cwh').lastChild.textContent = document.getElementById('cwh').lastChild.textContent.replace(this.currentCalcOption, "Advanced");
                
                this.currentCalcOption = "Advanced";
                this.showAdvanced();
                break;

            case "Graphing":
                document.getElementById('cwh').lastChild.textContent = document.getElementById('cwh').lastChild.textContent.replace(this.currentCalcOption, "Graphing");
                this.currentCalcOption = "Graphing";
                this.showGraph();
    
                break;
       }

    }



    calcButtonPressed = (e) => {
        console.log(e.target.id);
        var code = e.target.id;
        if(code.substr(0,3)=='num') {
            //document.getElementById('equationLineEdit').insertAdjacentHTML('beforeend',parseInt(code[3]));
            //this.changeEquationLineEdit(parseInt(code[3]));
            this.changeEquationLineEdit(code[3]);
            this.complete_equation_str += code[3];
        }
        else {

        
            switch(code) {
                case 'sqrt':
                    break;
                case 'plusmn':
                    break;
                case 'multiply':
                    this.changeEquationLineEdit('*');
                    this.complete_equation_str += '*';
                    break;
                case 'minus':
                    this.changeEquationLineEdit('-');
                    this.complete_equation_str += '-';
                    break;
                case 'plus':
                    this.changeEquationLineEdit('+');
                    this.complete_equation_str += '+';
                    break;
                case 'divide':
                    
                    this.changeEquationLineEdit('/');
                    this.complete_equation_str += '/';
                    break;

                case 'clr':
                    
                    this.complete_equation_str = ''
                    document.getElementById('equationLineEdit').textContent = '';

                    while (document.getElementById('equationLineEdit').firstChild) {
                        document.getElementById('equationLineEdit').removeChild(document.getElementById('equationLineEdit').lastChild);
                    }
                    
                    


                    this.variableList.forEach((v)=> {
                        document.getElementById(v.name+'_varItem').remove();
                    })
                   

                    while (document.getElementById('variablePanel').firstChild) {
                        document.getElementById('variablePanel').removeChild(document.getElementById('variablePanel').lastChild);
                    }
                    this.showVariablePanel('hide');
                    this.currentExprType = 'num';
                    this.typeMode = 'normal';
                    this.current_function = {name:null, lastParenthesisIndex:0};
                    this.currentTermStr = '';
                    this.variableList =[];
                    break;

            }
        }
    }
    

    render() {
        const { data } = this.state;
        
        return (
            <div id ="cw" class="calcWindow" tabindex="1" onFocus={this.focusIn}>
                    
                    <div id="cwh" class="calcWindowHeader" onFocus={this.focusIn}>
                        <Dropdown className="optionDropdown" options={calcOptions} icon={<Icon name="bars"/>} value={data} onChange={this.dropDownItemClicked}>
                            
                        </Dropdown>
                        
                        {"Calculator: "+this.currentCalcOption}
                        <button id="calcExitButton" class="exitButton" 
                            onClick={() =>{document.getElementById('cw').style.display="none";}}>
                           <CloseIcon />
                            
                        </button>
                    </div>
                    
                    <p id="equationLineEdit" class="equationLineEdit" />
                    <p class="answerLine" id="answerLine"/>
                    
                    
                    
                    <div class="calcButtonGrid">
                        <div id="abg" class="advancedButtonGroup" style={{display: 'none'}}>
                            <div  style={{display: 'none'}}><button id='integral' class="calcButton" onClick={this.calcButtonPressed}  value="button">&nbsp;&nbsp;&int;</button></div>
                            <div  style={{display: 'none'}}><button id='sum' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;&sum;</button></div>
                            <div  style={{display: 'none'}}><button id='prod' class="calcButton" onClick={this.calcButtonPressed}  value="button">&nbsp;&nbsp;&prod;</button></div>
                            <div  style={{display: 'none'}}><button id='infinity' class="calcButton" onClick={this.calcButtonPressed}value="button">&nbsp;&nbsp;&infin;</button></div>
                            
                            <div  style={{display: 'none'}}><button id='sine' class="calcButton" onClick={this.calcButtonPressed} value="button">sin</button></div>
                            <div  style={{display: 'none'}}><button id='cos' class="calcButton" onClick={this.calcButtonPressed} value="button">cos</button></div>
                            <div  style={{display: 'none'}}><button id='tan' class="calcButton" onClick={this.calcButtonPressed} value="button">tan</button></div>
                            <div  style={{display: 'none'}}><button id='inverse' class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;<sup>1</sup>&frasl;<sub>x</sub></button></div>
                            
                            
                        </div>  
                        
                        <div id="stdBtnGroup" class="standardButtonGroup">

                            <div  ><button id='plusmn'class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;&nbsp;&plusmn;</button></div>
                            <div ><button id='sqrt'class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;&radic;</button></div>
                            <div ><button id='percent'class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;&nbsp;%</button></div>
                            <div  ><button id='divide'class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;&nbsp;&divide;</button></div>
                    
                            <div  ><button id='num7'class="calcButton" onClick={this.calcButtonPressed}  value="button">&nbsp;&nbsp;7</button></div>
                            <div ><button id='num8' class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;&nbsp;8</button></div>
                            <div ><button id='num9' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;9</button></div>
                            <div  ><button id='multiply'class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;&times;</button></div>

                            <div ><button id='num4' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;4</button></div>
                            <div  ><button id='num5' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;5</button></div>
                            <div ><button id='num6' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;6</button></div>          
                            <div  ><button id='minus' class="calcButton" onClick={this.calcButtonPressed}  value="button">&nbsp;&nbsp;&minus;</button></div>

                        
                            <div ><button id='num1' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;1</button></div>
                            <div ><button id='num2' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;2</button></div>
                            <div ><button id='num3' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;3</button></div>    
                            <div  ><button id='plus' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;+</button></div>

                            <div ><button id="clr" class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;C</button></div>
                            <div><button id='num0' class="calcButton" onClick={this.calcButtonPressed} value="button" >&nbsp;&nbsp;0</button></div>
                            <div ><button id='deci' class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;&nbsp;.</button></div>
                            <div  ><button id='equalsButton' class="calcButton" onClick={this.calcButtonPressed} value="button">&nbsp;&nbsp;=</button></div>
                        </div>
                        
                    </div>
                    <div class="variablePanel" id="variablePanel" style={{display: 'none'}}></div>
                    <canvas ref={this.canvasRef} id="graphCanvas" class="graphCanvas" style={{display: 'none'}}>
                        

                    </canvas>

                    

               
                

                

            </div>

      


        );
    }
}

CalculatorModal.contextTypes = {
    toggleSettings:PropTypes.func,
}

export default CalculatorModal;