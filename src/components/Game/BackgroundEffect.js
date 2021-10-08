

import GameObject from './GameObject';

class BackgroundEffect extends GameObject {
    constructor(parent, context, x, y, xVelocity, yVelocity ,mass, type) {
        super(parent, context, x, y, xVelocity, yVelocity ,mass);
        
        this.isColliding = false;
        this.collidable = true;
        this.parent = parent;
        
        this.draw = this.draw.bind(this);
        this.radius = 20;
        this.hasFaded = false;
        this.type = type;

        

    }

    draw() {
        
        var color_gradient = (255/this.radius);
        if(this.mass > 0) {
            if(this.type=="top") {
                
            }
            var gradient = this.parent.contextRef.current.createRadialGradient(this.x,this.y,this.radius,  
                                                            this.x,this.y,this.radius+this.xVelocity);
            
            gradient.addColorStop(0, 'black');
            
            gradient.addColorStop(.5, this.color);
            gradient.addColorStop(.8, 'red');
            gradient.addColorStop(1, 'black');

            this.parent.contextRef.current.fillStyle = gradient;
            
            this.parent.contextRef.current.fillRect(this.x,this.y,this.x+this.radius,this.x+this.radius);
            this.xVelocity = this.xVelocity*3;
            
            --this.mass;
        }
        else {
            this.hasFaded = true;
            

        }
    }
    
}

export default BackgroundEffect;