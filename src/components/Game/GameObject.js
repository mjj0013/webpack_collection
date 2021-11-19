import Layout from '../Layout';
class GameObject {
    constructor(parent, context, x, y, xVelocity, yVelocity ,mass) {
       
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;

        this.angularVelocity =0;
        this.angularAccel = 0;
        
        //this.angularVelocity = {x:0.0, y:0.0};


        this.mass = mass;
        this.collidable=false;
        
    }
 
};
export default GameObject;


