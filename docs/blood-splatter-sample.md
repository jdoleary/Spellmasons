
```js
// Update particle in gameloop
    for(var i = 0; i < bloods.length; i++){
        var blood = bloods[i];
        //shrink blood particle:
        blood.scale.x*=0.7;
        blood.scale.y*=0.7;
        
        
        var blood_x_mod = randomFloatWithBias2(-10,10);
        var blood_y_mod = randomFloatWithBias2(-10,10);
        var blood_size_mod = randomFloatWithBias2(1,blood.scale.y*20);
        //var skip_blood_draw = randomIntFromInterval(0,3);
        //if(!skip_blood_draw)blood_trail.draw(blood.position.x+blood_x_mod,blood.position.y+blood_y_mod,blood_size_mod,true);
        blood_trail.draw(blood.position.x+blood_x_mod,blood.position.y+blood_y_mod,blood_size_mod,true);
        
        //remove when done ticking
        if(tickParticle(blood,7,false)){
            bloods.splice(i,1);
            i--;
        }
        
    }
```
```js
function bloodParticleSplatter(angle,target){
    //var bloodAmount = randomIntFromInterval(15,30);
    var bloodAmount = randomIntFromInterval(30,60);
    angle += Math.PI/2;//I don't know why it's off by Pi/2 but it is.    
    var bloodSplat;
    for(var i = 0; i < bloodAmount; i++){
        //make new bunnies
        bloodSplat = new PIXI.Sprite();
        
        
        bloodSplat.anchor.x = 0.5;
        bloodSplat.anchor.y = 0.5;
        /*var randScale = randomFloatFromInterval(1,2);
        bloodSplat.scale.x = randScale;
        bloodSplat.scale.y = randScale;*/
        var randSpeed = randomFloatWithBias(0.7,blood_speed);
        var randRotationOffset = randomFloatWithBias(0,Math.PI/4);
        var negativeRotationOffset = randomIntFromInterval(0,2);
        if(negativeRotationOffset)randRotationOffset *= -1;
        bloodSplat.dr = randomFloatFromInterval(-0.3,0.3);//change in rotation
        bloodSplat.dx = -randSpeed*Math.sin(angle+randRotationOffset)*15;
        bloodSplat.dy = -randSpeed*Math.cos(angle+randRotationOffset)*15;
        //start the blood off a little away from target
        bloodSplat.position.x = target.x+Math.sin(angle)*20;
        bloodSplat.position.y = target.y+Math.cos(angle)*20;
        bloodSplat.tick = 0;//the amount of times that it has moved;
        bloodSplat.rotation = (angle);

        bloods.push(bloodSplat);
    }
    
}
```