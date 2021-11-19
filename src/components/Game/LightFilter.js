import React from 'react';

class LightFilter extends React.Component {

    constructor(props) {
        super(props);
    }
    render() {
        return (
        <filter id = "filter">
            <feSpecularLighting result="specOut" specularExponent="50" lighting-color="#bbbbbb" surfaceScale="5">
                    <fePointLight x="400" y="400" z="20"/>
            </feSpecularLighting>
        
            <feSpecularLighting result="specOut2" specularExponent="40" lighting-color="#bbbbbb" surfaceScale="5">
                <fePointLight x="100" y="100" z="30"/>
            </feSpecularLighting>
            <feSpecularLighting result="specOut3" specularExponent="40" lighting-color="#bbbbbb" surfaceScale="15">
                <fePointLight x="250" y="50" z="30"/>
            </feSpecularLighting>
            
        
            
            <feMerge result="s">
                <feMergeNode in="specOut" />
                <feMergeNode in="specOut2" />
                <feMergeNode in="specOut3" />
                
                
            </feMerge>
            
            
            <feComposite in="SourceGraphic" in2="s" operator="arithmetic" k1="5" k2="1" k3="1" k4="0"/>
        
    
    </filter>
    )}
}
export default LightFilter;
