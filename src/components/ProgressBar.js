import React, {useState, createRef} from 'react';

import "regenerator-runtime/runtime";

export class ProgressBar extends React.Component {
    constructor(props) {
        super(props);
        this.width = props.width
        this.height = props.height
        this.backgroundColor = props.backgroundColor? props.backgroundColor : 'hsl(0,0%,75%)'
        this.statusColor = props.mainColor? props.mainColor : 'hsl(0,0%,35%)'
        this.maxValue = props.max;
        this.minValue = props.min;
        this.rx = props.rx? props.rx : 'auto';
        this.ry = props.ry? props.ry : 'auto';
        this.surfaceStyle = props.surfaceStyle? props.surfaceStyle : 'solid';       //solid, linear, radial

        var colorInfoRegExp = new RegExp(/(?<=(hsl)a*\()(.)*(?=\))/g)
        

        var backgroundColorInfo = this.backgroundColor.match(colorInfoRegExp)[0];
        backgroundColorInfo = backgroundColorInfo.replaceAll('%','')
        backgroundColorInfo = backgroundColorInfo!=null? backgroundColorInfo.split(',').filter((x)=>x!=' '): null;

        var statusColorInfo = this.statusColor.match(colorInfoRegExp)[0];
        statusColorInfo = statusColorInfo.replaceAll('%','')
        statusColorInfo = statusColorInfo!=null? statusColorInfo.split(',').filter((x)=>x!=' '): null;

        this.linearInfo = {
            background:{
                hue:backgroundColorInfo[0],
                sat:backgroundColorInfo[1],
                brig1:backgroundColorInfo[2],
                brig2:(parseInt(backgroundColorInfo[2])+10).toString(),
                brig3:(parseInt(backgroundColorInfo[2])+20).toString(),
                alpha:backgroundColorInfo.length==4? backgroundColorInfo[3] : '',
                prefix:this.backgroundColor[3]=='a'? 'hsla' : 'hsl'
            },
            status:{
                hue:statusColorInfo[0],
                sat:statusColorInfo[1],
                brig1:statusColorInfo[2],
                brig2:(parseInt(statusColorInfo[2])+10).toString(),
                brig3:(parseInt(statusColorInfo[2])+20).toString(),
                alpha:statusColorInfo.length==4? ','+statusColorInfo[3] : '',
                prefix:this.statusColor[3]=='a'? 'hsla' : 'hsl'
            }
        }

        // this.svgRef = React.createRef();
        this.backgroundRef = React.createRef();
        this.statusBarRef = React.createRef();
        this.moveProgress = this.moveProgress.bind(this);
    }
    async moveProgress(percentage) {
        // var newWidth = (this.width*.25)*percentage;
        var newWidth = (this.width*percentage);     //make sure percentage is being passed as an actual percentage
        if(newWidth <= this.width) this.statusBarRef.current.setAttribute("width", newWidth);
        if(newWidth == this.width) return 1;
        else if(newWidth < this.width) return 0;
        else return -1
    }
    render() {
        return (
            <svg width={this.width} height={this.height}>
                <defs>
                    {this.surfaceStyle=="linear" && 
                    <linearGradient id="backgroundGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop stop-color={`${this.linearInfo.background.prefix}(${this.linearInfo.background.hue},${this.linearInfo.background.sat}%,${this.linearInfo.background.brig1}% ${this.linearInfo.background.alpha})`} offset="0%"/>
                        <stop stop-color={`${this.linearInfo.background.prefix}(${this.linearInfo.background.hue},${this.linearInfo.background.sat}%,${this.linearInfo.background.brig2}% ${this.linearInfo.background.alpha})`} offset="50%"/>
                        <stop stop-color={`${this.linearInfo.background.prefix}(${this.linearInfo.background.hue},${this.linearInfo.background.sat}%,${this.linearInfo.background.brig3}% ${this.linearInfo.background.alpha})`} offset="100%"/>
                    </linearGradient>
                    }
                    {this.surfaceStyle=="linear" && 
                    <linearGradient id="statusGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop stop-color={`${this.linearInfo.status.prefix}(${this.linearInfo.status.hue},${this.linearInfo.status.sat}%,${this.linearInfo.status.brig1}% ${this.linearInfo.status.alpha})`} offset="0%"/>
                        <stop stop-color={`${this.linearInfo.status.prefix}(${this.linearInfo.status.hue},${this.linearInfo.status.sat}%,${this.linearInfo.status.brig2}% ${this.linearInfo.status.alpha})`} offset="50%"/>
                        <stop stop-color={`${this.linearInfo.status.prefix}(${this.linearInfo.status.hue},${this.linearInfo.status.sat}%,${this.linearInfo.status.brig3}% ${this.linearInfo.status.alpha})`} offset="100%"/>
                    </linearGradient>
                    }
                </defs>
                <rect ref={this.backgroundRef} id="backgroundBar" x={0} y={0} fill={this.surfaceStyle=='linear'? 'url(#backgroundGrad)' : this.backgroundColor} width={this.width} height={this.height} rx={this.rx} ry={this.ry}></rect>
                
                <rect ref={this.statusBarRef} id="statusBar" x={0} y={0} width={0} height={this.height} fill={this.surfaceStyle=='linear'? 'url(#statusGrad)' : this.statusColor} rx={this.rx} ry={this.ry}></rect>
            </svg> 
        )
    }
}