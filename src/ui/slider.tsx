import type { CanvasUIState } from "@jspatcher/jspatcher/src/core/objects/base/CanvasUI";
import { React, CanvasUI, Utils } from "../sdk";
import type slider from "../objects/slider";
import type { SliderProps, SliderState } from "../objects/slider";
import type { PointerDownEvent, PointerDragEvent, PointerUpEvent } from "./types";

export interface SliderUIState extends SliderState, CanvasUIState, SliderProps {
    focus: boolean;
    inTouch: boolean;
}

// https://github.com/Cycling74/miraweb/blob/master/src/js/objects/slider.js
export default class SliderUI extends CanvasUI<slider, {}, SliderUIState> {
    refCanvasUI = React.createRef<CanvasUI>();
    state: SliderUIState = {
        ...this.state,
        value: this.object.state.value,
        focus: false,
        inTouch: false
    };
    handleKeyDown = (e: React.KeyboardEvent) => {};
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
    _touchPreviousCoord = 0;
    _touchPreviousDist = 0;
    _orientation: SliderProps["orientation"] = null;
    interactionRect: number[] = [0, 0, 0, 0];
    _handlePointerEvent(e: PointerDownEvent<HTMLCanvasElement> | PointerDragEvent<HTMLCanvasElement> | PointerUpEvent<HTMLCanvasElement>, isPointerDown = false) {
        const { ctx } = this.refCanvasUI.current;
        if (!ctx) return;

		let { floatOutput, relative, size } = this.state;
		if (!floatOutput) size -= 1;

        const rect = this.refCanvasUI.current.canvas.getBoundingClientRect();
        const currentPos = this._orientation === "Vertical" ? e.y / rect.height : e.x / rect.width;
		if (isPointerDown && !relative) {
			this._touchPreviousDist = this._orientation === "Vertical" ? 1 - currentPos : currentPos;
			this._touchPreviousDist *= size;
			this._touchPreviousDist = Math.min(Math.max(this._touchPreviousDist, 0), size);
		}
		if (relative) {
			const delta = currentPos - this._touchPreviousCoord;
			this._touchPreviousDist += (this._orientation === "Vertical" ?  -delta * size : delta * size);
		} else {
			this._touchPreviousDist = this._orientation === "Vertical" ? 1 - currentPos : currentPos;
			this._touchPreviousDist *= size;
		}

		this._touchPreviousDist = Math.min(Math.max(this._touchPreviousDist, 0), size);

		const newVal = floatOutput ? this._touchPreviousDist : Math.round(this._touchPreviousDist);

        if (newVal !== this.state.value) this.setValueToOutput(newVal);
		this._touchPreviousCoord = currentPos;
        this.setState({ inTouch: true });
    }
    handlePointerDown = (e: PointerDownEvent<HTMLCanvasElement>) => {
        let { value, size, floatOutput } = this.state;
		if (!floatOutput) size -= 1;
		this._touchPreviousDist = value;
        const rect = this.refCanvasUI.current.canvas.getBoundingClientRect();
        this._touchPreviousCoord = this._orientation === "Vertical" ? e.y / rect.height : e.x / rect.width;
		this._handlePointerEvent(e, true);
    };
    handlePointerDrag = (e: PointerDragEvent<HTMLCanvasElement>) => {
		this._handlePointerEvent(e, false);
    };
    handlePointerUp = (e: PointerUpEvent) => {
		this._touchPreviousCoord = 0;
		this._touchPreviousDist = 0;
    };
    handleFocusIn = (e: React.FocusEvent) => this.setState({ focus: true });
    handleFocusOut = () => {
        this.setState({ focus: false });
    };
    setValueToOutput(value: number) {
        this.setState({ value });
        this.props.object.onChangeFromUI({ value });
    }
	onPaint = (ctx: CanvasRenderingContext2D) => {
        if (!ctx) return;
		let {
			bgColor,
			elementColor,
			floatOutput,
			knobColor,
			knobShape,
			value,
            size,
            thickness,
			orientation
		} = this.state;

        const [width, height] = this.refCanvasUI.current.fullSize();

		let knobHeight = 6;
		let padding = 4;
		let borderRad = 3;
		if (!floatOutput) size -= 1;
        const distance = value;

		// draw background
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

		if ((orientation === "Automatic" && width < height) || orientation === "Vertical") {
			this._orientation = "Vertical";

			if (knobShape === "Less Rounded" || knobShape === "Rounded" || knobShape === "Triangle") {
				this.interactionRect = [0, padding, width, height - width / 2 - 2 * padding];
			} else if (knobShape === "Rectangle") {
				this.interactionRect = [0, padding, width, height - 2 * padding];
			} else {
				this.interactionRect = [0, padding + knobHeight / 2, width, height - knobHeight - 2 * padding];
			}

			let onHeight = Math.ceil(((height - (2 * padding) - knobHeight) / size) * distance);
            const left = width / 2 * (1 - thickness / 100);
            const drawWidth = width * (thickness / 100);
			if (knobShape === "Indicator+") {
                ctx.fillStyle = elementColor;
				ctx.fillRect(left, padding, drawWidth, height - (2 * padding));
                ctx.fillStyle = knobColor;
				ctx.fillRect(left, height - knobHeight - padding - onHeight, drawWidth, knobHeight);
				if (distance > 0) {
					ctx.fillRect(left, height - padding - onHeight + 1, drawWidth, onHeight - 1);
				}
			} else if (knobShape === "Less Rounded") {
				knobHeight = drawWidth * 0.5;
				onHeight = Math.ceil(((height - (2 * padding) - knobHeight) / size) * distance);

				ctx.fillStyle = elementColor;
				Utils.fillRoundedRect(ctx, left, padding, drawWidth, height - (2 * padding), borderRad);
				ctx.fillStyle = knobColor;
				Utils.fillRoundedRect(ctx, left, height - padding - onHeight - knobHeight, drawWidth, onHeight + knobHeight, borderRad);
			} else if (knobShape === "Rounded") {
				knobHeight = drawWidth * 0.5;
				onHeight = Math.ceil(((height - (2 * padding) - knobHeight) / size) * distance);
                ctx.beginPath();
                ctx.arc(drawWidth * 0.5, padding + knobHeight, knobHeight, Math.PI, 0);
                ctx.closePath();
				ctx.fillStyle = elementColor;
				ctx.fill();
				ctx.fillRect(left, padding + knobHeight, drawWidth, height - (2 * padding) - knobHeight);
                ctx.beginPath();
				ctx.arc(drawWidth * 0.5, height - padding - onHeight, knobHeight, Math.PI, 0);
                ctx.closePath();
				ctx.fillStyle = knobColor;
				ctx.fill();
				if (distance > 0) {
					ctx.fillRect(left, height - padding - onHeight - 0.25, drawWidth, onHeight);
				}
			} else if (knobShape === "Triangle") {
				knobHeight = drawWidth * 0.5;
				onHeight = Math.ceil(((height - (2 * padding) - knobHeight) / size) * distance);
				ctx.fillStyle = elementColor;
                ctx.beginPath();
                ctx.moveTo(left, padding + knobHeight);
                ctx.lineTo(left + drawWidth, padding + knobHeight);
                ctx.lineTo(left + drawWidth / 2, padding);
                ctx.closePath();
				ctx.fill();
				ctx.fillRect(left, padding + knobHeight, drawWidth, height - (2 * padding) - knobHeight);
				ctx.fillStyle = knobColor;
                ctx.beginPath();
                ctx.moveTo(left, height - padding - onHeight);
                ctx.lineTo(left + drawWidth, height - padding - onHeight);
                ctx.lineTo(left + drawWidth / 2, height - padding - onHeight - knobHeight);
                ctx.closePath();
				ctx.fill();
				if (distance > 0) {
					ctx.fillRect(left, height - padding - onHeight - 0.25, drawWidth, onHeight);
				}
			} else if (knobShape === "Rectangle") {
				onHeight = Math.ceil(((height - (2 * padding)) / size) * distance);
				ctx.fillStyle = elementColor;
				ctx.fillRect(left, padding, drawWidth, height - (2 * padding));
				if (distance > 0) {
					ctx.fillStyle = knobColor;
					ctx.fillRect(left, height - padding - onHeight, drawWidth, onHeight);
				}
			} else if (knobShape === "Indicator") {
				ctx.fillStyle = knobColor;
                knobHeight *= thickness / 100;
                onHeight = Math.ceil(((height - (2 * padding) - knobHeight) / size) * distance);
				ctx.fillRect(padding, height - knobHeight - padding - onHeight, width - (2 * padding), knobHeight);

			}
		} else {
			this._orientation = "Horizontal";

			if (knobShape === "Less Rounded" || knobShape === "Rounded" || knobShape === "Triangle") {
				this.interactionRect = [padding + height / 2, 0, width - height / 2 - 2 * padding, height];
			} else if (knobShape === "Rectangle") {
				this.interactionRect = [padding, 0, width - 2 * padding, height];
			} else {
				this.interactionRect = [padding + knobHeight / 2, 0, width - knobHeight - 2 * padding, height];
			}

            const top = height / 2 * (1 - thickness / 100);
            const drawHeight = height * (thickness / 100);
			let onWidth = Math.floor(((width - (2 * padding) - knobHeight) / size) * distance);
			if (knobShape === "Indicator+") {
				ctx.fillStyle = elementColor;
				ctx.fillRect(padding, top, width - (2 * padding), drawHeight);
				ctx.fillStyle = knobColor;
				ctx.fillRect(padding + onWidth, top, knobHeight, drawHeight);
				if (distance > 0) {
					ctx.fillRect(padding, top, onWidth - 1, drawHeight);
				}
			} else if (knobShape === "Less Rounded") {
				knobHeight = drawHeight * 0.5;
				onWidth = Math.floor(((width - (2 * padding) - knobHeight) / size) * distance);
				ctx.fillStyle = elementColor;
				Utils.fillRoundedRect(ctx, padding, top, width - (2 * padding), drawHeight, borderRad);
				ctx.fillStyle = knobColor;
				Utils.fillRoundedRect(ctx, padding, top, onWidth + knobHeight, drawHeight, borderRad);
			} else if (knobShape === "Rounded") {
				knobHeight = drawHeight * 0.5;
				onWidth = Math.floor(((width - (2 * padding) - knobHeight) / size) * distance);
                ctx.beginPath();
                ctx.arc(width - padding - knobHeight, top + knobHeight, knobHeight, Math.PI * 1.5, Math.PI * 0.5);
                ctx.closePath();
				ctx.fillStyle = elementColor;
				ctx.fill();
				ctx.fillRect(padding, top, width - (2 * padding) - knobHeight, drawHeight);
                ctx.beginPath();
				ctx.arc(padding + onWidth, top + knobHeight, knobHeight, Math.PI * 1.5, Math.PI * 0.5);
                ctx.closePath();
				ctx.fillStyle = knobColor;
				ctx.fill();
				if (distance > 0) {
					ctx.fillRect(padding, top, onWidth + 0.25, drawHeight);
				}
			} else if (knobShape === "Triangle") {
				knobHeight = drawHeight * 0.5;
				onWidth = Math.floor(((width - (2 * padding) - knobHeight) / size) * distance);
				ctx.fillStyle = elementColor;
                ctx.beginPath();
                ctx.moveTo(width - padding - knobHeight, top);
                ctx.lineTo(width - padding - knobHeight, top + drawHeight);
                ctx.lineTo(width - padding, top + drawHeight / 2);
                ctx.closePath();
				ctx.fill();
				ctx.fillRect(padding, top, width - (2 * padding) - knobHeight, drawHeight);
				ctx.fillStyle = knobColor;
                ctx.beginPath();
                ctx.moveTo(onWidth + padding, top);
                ctx.lineTo(onWidth + padding, top + drawHeight);
                ctx.lineTo(onWidth + padding + knobHeight, top + drawHeight / 2);
                ctx.closePath();
				ctx.fill();
				if (distance > 0) {
					ctx.fillRect(padding, top, onWidth + 0.25, drawHeight);
				}
			} else if (knobShape === "Rectangle") {
				onWidth = Math.floor(((width - (2 * padding)) / size) * distance);
				ctx.fillStyle = elementColor;
				ctx.fillRect(padding, top, width - (2 * padding), drawHeight);
				if (distance > 0) {
					ctx.fillStyle = knobColor;
					ctx.fillRect(padding, top, onWidth, drawHeight);
				}

			} else if (knobShape === "Indicator") {
				ctx.fillStyle = knobColor;
                knobHeight *= thickness / 100;
                onWidth = Math.floor(((width - (2 * padding) - knobHeight) / size) * distance);
				ctx.fillRect(padding + onWidth, padding, knobHeight, height - (2 * padding));
			}
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
