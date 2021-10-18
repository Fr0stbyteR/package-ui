import type { CanvasUIState } from "@jspatcher/jspatcher/src/core/objects/base/CanvasUI";
import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { React, CanvasUI } from "../sdk";
import * as Color from "color-js";
import type multislider from "../objects/multislider";
import type { MultisliderProps, MultisliderState } from "../objects/multislider";

interface PointerDownEvent<T = Element> {
    x: number;
    y: number;
    id: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent<T> | React.TouchEvent<T>;
}

interface PointerDragEvent<T = Element> {
    x: number;
    y: number;
    fromX: number;
    fromY: number;
    movementX: number;
    movementY: number;
    id: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent<T> | React.TouchEvent<T>;
}

interface PointerUpEvent<T = Element> {
    x: number;
    y: number;
    id: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent<T> | React.TouchEvent<T>;
}

export interface MultisliderUIState extends MultisliderState, CanvasUIState, MultisliderProps {
    focus: boolean;
    inTouch: boolean;
}

// https://github.com/Cycling74/miraweb/blob/master/src/js/objects/slider.js
export default class MultisliderUI extends CanvasUI<multislider, {}, MultisliderUIState> {
    static CANDICANE_9_23 = [
        "rgb(204, 156, 97)",
        "rgb(1, 189, 156)",
        "rgb(204, 140, 140)",
        "rgb(1, 156, 156)",
        "rgb(1, 227, 23)",
        "rgb(40, 204, 140)",
        "rgb(74, 156, 97)",
        "rgb(97, 156, 156)",
        "rgb(156, 179, 1)",
        "rgb(194, 181, 207)",
        "rgb(153, 153, 1)",
        "rgb(102, 102, 204)",
        "rgb(153, 102, 153)",
        "rgb(1, 92, 174)",
        "rgb(1, 138, 215)",
    ];
    refCanvasUI = React.createRef<CanvasUI>();
    state: MultisliderUIState = {
        ...this.state,
        value: this.object.state.value,
        focus: false,
        inTouch: false
    };
    handleKeyDown = (e: React.KeyboardEvent) => {};
    handleKeyUp = (e: React.KeyboardEvent) => {};
    touches: Record<number, { prevX: number; prevY: number; fromX: number; fromY: number; }> = {};
    private handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.currentTarget.focus();
        const rect = e.currentTarget.getBoundingClientRect();
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach((touch) => {
                const id = touch.identifier;
                const clientX = touch.clientX;
                const clientY = touch.clientY;
                let { fromX, fromY, prevX, prevY } = this.touches[id];
                const movementX = clientX - prevX;
                const movementY = clientY - prevY;
                prevX = clientX;
                prevY = clientY;
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                this.touches[id].prevX = prevX;
                this.touches[id].prevY = prevY;
                this.handlePointerDrag({ id, x, y, fromX, fromY, movementX, movementY, originalEvent: e });
            })
        };
        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach((touch) => {
                const id = touch.identifier;
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.handlePointerUp({ id, x, y, originalEvent: e });
                delete this.touches[id];
            })
            if (!e.touches.length) {
                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
            }
        };
        if (!Object.keys(this.touches).length) {
            document.addEventListener("touchmove", handleTouchMove, { passive: false });
            document.addEventListener("touchend", handleTouchEnd, { passive: false });
        }
        Array.from(e.touches).forEach((touch) => {
            const id = touch.identifier;
            let prevX = touch.clientX;
            let prevY = touch.clientY;
            const fromX = prevX - rect.left;
            const fromY = prevY - rect.top;
            this.handlePointerDown({ id, x: fromX, y: fromY, originalEvent: e });
            this.touches[id] = { prevX, prevY, fromX, fromY };
        })
    };
    handleWheel = (e: React.WheelEvent) => {};
    handleClick = (e: React.MouseEvent) => {};
    private handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.currentTarget.focus();
        const rect = e.currentTarget.getBoundingClientRect();
        const fromX = e.clientX - rect.left;
        const fromY = e.clientY - rect.top;
        this.handlePointerDown({ id: null, x: fromX, y: fromY, originalEvent: e });
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePointerDrag({ id: null, x, y, fromX, fromY, movementX: e.movementX, movementY: e.movementY, originalEvent: e });
        };
        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePointerUp({ id: null, x, y, originalEvent: e });
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
    _lastPointerSlider: Record<number, number> = {};
    peaks: number[] = [];
    _values: number[][] = [];
    interactionRect: number[] = [0, 0, 0, 0];
	_getSliderIndex(e: PointerDownEvent<HTMLCanvasElement>) {
        const { orientation, size } = this.state
		if (orientation === "Vertical") {
			return ~~(e.x / this.refCanvasUI.current.canvas.width * size);
		} else {
			return ~~(e.y / this.refCanvasUI.current.canvas.height * size);
		}
	}
	_getValue(e: PointerDownEvent<HTMLCanvasElement>) {
        const { setMinMax, orientation } = this.state;
        const [min, max] = setMinMax;
		const range = max - min;

		let newVal;
		if (orientation === "Vertical") {
			newVal = (1 - e.y / this.refCanvasUI.current.canvas.height) * range + setMinMax[0];
		} else {
			newVal = e.x / this.refCanvasUI.current.canvas.width * range + setMinMax[0];
		}

		return Math.min(max, Math.max(min, newVal));
	}
    handlePointerDown = (e: PointerDownEvent<HTMLCanvasElement>) => {
		const { value, size, setStyle } = this.state;
        if (setStyle === "Point Scroll" || setStyle === "Line Scroll" || setStyle === "Reverse Point Scroll" || setStyle === "Reverse Line Scroll") return;

		const sliderIndex = this._getSliderIndex(e);
		if (sliderIndex < 0 || sliderIndex >= size) return;

		const newVal = this._getValue(e);
		value[sliderIndex] = newVal;

		this._lastPointerSlider[e.id] = sliderIndex;
        this.setValueToOutput(value);
    };
    handlePointerDrag = (e: PointerDragEvent<HTMLCanvasElement>) => {
		const { value, contData, size, setType, setStyle } = this.state;
        if (setStyle === "Point Scroll" || setStyle === "Line Scroll" || setStyle === "Reverse Point Scroll" || setStyle === "Reverse Line Scroll") return;

		let sliderIndex = this._getSliderIndex(e);

		const newVal = this._getValue(e);

		const lastIndex = this._lastPointerSlider[e.id] || sliderIndex;

		if (lastIndex !== sliderIndex) {

			// boundary check for index
			sliderIndex = Math.min(size - 1, Math.max(0, sliderIndex));

			const lastIndexVal = value[lastIndex];

			// simple linear interpolation in the direction of the finger in order to follow a bit more natural
			let stepWidth = sliderIndex - lastIndex;
			stepWidth = stepWidth < 0 ? -stepWidth : stepWidth;

			const stepVal = (newVal - lastIndexVal) / stepWidth;

			if (lastIndex < sliderIndex) {
				for (let i = 0; i <= stepWidth; i++) {
					if (setType === "Integer") value[lastIndex + i] = Math.round(lastIndexVal + i * stepVal);
					else value[lastIndex + i] = lastIndexVal + i * stepVal;
				}
			} else if (lastIndex > sliderIndex) {
				for (let i = 0; i <= stepWidth; i++) {
					if (setType === "Integer") value[lastIndex - i] = Math.round(value[lastIndex - i] = lastIndexVal + i * stepVal);
					else value[lastIndex - i] = lastIndexVal + i * stepVal;
				}
			}
		} else {
			if (sliderIndex < 0 || sliderIndex >= size) return;
			if (setType === "Integer") value[sliderIndex] = Math.round(newVal);
			else value[sliderIndex] = newVal;
		}

		this._lastPointerSlider[e.id] = sliderIndex;

        const valueOut = this.object.toValidValue(value);
        this.setState({ value: valueOut });
        if (contData) this.props.object.onChangeFromUI({ value: valueOut });
    };
    handlePointerUp = (e: PointerUpEvent) => {
		const { value, contData, setStyle } = this.state;
        if (setStyle === "Point Scroll" || setStyle === "Line Scroll" || setStyle === "Reverse Point Scroll" || setStyle === "Reverse Line Scroll") return;

		delete this._lastPointerSlider[e.id];
        if (!contData) this.setValueToOutput(value);
    };
    handleFocusIn = (e: React.FocusEvent) => this.setState({ focus: true });
    handleFocusOut = () => {
        this.setState({ focus: false });
    };
    setValueToOutput(valueIn: number[]) {
        const value = this.object.toValidValue(valueIn);
        this.setState({ value });
        this.props.object.onChangeFromUI({ value });
    }
	onPaint = (ctx: CanvasRenderingContext2D) => {
        if (!ctx) return;
		let {
			ghostBar,
			setStyle,
			candycane,
			size,
			setMinMax,
			orientation,
			bgColor,
			sliderColor,
			candicane2,
			candicane3,
			candicane4,
			candicane5,
			candicane6,
			candicane7,
			candicane8,
			peakColor,
			drawPeaks,
			signed,
			spacing,
            thickness,
            value
		} = this.state;

        const [width, height] = this.refCanvasUI.current.fullSize();
		if (setStyle === "Bar") {
			thickness = 2;
		}

		let colors = [sliderColor, candicane2, candicane3, candicane4, candicane5, candicane6, candicane7, candicane8];
		colors = colors.concat(MultisliderUI.CANDICANE_9_23);
		const [min, max] = setMinMax;
		const range = max - min;
		const transparentColor = "transparent";
        if (!this.peaks.length) this.peaks = [...value];

        if (setStyle === "Point Scroll" || setStyle === "Line Scroll" || setStyle === "Reverse Point Scroll" || setStyle === "Reverse Line Scroll") {
            for (let i = 0; i < size; i++) {
                if (!Array.isArray(this._values[i])) this._values[i] = [];
            }
        }
		if (orientation === "Horizontal") {
			// draw background
			const sliderHeight = (height - spacing * (size + 1)) / size;
			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, width, height);

			let currY = spacing;

			for (let i = 0; i < size; i++) {
				let sliderX = ((width) / range) * (value[i] - min);
				sliderX += (thickness * 0.3);
				sliderX = Math.min(Math.max(sliderX, thickness), width) - thickness / 2;
				let zeroX = 0;

				ctx.strokeStyle = colors[i % candycane];
				ctx.lineWidth = thickness;
				if (setStyle === "Bar" || setStyle === "Thin Line") {
                    ctx.beginPath();
					ctx.moveTo(sliderX, currY);
					ctx.lineTo(sliderX, currY + sliderHeight);
                    ctx.closePath();
					ctx.stroke();
				}
				if (signed) {

					if (value[i] > 0) {
						zeroX = ((width / range) * (0 - min));
					}
					else {
						zeroX = sliderX;
						sliderX = ((width / range) * (0 - min));
					}
				}
				if ((setStyle === "Bar" || setStyle === "Thin Line") && drawPeaks) {
					ctx.strokeStyle = peakColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
					if (value[i] > this.peaks[i]) {
						ctx.moveTo(sliderX + thickness, currY);
						ctx.lineTo(sliderX + thickness, currY + sliderHeight);
						this.peaks[i] = value[i];
					} else if (value[i] <= this.peaks[i]) {
						ctx.moveTo((width / range) * (this.peaks[i] - min) + thickness, currY);
						ctx.lineTo((width / range) * (this.peaks[i] - min) + thickness, currY + sliderHeight);
					}
                    ctx.closePath();
					ctx.stroke();
				}

				if (setStyle === "Bar" || (setStyle === "Thin Line" && ghostBar > 0)) {
					if (setStyle === "Thin Line") ctx.fillStyle = Color(colors[i % candycane]).setAlpha(ghostBar / 100).toRGB();
					else ctx.fillStyle = colors[i % candycane];
					ctx.fillRect(zeroX, currY, sliderX - zeroX, sliderHeight);
				}
				else if (setStyle === "Point Scroll" || setStyle === "Reverse Point Scroll") {

					ctx.fillStyle = colors[i % candycane];
					for (let j = 0; j < this._values[i].length; j++) {
						let cx = ((width / size) / range) * (this._values[i][j] - min);
						let cy = (setStyle === "Point Scroll") ? j : height - j;
                        ctx.beginPath();
						ctx.ellipse(width / size * i + cx, cy, 0.5, 0.5, 0, 0, Math.PI * 2);
                        ctx.closePath();
						ctx.fill();
					}
				}
				else if (setStyle === "Line Scroll" || setStyle === "Reverse Line Scroll") {
					ctx.strokeStyle = colors[i % candycane];
					for (let j = 0; j < this._values[i].length; j++) {
						let cx = ((width / size) / range) * (this._values[i][j] - min);
						let cy = (setStyle === "Line Scroll") ? j : height - j;
						let xZero;
						if (max >= 0 && min >= 0) {
							xZero = 0;
						} else if (max < 0 && min < 0) {
							xZero = 1;
						} else {
							xZero = -min / (max - min);
						}
						ctx.lineWidth = 1;
                        ctx.beginPath();
						ctx.moveTo(((width / size) * (i + xZero)), cy);
						ctx.lineTo(((width / size) * (i)) + cx, cy);
                        ctx.closePath();
						ctx.stroke();
					}


				}

				ctx.fillStyle = transparentColor;
				ctx.fillRect(0, currY - spacing / 2, width + thickness, sliderHeight + spacing);
				// ctx.add_attribute("slider", i);

				currY += sliderHeight + spacing;
			}

		} else if (orientation === "Vertical") {
			// draw background
			let sliderWidth = (width - spacing * (size + 1)) / size;
			ctx.fillStyle = bgColor;
			if (setStyle === "Point Scroll" || setStyle === "Line Scroll" || setStyle === "Reverse Point Scroll" || setStyle === "Reverse Line Scroll") ctx.fillRect(0, 0, width, height);
			else ctx.fillRect(0, 0, width, height);

			let currX = spacing;
			for (let i = 0; i < size; i++) {
				let sliderY = ((height) / range) * (value[i] - min);
				sliderY += (thickness * 0.3);
				sliderY = Math.min(Math.max(sliderY, thickness), height) - thickness / 2;
				let zeroY = 0;

				ctx.strokeStyle = colors[i % candycane];
				ctx.lineWidth = thickness;
				if (setStyle === "Bar" || setStyle === "Thin Line") {
                    ctx.beginPath();
					ctx.moveTo(currX, height - sliderY);
					ctx.lineTo(currX + sliderWidth, height - sliderY);
                    ctx.closePath();
					ctx.stroke();
				}
				if (signed) {

					if (value[i] > 0) {
						zeroY = ((height / range) * (0 - min));
					}
					else {
						zeroY = sliderY;
						sliderY = ((height / range) * (0 - min));
					}
				}
				if ((setStyle === "Bar" || setStyle === "Thin Line") && drawPeaks) {
					ctx.strokeStyle = peakColor;
					ctx.lineWidth = 1;
                    ctx.beginPath();
					if (value[i] > this.peaks[i]) {
						ctx.moveTo(currX, height - sliderY);
						ctx.lineTo(currX + sliderWidth, height - sliderY);
						this.peaks[i] = value[i];
					} else if (value[i] <= this.peaks[i]) {
						ctx.moveTo(currX, height - ((height / range) * (this.peaks[i] - min)));
						ctx.lineTo(currX + sliderWidth, height - ((height / range) * (this.peaks[i] - min)));
					}
                    ctx.closePath();
					ctx.stroke();

				}


				if (setStyle === "Bar" || (setStyle === "Thin Line" && ghostBar > 0)) {
					if (setStyle === "Thin Line") ctx.fillStyle = Color(colors[i % candycane]).setAlpha(ghostBar / 100).toRGB();
					else ctx.fillStyle = colors[i % candycane];
					ctx.fillRect(currX, height - sliderY, sliderWidth, sliderY - zeroY);
				}
				else if (setStyle === "Point Scroll" || setStyle === "Reverse Point Scroll") {

					ctx.fillStyle = colors[i % candycane];
					for (let j = 0; j < this._values[i].length; j++) {
						let cy = ((height / size) / range) * (this._values[i][j] - min);
						let cx = (setStyle === "Point Scroll") ? j : width - j;
                        ctx.beginPath();
						ctx.ellipse(cx, ((height / size) * (i + 1)) - cy, 0.5, 0.5, 0, 0, Math.PI * 2);
                        ctx.closePath();
						ctx.fill();
					}
				}
				else if (setStyle === "Line Scroll" || setStyle === "Reverse Line Scroll") {
					ctx.strokeStyle = colors[i % candycane];
					for (let j = 0; j < this._values[i].length; j++) {
						let cy 	= ((height / size) / range) * (this._values[i][j] - min);
						let cx = (setStyle === "Line Scroll") ? j : width - j;
						ctx.lineWidth = 1;
						let yZero;
						if (max >= 0 && min >= 0) {
							yZero = 1;
						} else if (max < 0 && min < 0) {
							yZero = 0;
						} else {
							yZero = max / (max - min);
						}
                        ctx.beginPath();
						ctx.moveTo(cx, ((height / size) * (i + yZero)));
						ctx.lineTo(cx, ((height / size) * (i + 1)) - cy);
                        ctx.closePath();
						ctx.stroke();
					}

				}
				ctx.fillStyle = transparentColor;
				ctx.fillRect(currX - spacing / 2, 0, sliderWidth + spacing, height + thickness);

				currX += sliderWidth + spacing;
			}
		}
	}
    handleScroll = (e: Partial<MultisliderUIState & BaseUIState>) => {
        if (e.value && this.refCanvasUI.current?.canvas) {
            const { value } = e;
            const { setStyle, size, orientation } = this.state;
            const { width, height } = this.refCanvasUI.current.canvas;
            if (setStyle === "Point Scroll" || setStyle === "Line Scroll" || setStyle === "Reverse Point Scroll" || setStyle === "Reverse Line Scroll") {
                for (let i = 0; i < size; i++) {
                    if (!Array.isArray(this._values[i])) this._values[i] = [];
                    if (this._values[i].length === (orientation === "Horizontal" ? height : width)) this._values[i].pop();
                    else if (this._values[i].length > (orientation === "Horizontal" ? height : width)) this._values[i] = [];
                    this._values[i].unshift(value[i]);
                }
            }

        }
    };
    componentDidMount() {
        this.object.on("updateUI", this.handleScroll);
        super.componentDidMount();
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.object.off("updateUI", this.handleScroll);
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
