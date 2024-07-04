export function getCoords(centX:number,centY:number,width:number,height:number){

    const startingX = Math.ceil(centX - width/2.0);
    const startingY = Math.ceil(centY- height/2.0);
    const endingX = Math.floor(centX + width/2.0);
    const endingY = Math.floor(centY + height/2.0);
    const adjustedWidth = endingX-startingX;
    const adjustedHeight = endingY-startingY;
    return {startingX,startingY,adjustedWidth,adjustedHeight}

}