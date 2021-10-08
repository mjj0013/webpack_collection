
import { yieldExpression } from "babel-types";
import "../utility.js"
import { getRandomInt } from '../utility.js';

import GameObject from './GameObject';
class PhysicalObject extends GameObject {
    constructor(parent, context, obj_type, x ,y,width, height, xVelocity, yVelocity ,mass,color=null) {
        super(parent,context, x ,y, xVelocity, yVelocity ,mass);
        this.parent = parent;
        this.radius = width;
        this.obj_type = obj_type;


        this.trueX = x;       //true x and y are for the object's (x,y) point after rotation (in JS, the coordinates stay the same after rotation)
        this.trueY = y;
        this.trueEdges = [
            {x1:x,       y1:y,          x2:x+width,   y2:y,         label:'p1p2', length:width},
            {x1:x+width, y1:y,          x2:x+width,   y2:y+height,  label:'p2p3', length:height},
            {x1:x+width, y1:y+height,   x2:x,         y2:y+height,  label:'p3p4', length:width},
            {x1:x,       y1:y+height,   x2:x,         y2:y,         label:'p4p1', length:height}
        ];
        this.trueCorners = [
            {x:x, y:y, label:'p1'},
            {x:x+width, y:y, label:'p2'},
            {x:x+width, y:y+height, label:'p3'},
            {x:x, y:y+height, label:'p4'}

        ]
        
        this.hasShadowRect = false;
        this.drawShadowRect = false;
        this.angleOrient = 0;
        this.angleIter = 0;
        this.rotating = false;

        this.width = width;
        this.height = height;
        this.coeff_of_rest = 0.1    //aluminum

        this.isColliding = false;
        this.collidable = true;
        this.collidingObjects = [];
        if(color==null) {this.hue = getRandomInt(0,360); }
        else {this.hue=color;}
        
        this.movable = true;
        

        this.shape = null;

        this.movable = true;
        this.controllable = true;

        this.collisionIter = 0;
        this.collisionIterSpeed =5;
        this.startCollisionIter = false;
        this.circle2circle = this.circle2circle.bind(this);
        this.circle2rectangle = this.circle2rectangle.bind(this);
        if(obj_type.includes("ellipse")) {this.shape = "ellipse";}
        if(obj_type.includes("rectangle")) {this.shape = "rectangle";}
        if(obj_type.includes("stationary")) {
            //this.movable = false;
        }


        if(obj_type.includes("user") ){
            
            this.movable = true;
            this.controllable = true;
        }

        
    }
    circle2rectangle(circle,rectangle, isCollisionTest=false) {
        var testX = rectangle.x;
        var testY = rectangle.y;
       
        var collided = false;
        if(circle.parent.physicalObjects[circle.parent.controlledObjectIndex]==circle) {
            //^ line above is just a wrapper to test for current controlled ball location

            //for four sides of rectangle
            var closestCorner={corner:null, squaredDist:Infinity};
            for(var i=0; i < 4; ++i) {
                let corner = rectangle.trueCorners[i];
                let squaredDist = (circle.x-corner.x)*(circle.x-corner.x) + (circle.y-corner.y)*(circle.y-corner.y);
                if(closestCorner==null) {                   //first corner in loop is by default closestCorner if it's null
                    closestCorner.corner = corner;
                    closestCorner.squaredDist = squaredDist;
                }        
                else {
                    if(squaredDist < closestCorner.squaredDist) {
                        closestCorner.corner = corner;
                        closestCorner.squaredDist = squaredDist;
                    }
                }
            }
            if(Math.sqrt(closestCorner.squaredDist) >= circle.radius) {
                return;
            }          
            var rectCenter = {x:rectangle.x+rectangle.width/2, y:rectangle.y+rectangle.height/2};
            var collidingEdge=null;
            //Instead, find just ONE closest corner, (each point has two associated edges)
            //Then compare its two associated edges

            for(var i=0; i < 4; ++i) {
                if(rectangle.trueEdges[i].label.includes(closestCorner.corner.label)) {
                    let edge = rectangle.trueEdges[i];
                    //var oppEdge = edge[(i+2)%4];
                    
                    // var dist = Math.sqrt((edge.x2-edge.x1)*(edge.x2-edge.x1) + 
                    //                 (edge.y2-edge.y1)*(edge.y2-edge.y1) );
                    
                    if((circle.x > edge.x1) && (circle.x < edge.x2)) {
                        if((circle.y > edge.y1) && (circle.y < edge.y2)) {
                            console.log("collided with edge: "+edge.label);
                            collidingEdge = edge;
                            break;
                        }
                    }
                    else if((circle.x < edge.x1) && (circle.x > edge.x2)) {
                        if((circle.y < edge.y1) && (circle.y > edge.y2)) {
                            console.log("collided with edge: "+edge.label);
                            collidingEdge = edge;
                            break;
                        }
                    }
                }
            }
            if(collidingEdge==null) return;

            var dist = Math.sqrt((circle.x-rectCenter.x)*(circle.x-rectCenter.x) + 
                            (circle.y-rectCenter.y)*(circle.y-rectCenter.y) );
            
            let vCollision = {x: circle.x - rectCenter.x , y: circle.y - rectCenter.y}
            // var normX = (collidingEdge.x2-collidingEdge.x1);
            // var normY = -1*(collidingEdge.y2-collidingEdge.y1);
            let vCollisionNorm = {x: vCollision.x / dist, y: vCollision.y/dist};
            
            
           
            
            let vRelativeVelocity = {x: circle.xVelocity-rectangle.xVelocity, y: circle.yVelocity-rectangle.yVelocity};
            let speed = (vRelativeVelocity.x * vCollisionNorm.x) + (vRelativeVelocity.y * vCollisionNorm.y);    //equal to the dot product
            //speed *= Math.min(circle1.coeff_of_rest,circle2.coeff_of_rest);
            console.log(speed);
            if(speed < 0) {return false;}

            //let impulse  = 2*speed/(circle.mass + rectangle.mass);
            if(circle.movable) {
                circle.startCollisionIter = true;
                circle.xVelocity -= (vCollisionNorm.x);
                circle.yVelocity -= (vCollisionNorm.y);
            }
          

                    //compare traits of two edges associated with closest point
                    //for rectangles, 2 associated edges' angles will always have a 90 difference
                    //maybe find if normal vector of edge and circle's velocity vector intersect

                
                
            
             
                
            
        // if((circle.x > rectangle.x+rectangle.width) && (circle.x - (rectangle.x+rectangle.width) < circle.radius)) {        //right
        //     if((circle.y + circle.radius > rectangle.y) && (circle.y-circle.radius < rectangle.y+rectangle.height)) {
        //         console.log("RIGHT SIDE");
        //         circle.xVelocity = -1*circle.xVelocity
        //     }
        // }
        // else if((circle.x < rectangle.x) && ((rectangle.x-circle.x) < circle.radius)) {        //left
        //     if((circle.y + circle.radius > rectangle.y) && (circle.y-circle.radius < rectangle.y+rectangle.height)) {
        //         console.log("LEFT SIDE");
        //         circle.xVelocity = -1*circle.xVelocity
        //     }
        // }
        // else if((circle.y < rectangle.y) && ((rectangle.y-circle.y) < circle.radius)) {        //top
        //     if((circle.x + circle.radius > rectangle.x) && (circle.x-circle.radius < rectangle.x+rectangle.width)) {
        //         console.log("TOP SIDE");
        //         circle.yVelocity = -1*circle.yVelocity
        //     }
        // }
        // else if((circle.y > rectangle.y+rectangle.height) && ((circle.y - (rectangle.y+rectangle.height)) < circle.radius)) {        //bottom
        //     if((circle.x + circle.radius > rectangle.x) && (circle.x-circle.radius < rectangle.x+rectangle.width)) {
        //         console.log("BOTTOM SIDE");
        //         circle.yVelocity = -1*circle.yVelocity
        //     }
        // }




        }   // <-- remove bracket after testing
        

        

        


    }
    circle2circle(circle1,circle2,isCollisionTest=false) {
        //*******************************************//******************************************* */
        //http://www.jeffreythompson.org/collision-detection/table_of_contents.php
        //This example is built on code by Matt Worden
        let squaredDist = (circle2.x-circle1.x)*(circle2.x-circle1.x) + (circle2.y-circle1.y)*(circle2.y-circle1.y);
        if(squaredDist <= (circle1.radius+circle2.radius)*(circle1.radius+circle2.radius)) {
            if(isCollisionTest) {return true;}

            circle1.isColliding = true;
            circle2.isColliding = true;
            let vCollision = {x: circle2.x - circle1.x , y: circle2.y - circle1.y}
            let dist = Math.sqrt(squaredDist);

            let vCollisionNorm = {x: vCollision.x / dist, y: vCollision.y/dist};

           
            let vRelativeVelocity = {x: circle1.xVelocity-circle2.xVelocity, y: circle1.yVelocity-circle2.yVelocity};
            let speed = (vRelativeVelocity.x * vCollisionNorm.x) + (vRelativeVelocity.y * vCollisionNorm.y);    //equal to the dot product
            //speed *= Math.min(circle1.coeff_of_rest,circle2.coeff_of_rest);

            if(speed < 0) {return false;}

            let impulse  = 2*speed/(circle1.mass + circle2.mass);
            if(circle1.movable) {
                circle1.startCollisionIter = true;
                circle1.xVelocity -= (impulse*circle2.mass*vCollisionNorm.x);
                circle1.yVelocity -= (impulse*circle2.mass*vCollisionNorm.y);
            }
            if(circle2.movable) {
                circle2.startCollisionIter = true;
                circle2.xVelocity += (impulse*circle1.mass*vCollisionNorm.x);
                circle2.yVelocity += (impulse*circle1.mass*vCollisionNorm.y);
            }
            return true;
        }
        return false; 
         //*******************************************//******************************************* */
    }
    
    draw() {
        if(this.shape == "rectangle") {
            //on rotation about center point
            
            if(this.rotating) {
                this.parent.contextRef.current.save();
                this.parent.contextRef.current.translate(this.x+this.width/2, this.y+this.height/2);
                this.parent.contextRef.current.rotate(this.angularVelocity*(Math.PI/180));
                
                this.parent.contextRef.current.translate(-this.x-this.width/2, -this.y-this.height/2);
                
            }
            
            this.parent.contextRef.current.font = '24px serif';
            
            this.parent.contextRef.current.textBaseline= 'top';
            this.parent.contextRef.current.textAlign = "center"
            this.parent.contextRef.current.strokeText('<^>',this.x+this.width/2, this.y+this.height/2);
            
            this.parent.contextRef.current.beginPath();
            this.parent.contextRef.current.moveTo(this.trueEdges[0].x1, this.trueEdges[0].y1)   //p1
            this.parent.contextRef.current.lineTo(this.trueEdges[0].x2, this.trueEdges[0].y2)   //p2
            this.parent.contextRef.current.lineTo(this.trueEdges[1].x1, this.trueEdges[1].y1)   //p2
            this.parent.contextRef.current.lineTo(this.trueEdges[1].x2, this.trueEdges[1].y2)   //p3
            this.parent.contextRef.current.lineTo(this.trueEdges[2].x1, this.trueEdges[2].y1)   //p3
            this.parent.contextRef.current.lineTo(this.trueEdges[2].x2, this.trueEdges[2].y2)   //p4
            this.parent.contextRef.current.lineTo(this.trueEdges[3].x1, this.trueEdges[3].y1)   //p4
            this.parent.contextRef.current.lineTo(this.trueEdges[3].x2, this.trueEdges[3].y2)   //p1

           
            
            this.parent.contextRef.current.fillStyle = 'hsl('+(this.hue)+',50%,50%)';
            this.parent.contextRef.current.stroke();
            
            //this.parent.contextRef.current.fill();
            //this.parent.contextRef.current.fillRect(this.x, this.y, this.width, this.height);
            

            if(this.rotating) {this.parent.contextRef.current.restore();}

        }
        else if(this.shape == "ellipse") {
            this.parent.contextRef.current.beginPath();

            this.parent.contextRef.current.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
           
            var theta = Math.atan((this.parent.yLightSource-this.y)/(this.parent.xLightSource-this.x));
            
            

            var gradient = this.parent.contextRef.current.createRadialGradient(this.x,this.y,this.radius,  
                (this.radius)*Math.cos(theta),
                (this.radius)*Math.sin(theta),
                (this.radius)
                );

            var num_stops = 10;
            var d_offset = this.radius/this.parent.rLightSource;
            for(var i=1; i < num_stops+1; ++i) {
                var percent = Math.min(d_offset*i/num_stops, 1.0);
                gradient.addColorStop(percent, 
                    'hsl('
                        +(this.hue)+','
                        +this.parent.backgroundSaturation*(1.0-percent)+'%,'
                        +(this.parent.backgroundLightness*(percent))+'%)'
                    
                    )
            }
            
            this.parent.contextRef.current.fillStyle = gradient;
            this.parent.contextRef.current.fill();
            this.parent.contextRef.current.stroke();

        }
        
    }

    update() {
        
        //**************************** Object-to-Object collisions  ****************************
        this.parent.physicalObjects.forEach((obj,index) => {
            if(obj != this) {   
                if(this.shape == "ellipse" && obj.shape=="ellipse") {
                    this.circle2circle(this,obj);
                }
                else if(this.shape == "rectangle" && obj.shape=="ellipse") {
                    this.circle2rectangle(obj,this);
                }
                else if(this.shape == "circle" && obj.shape=="rectangle") {
                    this.circle2rectangle(this,obj);
                }
            }
        })

       
        //************************************ Inertia  ************************************
        let new_xVelocity = (this.xVelocity+this.parent.xGlobalForce)*.98;
        let new_yVelocity = (this.yVelocity+this.parent.yGlobalForce)*.98;


        
        this.angularAccel = this.angularAccel*.9;
        this.angularVelocity += this.angularAccel;

        //**************************** Handling Rotations  ****************************
        let rotationPt = {x:this.x+this.width/2, y:this.y+this.height/2};               //for now only rotating about center of shape
        let a = this.angularVelocity*(Math.PI/180);


        let xr = (this.x-rotationPt.x)*Math.cos(a) - (this.y-rotationPt.y)*Math.sin(a) + rotationPt.x;
        let yr = (this.x-rotationPt.x)*Math.sin(a) + (this.y-rotationPt.y)*Math.cos(a) + rotationPt.y;
        
        let pt2_x = (this.x+this.width-rotationPt.x)*Math.cos(a) - (this.y  -rotationPt.y)*Math.sin(a) + rotationPt.x;
        let pt2_y = (this.x+this.width-rotationPt.x)*Math.sin(a) + (this.y  -rotationPt.y)*Math.cos(a) + rotationPt.y;

        let pt3_x = (this.x+this.width-rotationPt.x)*Math.cos(a) - (this.y+this.height  -rotationPt.y)*Math.sin(a) + rotationPt.x;
        let pt3_y = (this.x+this.width-rotationPt.x)*Math.sin(a) + (this.y+this.height  -rotationPt.y)*Math.cos(a) + rotationPt.y;

        let pt4_x = (this.x-rotationPt.x)*Math.cos(a) - (this.y+this.height  -rotationPt.y)*Math.sin(a) + rotationPt.x;
        let pt4_y = (this.x-rotationPt.x)*Math.sin(a) + (this.y+this.height  -rotationPt.y)*Math.cos(a) + rotationPt.y;

        

        this.trueX = xr;
        this.trueY = yr;
        
        
        //this.trueEdges[0] = {x1:xr ,    x2: pt2_x,  y1: yr,     y2:  pt2_y}
        this.trueEdges[0].x1 = xr;
        this.trueEdges[0].x2 = pt2_x;
        this.trueEdges[0].y1 = yr;
        this.trueEdges[0].y2 = pt2_y;

        //this.trueEdges[1] = {x1:pt2_x , x2: pt3_x,  y1: pt2_y,  y2:  pt3_y}
        this.trueEdges[1].x1 = pt2_x;
        this.trueEdges[1].x2 = pt3_x;
        this.trueEdges[1].y1 = pt2_y;
        this.trueEdges[1].y2 = pt3_y;

        //this.trueEdges[2] = {x1:pt3_x , x2: pt4_x,  y1: pt3_y,  y2:  pt4_y}
        this.trueEdges[2].x1 = pt3_x;
        this.trueEdges[2].x2 = pt4_x;
        this.trueEdges[2].y1 = pt3_y;
        this.trueEdges[2].y2 = pt4_y;

        //this.trueEdges[3] = {x1:pt4_x , x2: xr,     y1: pt4_y,  y2:  yr}
        this.trueEdges[3].x1 = pt4_x;
        this.trueEdges[3].x2 = xr;
        this.trueEdges[3].y1 = pt4_y;
        this.trueEdges[3].y2 = yr;

        
        this.trueCorners[0].x=xr;
        this.trueCorners[0].y=yr;
        this.trueCorners[1].x=pt2_x;
        this.trueCorners[1].y=pt2_y;
        this.trueCorners[2].x=pt3_x;
        this.trueCorners[2].y=pt3_y;
        this.trueCorners[3].x=pt4_x;
        this.trueCorners[3].y=pt4_y;

        // this.trueCorners = [
        //     {x:x, y:y, label:'p1'},
        //     {x:x+width, y:y, label:'p2'},
        //     {x:x+width, y:y+height, label:'p3'},
        //     {x:x, y:y+height, label:'p4'}

        // ]

        

        //*********************************** Canvas Boundary Collisions *****************************************
        if(this.x-this.width + new_xVelocity<=0) {                     //left
            if(this.parent.xGlobalForce ==0.0) {new_xVelocity = -1*new_xVelocity;}
            else {new_xVelocity = 0.0;}
           
        }
        if(this.x + new_xVelocity >= this.parent.canvasWidth-this.width) {    //right
            if(this.parent.xGlobalForce ==0.0) {new_xVelocity = -1*new_xVelocity;}
            else {new_xVelocity = 0.0;}
           
        }
        if(this.y + new_yVelocity >= this.parent.canvasHeight-this.height) {    //bottom
            if(this.parent.yGlobalForce == 0.0) {new_yVelocity = -1*new_yVelocity;}
            else {new_yVelocity = 0.0;}
            
        }
        if(this.y - this.height+ new_yVelocity <= 0) {                  //top
            if(this.parent.yGlobalForce==0.0) {new_yVelocity = -1*new_yVelocity;}
            else {new_yVelocity = 0.0;}
           
        }

        //*********************************** Updating attributes *****************************************
        this.x = Math.max(Math.min(this.x + new_xVelocity, this.parent.canvasWidth-this.width),0);
        this.y = Math.max(Math.min(this.y + new_yVelocity, this.parent.canvasHeight-this.height),0);
        

        // if(new_angularVelocity !=undefined) this.angularVelocity = Math.min(new_angularVelocity, 0);
        // if(this.angularVelocity == 0) this.rotating=false;

       
        this.xVelocity = new_xVelocity;
        this.yVelocity = new_yVelocity;
      
    
    }
    
};
export default PhysicalObject;