/**
 * A single line of text.
 * If the parameter width is less than the width of the text,
 * then it will be truncated with an ellipsis.
 * If the font justification is set to "center", then the
 * text will be centered in the supplied parameter width by
 * changing the anchor of the text, and setting the x position to
 * the width/2 + the supplied x parameter.
 */
export const fillTextLine = (ctx: CanvasRenderingContext2D, textIn: string, x: number, y: number, width: number) => {
    const ellipsis = "…";
    let textWidth = ctx.measureText(textIn).width;
    let text = textIn;
    if (textWidth > width) {
        let str = textIn.toString();
        let len = str.length;
        while (textWidth >= width && len-- > 1) {
            str = str.substring(0, len);
            textWidth = ctx.measureText(str + ellipsis).width;
        }
        if (textWidth <= width) {
            text = str + ellipsis;
        } else {
            text = str;
        }
    }
    ctx.fillText(text, x, y, width);
    return;
};

/**
 * Multiline text.
 * If the supplied width parameter is less than the width of the
 * text, then it will be pushed onto another line, until all of the
 * text is added.
 */
export const fillTextLines = (ctx: CanvasRenderingContext2D, textIn: string, x: number, y: number, width: number) => {
    let textWidth = ctx.measureText(textIn).width;
    let text = textIn;
    if (textWidth > width) {
        const str = textIn.toString().split("");
        const len = str.length;
        const newString = [];
        for (let i = 0; i < len; i++) {
            if (ctx.measureText(newString.join("").split("\n").pop() + str[i]).width > width) {
                newString.push("\n");
            }
            newString.push(str[i]);
            text = newString.join("");
        }
    }
    ctx.fillText(text, x, y, width);
    return text;
};
