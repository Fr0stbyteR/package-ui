import type { CanvasUIState } from "@jspatcher/jspatcher/src/core/objects/base/CanvasUI";
import { React, CanvasUI } from "../sdk";
import { fillTextLine } from "../utils";
import type NumberBox from "../objects/number";
import type { NumberBoxProps, NumberBoxState } from "../objects/number";
import type { PointerDownEvent, PointerDragEvent, PointerUpEvent } from "./types";

export interface NumberBoxUIState extends NumberBoxState, CanvasUIState, NumberBoxProps {
    // displayValue: string;
    focus: boolean;
    inTouch: boolean;
    inputBuffer: string;
}

// https://github.com/Cycling74/miraweb/blob/master/src/js/objects/number.js
export default class NumberBoxUI extends CanvasUI<NumberBox, {}, NumberBoxUIState> {
    static MAX_NUM_DECIMAL_PLACES = 6;
    static PADDING = 4;
    static TRIANGLE_BASE = 12;
    static TRIANGLE_HEIGHT = 6;
    static LEFT_TEXT_OFFSET = this.TRIANGLE_HEIGHT;
    refCanvasUI = React.createRef<CanvasUI>();
    state: NumberBoxUIState = {
        ...this.state,
        value: this.object.state.value,
        focus: false,
        inTouch: false,
        inputBuffer: ""
    };
    multiplier = 1;
    handleKeyDown = (e: React.KeyboardEvent) => {
        if (this.state.cantChange) return;
        if (!this.state.inputBuffer) {
            let addStep = 0;
            if (e.key === "ArrowUp" || e.key === "ArrowRight") addStep = 1;
            if (e.key === "ArrowDown" || e.key === "ArrowLeft") addStep = -1;
            if (addStep !== 0) {
                const newValue = this.object.toValidValue(this.state.value + addStep);
                if (newValue !== this.state.value) this.setValueToOutput(newValue);
            }
        }
        if (e.key.match(/[0-9.-]/)) {
            this.setState({ inputBuffer: this.state.inputBuffer + e.key });
            return;
        }
        if (e.key === "Backspace") {
            this.setState({ inputBuffer: this.state.inputBuffer.slice(0, -1) });
            return;
        }
        if (e.key === "Enter") {
            const newValue = this.object.toValidValue(+this.state.inputBuffer);
            this.setState({ inputBuffer: "" });
            if (newValue !== this.state.value) this.setValueToOutput(newValue);
        }
    };
    handleKeyUp = (e: React.KeyboardEvent) => {};
    private handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.currentTarget.focus();
        const rect = e.currentTarget.getBoundingClientRect();
        let prevX = e.touches[0].clientX;
        let prevY = e.touches[0].clientY;
        const fromX = prevX - rect.left;
        const fromY = prevY - rect.top;
        const prevValue = this.state.value;
        this.handlePointerDown({ x: fromX, y: fromY, originalEvent: e });
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const clientX = e.changedTouches[0].clientX;
            const clientY = e.changedTouches[0].clientY;
            const movementX = clientX - prevX;
            const movementY = clientY - prevY;
            prevX = clientX;
            prevY = clientY;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            this.handlePointerDrag({ prevValue, x, y, fromX, fromY, movementX, movementY, originalEvent: e });
        };
        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            const x = e.changedTouches[0].clientX - rect.left;
            const y = e.changedTouches[0].clientY - rect.top;
            this.handlePointerUp({ x, y, originalEvent: e });
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd, { passive: false });
    };
    handleWheel = (e: React.WheelEvent) => {};
    handleClick = (e: React.MouseEvent) => {};
    private handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.currentTarget.focus();
        const rect = e.currentTarget.getBoundingClientRect();
        const fromX = e.clientX - rect.left;
        const fromY = e.clientY - rect.top;
        const prevValue = this.state.value;
        this.handlePointerDown({ x: fromX, y: fromY, originalEvent: e });
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePointerDrag({ prevValue, x, y, fromX, fromY, movementX: e.movementX, movementY: e.movementY, originalEvent: e });
        };
        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePointerUp({ x, y, originalEvent: e });
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };
    handleMouseOver = (e: React.MouseEvent) => {};
    handleMouseOut = (e: React.MouseEvent) => {};
    handleContextMenu = (e: React.MouseEvent) => {};
    mouseDownValue = this.state.value;
    handlePointerDown = (e: PointerDownEvent<HTMLCanvasElement>) => {
        const { ctx } = this.refCanvasUI.current;
        if (!ctx) return;

		let { value, numDecimalPlaces, fontFamily, fontFace, fontSize, format, cantChange, outputOnClick, triangle, triScale } = this.state;
        if (cantChange) return;
        if (outputOnClick) this.setValueToOutput(this.state.value);
        this.mouseDownValue = this.state.value;

        const { width } = (e.originalEvent.currentTarget as HTMLCanvasElement).getBoundingClientRect();
		if (numDecimalPlaces === 0) numDecimalPlaces = 6;

        ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;

        const { PADDING, LEFT_TEXT_OFFSET } = NumberBoxUI;

		const stringValue = value.toFixed(numDecimalPlaces);
		const decimalArray = stringValue.split(".");
		const leftTextOffset  = LEFT_TEXT_OFFSET * triScale;
		const textStart = (+triangle * leftTextOffset) + 3 * PADDING / 2;

		// this is the code to target which decimal place is being dragged
		// if it is to the left of the decimal point, the number is changed
		// by 1
		// if it is to the right of the decimal point, the number is changed
		// based on the distance from the decimal point
		if (format === "Decimal (Floating-Point)") {
			for (let i = -1; i < numDecimalPlaces; i++) {
				let numberText;
				if (i === -1) {
					numberText = decimalArray[0] + ".";
				} else {
					numberText = decimalArray[0] + "." + decimalArray[1].substring(0, i + 1);
				}
				const textWidth = ctx.measureText(numberText).width;
				if (e.x < textWidth + textStart) {
					this.multiplier = Math.pow(10, -(i + 1));
					break;
				} else {
					this.multiplier = Math.pow(10, -numDecimalPlaces);
				}
			}
		}
        this.setState({ inTouch: true });
    };
    handlePointerDrag = (e: PointerDragEvent) => {
		const { value, cantChange, format } = this.state;
        if (cantChange) return;
        const multiplier = format === "Decimal (Floating-Point)" ? this.multiplier : 1;
		let newValue = this.toFixedTruncate(value, -Math.log10(multiplier));
		newValue = newValue - e.movementY * multiplier;
        newValue = this.object.toValidValue(newValue);
        this.setState({ value: newValue });
        if (!this.state.mouseFilter && newValue !== value) this.setValueToOutput(newValue);
    };
    handlePointerUp = (e: PointerUpEvent) => {
		const { value, cantChange } = this.state;
        if (cantChange) return;
        if (this.state.mouseFilter && this.mouseDownValue !== value) this.setValueToOutput(this.state.value);
        this.setState({ inTouch: false });
    };
    handleFocusIn = (e: React.FocusEvent) => this.setState({ focus: true });
    handleFocusOut = () => {
        if (this.state.inputBuffer) {
            const newValue = this.object.toValidValue(+this.state.inputBuffer);
            this.setState({ inputBuffer: "" });
            if (newValue !== this.state.value) this.setValueToOutput(newValue);
        }
        this.setState({ focus: false });
    };
    toFixedTruncate(num: number, fixed: number) {
        const re = new RegExp(`^-?\\d+(?:\.\\d{0,${(fixed || -1)}})?`);
        return parseFloat(num.toString().match(re)[0]);
    }
	_formatValue(value = this.state.value) {
		const {
			format,
			numDecimalPlaces
		} = this.state;

		let retStr;

		switch (format) {
			case "Decimal (Integer)":
				retStr = Math.round(value).toString();
				break;

			case "Decimal (Floating-Point)":
				if (value % 1 === 0 && numDecimalPlaces === 0) {
					retStr = value + ".";
				}
				else {
					if (numDecimalPlaces === 0) {
						retStr = parseFloat(value.toFixed(NumberBoxUI.MAX_NUM_DECIMAL_PLACES)).toString();
					} else {
						retStr = value.toFixed(numDecimalPlaces);
					}
				}
				break;

			case "MIDI":
			case "MIDI (C4)": {

				const noteArray = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
				let base = 2;
				if (format === "MIDI (C4)") base = 1;
				const note = noteArray[value % 12] + (Math.floor(value / 12) - base).toString();
				if (value <= 127 && value >= 0) {
					retStr = note;
				} else if (value < 0) {
					retStr = "-";
				} else if (value > 127) {
					retStr = "+";
				}
				break;
			}
			case "Binary":
				retStr = (value >>> 0).toString(2);
				break;

			case "Hex":
				retStr = (value >>> 0).toString(16).toUpperCase();
				break;

			case "Roland Octal": {
				let dec1 = ((value >> 3) + 1);
				let dec2 = ((value & 7) + 1);
				retStr = dec1.toString() + dec2.toString();
				break;
			}
			default:
                retStr = value.toString();
				break;
		}
		return retStr;
	}
    setValueToOutput(value: number) {
        this.setState({ value });
        this.props.object.onChangeFromUI({ value });
    }
	onPaint = (ctx: CanvasRenderingContext2D) => {
        if (!ctx) return;
		const {
			fontSize,
			fontFamily,
			fontFace,
			bgColor,
			textColor,
            triangle,
			triColor,
			triScale,
			hTriColor,
            inTouch
		} = this.state;

        const { PADDING, TRIANGLE_BASE, TRIANGLE_HEIGHT, LEFT_TEXT_OFFSET } = NumberBoxUI;

		const triangleBase = TRIANGLE_BASE * triScale;
		const triangleHeight = TRIANGLE_HEIGHT * triScale;
		const leftTextOffset  = LEFT_TEXT_OFFSET * triScale;

		const valueStr = this.state.inputBuffer || this._formatValue(this.state.value);

        const [width, height] = this.refCanvasUI.current.fullSize();
		// draw background
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textBaseline = "middle";
    
        if (triangle) {
            fillTextLine(ctx, valueStr, leftTextOffset + 3 * PADDING / 2, height / 2, width - leftTextOffset - (PADDING + 2));
            
            ctx.fillStyle = inTouch ? hTriColor : triColor;
            ctx.beginPath();
            ctx.moveTo(PADDING, height / 2 - triangleBase / 2);
            ctx.lineTo(PADDING, height / 2 + triangleBase / 2);
            ctx.lineTo(PADDING + triangleHeight, height / 2);
            ctx.fill();
        } else {
            fillTextLine(ctx, valueStr, 3 * PADDING / 2, height / 2, width - (PADDING + 2));
        }
	}

    render() {
        return (
            <CanvasUI
                ref={this.refCanvasUI}
                onPaint={this.onPaint}
                {...this.props}
                canvasProps={{
                    tabIndex: 1,
                    onKeyDown: this.handleKeyDown,
                    onKeyUp: this.handleKeyUp,
                    onTouchStart: this.handleTouchStart,
                    onWheel: this.handleWheel,
                    onClick: this.handleClick,
                    onMouseDown: this.handleMouseDown,
                    onMouseOver: this.handleMouseOver,
                    onMouseOut: this.handleMouseOut,
                    onContextMenu: this.handleContextMenu,
                    onFocus: this.handleFocusIn,
                    onBlur: this.handleFocusOut
                }}
            />
        );
    }
}
