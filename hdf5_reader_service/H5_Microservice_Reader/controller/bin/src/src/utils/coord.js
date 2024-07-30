"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoords = getCoords;
function getCoords(centX, centY, width, height) {
    const startingX = Math.ceil(centX - width / 2.0);
    const startingY = Math.ceil(centY - height / 2.0);
    const endingX = Math.floor(centX + width / 2.0);
    const endingY = Math.floor(centY + height / 2.0);
    const adjustedWidth = endingX - startingX + 1;
    const adjustedHeight = endingY - startingY + 1;
    return { startingX, startingY, adjustedWidth, adjustedHeight };
}
