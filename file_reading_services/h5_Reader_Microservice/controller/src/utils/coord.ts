//CARTA co-ordinates to Dataset co-ordinates 
export function getCoords(centX:number,centY:number,width:number,height:number){

    const startingX = Math.ceil(centX - width/2.0);
    const startingY = Math.ceil(centY- height/2.0);
    const endingX = Math.floor(centX + width/2.0);
    const endingY = Math.floor(centY + height/2.0);
    const adjustedWidth = endingX-startingX+1;
    const adjustedHeight = endingY-startingY+1;
    return {startingX,startingY,adjustedWidth,adjustedHeight}

}

export function getCircleCoords(centX:number,centY:number,width:number,height:number){

    const startingX = Math.ceil(centX - width);
    const startingY = Math.ceil(centY- height);
    const endingX = Math.floor(centX + width);
    const endingY = Math.floor(centY + height);
    const adjustedWidth = endingX-startingX+1;
    const adjustedHeight = endingY-startingY+1;
    return {startingX,startingY,adjustedWidth,adjustedHeight}

}