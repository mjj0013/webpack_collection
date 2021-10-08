import React from 'react';

import {Button, Menu, Accordion,Tab, Dropdown,Icon ,Label, Segment} from 'semantic-ui-react';

//import { ColorPicker, useColor } from "react-color-palette";
import { HexColorPicker } from "react-colorful";




import './SettingsModal.css'



import {CloseIcon} from '../icons/importSVG';

const gradientChoices = {
    
    background: [
        {text:"None", value:"NoneBackground"},
        {text:"Linear", value:"LinearBackground"},
        {text:"Radial", value:"RadialBackground"},
    ],
    buttons: [
        {text:"None", value:"NoneButtons"},
        {text:"Linear", value:"LinearButtons"},
        {text:"Radial", value:"RadialButtons"},
    ],
    lineEdits: [
        {text:"None", value:"NoneLineEdits"},
        {text:"Linear", value:"LinearLineEdits"},
        {text:"Radial", value:"RadialLineEdits"},
    ],
    borders: [
        {text:"None", value:"NoneBorders"},
        {text:"Linear", value:"LinearBorders"},
        {text:"Radial", value:"RadialBorders"},
    ]
}
const fontFamChoices = [
    {text:'Courier',value:"Courier"},
    {text:'Play',value:"Play"},
    {text:'Cursive',value:"Cursive"},
    {text:'System-UI',value:"System-UI"},

    {text:'Serif',value:"Serif"},
    {text:'Fantasy',value:"Fantasy"},
    {text:'Monospace',value:"Monospace"},
]
const fontFamTranslation = {
    'Courier':`"Lucida Console", "Courier New", monospace`,
    'Play': `'Play-Regular'`,
    'Cursive':`cursive`,
    'System-UI': `system-ui`,
    'Serif':`Times, "Times New Roman", Georgia, serif;`,
    'Fantasy':`fantasy`,
    'Monospace':`"Lucida Console", Courier, monospace;`
}

class SettingsModal extends React.Component {


    constructor(props) {
        super(props);
        
        this.makeDraggable = this.makeDraggable.bind(this);
        this.closeDragElement = this.closeDragElement.bind(this);
        this.elementDrag = this.elementDrag.bind(this);
        this.dragMouseDown = this.dragMouseDown.bind(this);

        this.posPrediction = {pos1:0, pos2:0, pos3: 0, pos4:0}
        this.currentFocusedElement=null;
        this.handleClick = this.handleClick.bind(this);
        this.handleTabChange = this.handleTabChange.bind(this);
        this.getCalcSettingsTabContents = this.getCalcSettingsTabContents.bind(this);
        this.colorFieldChange = this.colorFieldChange.bind(this);
        
        
        this.state = { 
            activeIndex: 0 ,
            tabActiveIndex:0,
            backgroundGradient:0,
            buttonsGradient:0,
            lineEditsGradient:0,
            bordersGradient:0,
         
        }
        this.applySettings = this.applySettings.bind(this);
        this.settingsChanged = this.settingsChanged.bind(this);
        this.currentFocusedElement = null;
        

        this.currentFocusedWindow=null;
        this.changedSettings = [];
        this.settings = {
            general:{
                color: {
                    background:null,
                    buttons:null,
                    lineEdits:null,
                    borders:null,
                    backgroundGradient:null,
                    buttonsGradient:null,
                    lineEditsGradient:null,
                    bordersGradient:null,
                },
                font: {
                    font_family:null,
                    font_color:null
                }

            
            },
            navBar:{
                color: {
                    background:null,
                    buttons:null,
                    lineEdits:null,
                    borders:null,
                    backgroundGradient:null,
                    buttonsGradient:null,
                    lineEditsGradient:null,
                    bordersGradient:null,
                },
                font: {
                    font_family:null,
                    font_color:null
                }
            },
            calculator: {
                color: {
                    background:null,
                    buttons:null,
                    lineEdits:null,
                    borders:null,
                    backgroundGradient:null,
                    buttonsGradient:null,
                    lineEditsGradient:null,
                    bordersGradient:null,
                },
                font: {
                    font_family:null,
                    font_color:null
                }

            }


        }
        this.panes = [
            {menuItem: 'General Settings', render: () => <Tab.Pane index={0} >Insert General Settings</Tab.Pane>},
            {menuItem: 'Navigation Bar Settings', render: () => <Tab.Pane index={1} >Insert General Settings</Tab.Pane>},
            {menuItem:'Calculator Settings', render: ()=> <Tab.Pane>{this.getCalcSettingsTabContents()}</Tab.Pane>},
            
            

        ]
        
        
    }
    handleTabChange = (e, { activeIndex }) => {
        console.log(e.target.innerHTML)
        switch(e.target.innerHTML) {
            case "General Settings":
                this.setState({  tabActiveIndex: 0 })

                break;
            case "Navigation Bar Settings":
                this.setState({  tabActiveIndex: 1 })
                break;
            case "Calculator Settings":
                this.setState({  tabActiveIndex: 2 })
                break;
        }
        

        
       // this.setState({ activeIndex})
    }

    settingsChanged = (e,data) =>{
        console.log(data);
        //For this.state.tabActiveIndex:    0 --> General, 1--> Nav bar, 2--> Calculator
        var elementKey = "general";
        if(this.state.tabActiveIndex==0) {
            elementKey = "general";
           
        }
        if(this.state.tabActiveIndex==1) {
            elementKey = "navBar";
            
        }
        if(this.state.tabActiveIndex==2) {
            elementKey = "calculator";
       
        }
        

        switch(data) {
            
            case "NoneBackground":
                
                this.settings[elementKey].backgroundGradient = 'none';
                break;
            case "LinearBackground":
                this.settings[elementKey].backgroundGradient = 'linear-gradient';
                break;
            case "RadialBackground":
                this.settings[elementKey].backgroundGradient = 'radial-gradient';
                break;
            case "NoneButtons":
                this.settings[elementKey].buttonsGradient = 'none';
                break;
            case "LinearButtons":
                this.settings[elementKey].buttonsGradient = 'linear-gradient';
                break;
            case "RadialButtons":
                this.settings[elementKey].buttonsGradient = 'radial-gradient';
                break;
            case "NoneLineEdits":
                this.settings[elementKey].lineEditsGradient = 'none';
                break;
            case "LinearLineEdits":
                this.settings[elementKey].lineEditsGradient = 'linear-gradient';
                break;
            case "RadialLineEdits":
                this.settings[elementKey].lineEditsGradient = 'radial-gradient';
                break;
            case "NoneBorders":
                this.settings[elementKey].bordersGradient = 'none';
                break;
            case "LinearBorders":
                this.settings[elementKey].bordersGradient = 'linear-gradient';
                break;
            case "RadialBorders":
                this.settings[elementKey].bordersGradient = 'radial-gradient';
                break;
        }
  
        
    }

    applySettings = (e) =>{
        var elementKey='general';
        var elementID = 'body';

        if(this.state.tabActiveIndex==0) {
            elementKey = "general";
           
        }
        if(this.state.tabActiveIndex==1) {
            elementKey = "navBar";
            elementID = 'navBar'
        }
        if(this.state.tabActiveIndex==2) {
            elementKey = "calculator";
            elementID='cw';
       
        }
        var element = document.getElementById(elementID)

        if(this.settings[elementKey].color['background']!=null) {element.style.backgroundColor=this.settings[elementKey].color['background']}
        if(this.settings[elementKey].color['buttons']!=null) {
            if(elementID=='cw') {
                element.style.backgroundColor=this.settings[elementKey].color['background']
                var buttons = document.getElementsByClassName('calcButton');
                for(var i=0;i<buttons.length; ++i) {
                    buttons[i].style.backgroundColor = this.settings[elementKey].color['buttons'];
                }
            }
            
            

        }
        if(this.settings[elementKey].color['lineEdits']!=null) {}

        if(this.settings[elementKey].color['borders']!=null) {element.style.border = `1px solid ${this.settings[elementKey].color['borders']}`;}
        if(this.settings[elementKey].color['backgroundGradient']!=null) {}
        if(this.settings[elementKey].color['buttonsGradient']!=null) {}
        if(this.settings[elementKey].color['lineEditsGradient']!=null) {}
        if(this.settings[elementKey].color['bordersGradient']!=null) {}


        if(this.settings[elementKey].font['font_family']!=null) {
            element.style.fontFamily = fontFamTranslation[this.settings[elementKey].font['font_family']];
        }
        if(this.settings[elementKey].font['font_color']!=null) {
            element.style.color = this.settings[elementKey].color['borders'];
        }

        

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

        let w = document.getElementById("sw");
        w.style.top = (w.offsetTop - this.posPrediction.pos2) + "px";
        w.style.left = (w.offsetLeft - this.posPrediction.pos1) + "px";
        return false;
    }

    dragMouseDown(e) {
        
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

    componentDidMount() {
        this.makeDraggable("swh");
        
        
    }
    

    handleClick = (e, titleProps) => {
        const { index } = titleProps
        const { activeIndex } = this.state
        const newIndex = activeIndex === index ? -1 : index
    
        this.setState({ activeIndex: newIndex })
      }

    colorFieldChange(e) {
        var elementKey='general';
        if(this.state.tabActiveIndex==0) {
            elementKey = "general";
           
        }
        if(this.state.tabActiveIndex==1) {
            elementKey = "navBar";
            
        }
        if(this.state.tabActiveIndex==2) {
            elementKey = "calculator";
       
        }
        //this.color = value;
        console.log(e.target.id)
        if(e.target.id=="backgroundColorChanger") {
            this.settings[elementKey].color.background = e.target.value;
        }
        if(e.target.id=="buttonColorChanger") {
            this.settings[elementKey].color.buttons = e.target.value;
        }
        if(e.target.id=="lineEditColorChanger") {
            this.settings[elementKey].color.lineEdits = e.target.value;
        }
        if(e.target.id=="borderColorChanger") {
            this.settings[elementKey].color.borders = e.target.value;
        }
        if(e.target.id=="fontColorChanger") {
            this.settings[elementKey].font.font_color = e.target.value;
        }

        console.log(this.settings);

    }
    getCalcSettingsTabContents() {
        const { activeIndex } = this.state;
        const { bordersGradient } = this.state;
        const { buttonsGradient } = this.state;
        const { backgroundGradient } = this.state;
        const { lineEditsGradient } = this.state;
        return(
        <Segment>
            <Accordion fluid styled>
                <Accordion.Title
                    active={activeIndex === 0}
                    index={0}
                    onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        Font
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 0}>
                    <Dropdown className="optionDropdown" options={fontFamChoices} text="Font-Family" icon={<i class="dropdown icon"></i>}>
                    </Dropdown>
                    <label for="fontColorChanger">Font Color</label>
                    <input id="fontColorChanger" type="color"  onChange={this.colorFieldChange}/>
                </Accordion.Content>
            </Accordion>
        
            <Accordion fluid styled>
                <Accordion.Title
                    active={activeIndex === 1}
                    index={1}
                    onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        Color
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 1}>
                    <Dropdown text="Presets" icon="caret right"floating labeled button className='presetIcon'>
                        
                    </Dropdown>
                
                    <Segment.Group>
                        <Segment className="settingsSubAttr">Background
                            <input id="backgroundColorChanger" type="color"  onChange={this.colorFieldChange}/>


                            <Dropdown text="Gradient"  value={backgroundGradient} options={gradientChoices.background} icon="caret right" floating labeled button>
                                
                            </Dropdown>
                        </Segment>
                        <Segment className="settingsSubAttr">Buttons
                            <input id="buttonColorChanger" type="color" onChange={this.colorFieldChange}/>
                            <Dropdown text="Gradient"  value={buttonsGradient} options={gradientChoices.buttons} icon="caret right" onChange={this.settingsChanged} floating labeled button>
                                
                            </Dropdown>

                        </Segment>
                        <Segment className="settingsSubAttr">Line Edits
                            <input id="lineEditColorChanger" type="color" onChange={this.colorFieldChange}/>
                            <Dropdown text="Gradient"  value={lineEditsGradient} options={gradientChoices.lineEdits} icon="caret right" onChange={this.settingsChanged} floating labeled button>
                            </Dropdown>
                        </Segment>
                        <Segment className="settingsSubAttr">Borders
                            <input id="borderColorChanger" type="color" onChange={this.colorFieldChange} />
                            <Dropdown text="Gradient"  value={bordersGradient} options={gradientChoices.borders} icon="caret right" onChange={this.settingsChanged} floating labeled button>
                            </Dropdown>
                        </Segment>
                    </Segment.Group>
                </Accordion.Content>
            </Accordion>
        </Segment>
    );
    }



    


    render() {
        
        
        return (
            <div id ="sw" class="settingsWindow">
                <div id="swh" class="settingsWindowHeader">

                    {"Settings: "+ this.currentFocusedElement}
                    <button id="settingsExitButton" class="exitButton" 
                        onClick={() =>{document.getElementById('sw').style.display="none";}}>
                        <CloseIcon />
                    </button>
                </div>
                <Tab id="settingsTabs"  panes={this.panes} onTabChange={this.handleTabChange}/>
                <Button id="settingsApplyButton" onClick={(e)=>this.applySettings(e)} >Apply</Button>
                
                            
                            
                        


                    

            </div>
        );
    }
}

export default SettingsModal;
