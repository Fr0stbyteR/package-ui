import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import type keyboard from "../objects/keyboard";
import type { KeyboardInternalState } from "../objects/keyboard";
import { React, BaseUI } from "../sdk";

export interface KeyboardUIProps {
    from: number;
    to: number;
    blackKeyColor: string;
    whiteKeyColor: string;
    selectedColor: string;
    keyOnColor: string;
    mode: "mono" | "poly" | "touch";
}
export interface KeyboardUIState extends KeyboardInternalState, BaseUIState, KeyboardUIProps {}

export default class KeyboardUI<T extends keyboard> extends BaseUI<T, {}, KeyboardUIState> {
    static sizing = "both" as const;
    static defaultSize: [number, number] = [450, 60];
    static blacks = [1, 3, 6, 8, 10];
    state: KeyboardUIState = { ...this.state, keys: this.object._.keys, selected: undefined };
    isBlack(key: number) {
        return KeyboardUI.blacks.indexOf(key % 12) !== -1;
    }
    get from() {
        if (this.isBlack(this.state.from)) return this.state.from - 1;
        return this.state.from;
    }
    get to() {
        if (this.isBlack(this.state.to)) return this.state.to + 1;
        return this.state.to;
    }
    get whiteCount() {
        const { to } = this;
        let { from } = this;
        if (from >= to) return 0;
        let count = 0;
        while (from <= to) {
            if (!this.isBlack(from++)) count++;
        }
        return count;
    }
    mouseDown = false;
    touches: number[] = [];
    handleMouseDownKey = (e: React.MouseEvent<SVGRectElement>) => {
        const key = +e.currentTarget.getAttribute("values");
        if (this.state.mode === "touch") {
            if (this.state.keys[key]) return;
            this.touches[-1] = key;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.pageY - rect.top;
        const height = rect.height;
        const velocity = (Math.min(127, ~~(y / height * 128)) || 1);
        this.object.keyTrigger(key, velocity);
        this.mouseDown = true;
        const handleMouseUp = () => {
            this.mouseDown = false;
            if (this.state.mode === "touch" && this.touches[-1]) {
                this.object.keyTrigger(this.touches[-1], 0);
                delete this.touches[-1];
            }
            this.setState({ selected: undefined });
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mouseup", handleMouseUp);
    };
    handleMouseEnterKey = (e: React.MouseEvent<SVGRectElement>) => {
        if (!this.mouseDown) return;
        const key = +e.currentTarget.getAttribute("values");
        if (this.state.mode === "touch") {
            if (this.touches[-1] && this.touches[-1] !== key) {
                this.object.keyTrigger(this.touches[-1], 0);
                delete this.touches[-1];
            }
            if (this.state.keys[key]) return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.pageY - rect.top;
        const height = rect.height;
        const velocity = (Math.min(127, ~~(y / height * 128)) || 1);
        this.object.keyTrigger(key, velocity);
        if (this.state.mode === "touch") this.touches[-1] = key;
    };
    handleTouchStartKey = (e: React.TouchEvent<SVGRectElement>, keyIn?: number) => {
        if (this.state.mode !== "touch") return;
        e.stopPropagation();
        const key = typeof keyIn === "number" ? keyIn : +e.currentTarget.getAttribute("values");
        Array.from(e.changedTouches).forEach((touch) => {
            const { identifier: id } = touch;
            if (this.touches[id]) this.object.keyTrigger(this.touches[id], 0);
            this.touches[id] = key;
            const rect = e.currentTarget.getBoundingClientRect();
            const y = touch.pageY - rect.top;
            const height = rect.height;
            const velocity = (Math.min(127, ~~(y / height * 128)) || 1);
            this.object.keyTrigger(key, velocity);
        });
    };
    handleTouchMoveKey = (e: React.TouchEvent<SVGRectElement>) => {
        if (this.state.mode !== "touch") return;
        e.stopPropagation();
        e.preventDefault();
        Array.from(e.changedTouches).forEach((touch) => {
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target.parentElement !== e.currentTarget.parentElement) return;
            const key = +target.getAttribute("values");
            if (typeof key === "undefined") return;
            if (this.state.keys[key]) return;
            this.handleTouchStartKey(e, key);
        });
    };
    handleTouchEndKey = (e: React.TouchEvent<SVGRectElement>) => {
        if (this.state.mode !== "touch") return;
        e.stopPropagation();
        e.preventDefault();
        Array.from(e.changedTouches).forEach((touch) => {
            const { identifier: id } = touch;
            if (this.touches[id]) this.object.keyTrigger(this.touches[id], 0);
            delete this.touches[id];
        });
    };
    render() {
        const { from, to, whiteCount, state } = this;
        const { blackKeyColor, whiteKeyColor, keyOnColor, selectedColor, selected } = state;
        const whites: JSX.Element[] = [];
        const blacks: JSX.Element[] = [];
        const blackStyle: React.CSSProperties = { fill: blackKeyColor, strokeWidth: 1, stroke: "black" };
        const whiteStyle: React.CSSProperties = { fill: whiteKeyColor, strokeWidth: 1, stroke: "black" };
        const keyOnStyle: React.CSSProperties = { fill: keyOnColor, strokeWidth: 1, stroke: "black" };
        const selectedStyle: React.CSSProperties = { fill: selectedColor, strokeWidth: 1, stroke: "black" };
        const whiteWidthPercentage = 100 / whiteCount;
        const blackWidthPercentage = 100 / whiteCount * 2 / 3;
        const whiteWidth = `${whiteWidthPercentage}%`;
        const blackWidth = `${blackWidthPercentage}%`;
        let $white = 0;
        let key = from;
        while (key <= to) {
            const $key = key;
            const keyOn = +!!this.state.keys[$key];
            const commonProps: React.SVGProps<SVGRectElement> = {
                key: $key,
                values: `${key}`,
                onMouseDown: this.handleMouseDownKey,
                onMouseEnter: this.handleMouseEnterKey,
                onTouchStart: this.handleTouchStartKey,
                onTouchMove: this.handleTouchMoveKey,
                onTouchEnd: this.handleTouchEndKey
            };
            if (this.isBlack(key)) {
                const style = key === selected ? selectedStyle : keyOn ? keyOnStyle : blackStyle;
                const x = `${($white - 1 / 3) * whiteWidthPercentage}%`;
                blacks.push(<rect x={x} y={0} width={blackWidth} height="70%" style={style} {...commonProps} />);
            } else {
                const style = key === selected ? selectedStyle : keyOn ? keyOnStyle : whiteStyle;
                const x = `${$white * whiteWidthPercentage}%`;
                whites.push(<rect x={x} y={0} width={whiteWidth} height="100%" style={style} {...commonProps} />);
                $white++;
            }
            key++;
        }
        return (
            <BaseUI {...this.props} containerProps={{ style: { height: "100%", width: "100%" } }}>
                <svg width="100%" height="100%" style={{ touchAction: "none" }}>
                    <rect x={0} y={0} width="100%" height="100%" style={{ fill: "transparent", strokeWidth: 2, stroke: "black" }} />
                    {whites}
                    {blacks}
                </svg>
            </BaseUI>
        );
    }
}