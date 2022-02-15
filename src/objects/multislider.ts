import type { IInletsMeta, IOutletsMeta, IPropsMeta, ObjectUpdateOptions } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { BaseObjectProps } from "@jspatcher/jspatcher/src/core/objects/base/BaseObject";
import { Bang, isBang, BufferUtils, Utils } from "../sdk";
import MultisliderUI, { MultisliderUIState } from "../ui/multislider";
import UIObject from "./base";

export interface MultisliderState {
    value: number[];
}
export interface MultisliderProps {
    bgColor: string;
    peakColor: string;
    sliderColor: string;
    candycane: number;
    candicane2: string;
    candicane3: string;
    candicane4: string;
    candicane5: string;
    candicane6: string;
    candicane7: string;
    candicane8: string;
    contData: boolean;
    drawPeaks: boolean;
    ghostBar: number;
    orientation: "Horizontal" | "Vertical";
    setMinMax: [number, number];
    setStyle: "Thin Line" | "Bar" | "Point Scroll" | "Line Scroll" | "Reverse Point Scroll" | "Reverse Line Scroll";
    setType: "Integer" | "Floating-point";
    signed: boolean;
    size: number;
    spacing: number;
    thickness: number;
}

export default class multislider extends UIObject<{}, MultisliderState, [number[] | number | Bang | Partial<{ fetch: number; set: [number, number]; setlist: number[]; select: number[]; }> | "max" | "maximum" | "min" | "minimum" | "sum"], [number[], number], [], MultisliderProps, MultisliderUIState, {}> {
    static description = "Move a slider to output values";
    static inlets: IInletsMeta = [{
        type: "anything",
        isHot: true,
        description: 'number[] | number | Bang | Partial<{ fetch: number; set: [number, number]; setlist: number[]; select: number[]; }> | "max" | "maximum" | "min" | "minimum" | "sum"'
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "When a multislider receives a list, int, or float in its inlet, it outputs a list of its current values."
    }, {
        type: "number",
        description: "The value of a numbered slider specified by the fetch message."
    }];
    static props: IPropsMeta<MultisliderProps> = {
        bgColor: {
            type: "color",
            default: "rgb(51, 51, 51)",
            description: "Specifies the background color of the multislider.",
            isUIState: true
        },
        peakColor: {
            type: "color",
            default: "rgb(89, 89, 89)",
            description: "Specifies the peak indicators when Peak-Hold display is turned on.",
            isUIState: true
        },
        sliderColor: {
            type: "color",
            default: "rgb(206, 229, 232)",
            description: "Specifies the slider color of the multislider object.",
            isUIState: true
        },
        candycane: {
            type: "number",
            default: 1,
            description: "Use multiple colors for adjacent sliders.",
            isUIState: true
        },
        candicane2: {
            type: "color",
            default: "rgb(37, 53, 91)",
            description: "Specifies the 2nd slider color in candycane mode.",
            isUIState: true
        },
        candicane3: {
            type: "color",
            default: "rgb(75, 106, 183)",
            description: "Specifies the 3rd slider color in candycane mode.",
            isUIState: true
        },
        candicane4: {
            type: "color",
            default: "rgb(112, 159, 19)",
            description: "Specifies the 4th slider color in candycane mode.",
            isUIState: true
        },
        candicane5: {
            type: "color",
            default: "rgb(150, 211, 110)",
            description: "Specifies the 5th slider color in candycane mode.",
            isUIState: true
        },
        candicane6: {
            type: "color",
            default: "rgb(225, 62, 38)",
            description: "Specifies the 6th slider color in candycane mode.",
            isUIState: true
        },
        candicane7: {
            type: "color",
            default: "rgb(225, 62, 38)",
            description: "Specifies the 7th slider color in candycane mode.",
            isUIState: true
        },
        candicane8: {
            type: "color",
            default: "rgb(7, 115, 129)",
            description: "Specifies the 8th` slider color in candycane mode.",
            isUIState: true
        },
        contData: {
            type: "boolean",
            default: false,
            description: "Toggles continuous output mode for non-scrolling display styles.",
            isUIState: true
        },
        drawPeaks: {
            type: "boolean",
            default: false,
            description: "Toggles setting the multislider to draw peak-output lines when displaying slider values.",
            isUIState: true
        },
        ghostBar: {
            type: "number",
            default: 0,
            description: 'Enables the drawing of a "ghost" bar when mode the multislider object is in Thin Line mode.',
            isUIState: true
        },
        orientation: {
            type: "enum",
            enums: ["Horizontal", "Vertical"],
            default: "Vertical",
            description: "Set the sliders to be drawn with a horizontal or vertical orientation.",
            isUIState: true
        },
        setMinMax: {
            type: "object",
            default: [-1, 1],
            description: "Sets the low and high range values for the multislider object.",
            isUIState: true
        },
        setStyle: {
            type: "enum",
            enums: ["Thin Line", "Bar", "Point Scroll", "Line Scroll", "Reverse Point Scroll", "Reverse Line Scroll"],
            default: "Thin Line",
            description: "Sets the display style of the multislider object.",
            isUIState: true
        },
        setType: {
            type: "enum",
            enums: ["Integer", "Floating-point"],
            default: "Floating-point",
            description: "Sets the multislider object for integer or floating point operation.",
            isUIState: true
        },
        signed: {
            type: "boolean",
            default: false,
            description: "Sets the signed or unsigned display mode for bar sliders.",
            isUIState: true
        },
        size: {
            type: "number",
            default: 1,
            description: "Sets the number of sliders the multislider object has.",
            isUIState: true
        },
        spacing: {
            type: "number",
            default: 1,
            description: "Sets the amount of space (in pixels) between sliders.",
            isUIState: true
        },
        thickness: {
            type: "number",
            default: 2,
            description: 'Sets the pen thickness of "thin line"style sliders.',
            isUIState: true
        }
    };
    static UI = MultisliderUI;
    state: MultisliderState = { value: [0] };
    toValidValue(valueIn: number[]): number[] {
        const type = this.getProp("setType");
        const [min, max] = this.getProp("setMinMax");

        return valueIn.map(value => Math.min(max, Math.max(min, type === "Integer" ? Math.round(value || 0) : (value || 0))));
    }
    validateValue(valueIn: number[]) {
        const value = this.toValidValue(valueIn);
        if (value === this.state.value) return;
        this.setState({ value });
    }
    outputValue() {
        this.outlet(0, this.state.value);
    }
    onChangeFromUI({ value }: { value: number[] }) {
        this.setState({ value });
        this.outputValue();
    }
    async updateProps(propsIn: Partial<MultisliderProps & BaseObjectProps>, options?: ObjectUpdateOptions) {
        if ("setMinMax" in propsIn) {
            const { setMinMax } = propsIn;
            let [min, max] = setMinMax;
            if (max < min) [min, max] = [max, min];
            propsIn.setMinMax = [min || 0, max || 0];
        }
        if ("size" in propsIn) {
            const { size } = propsIn;
            propsIn.size = Math.max(1, ~~size || 0);
        }
        return super.updateProps(propsIn, options);
    }
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    const { value } = this.state;
                    if (typeof data === "number") {
                        value.fill(data);
                        this.validateValue(value);
                        this.updateUI({ value: this.state.value });
                        this.outputValue();
                        return;
                    } else if (Utils.isNumberArray(data)) {
                        if (!data.length) return;
                        this.setProps({ size: data.length });
                        this.validateValue(data);
                        this.updateUI({ value: this.state.value });
                        this.outputValue();
                        return;
                    } else if (typeof data === "string") {
                        if (data === "sum") {
                            this.outlet(1, BufferUtils.sum(value));
                            return;
                        } else if (data === "max") {
                            const [, max] = this.getProp("setMinMax");
                            const { value } = this.state;
                            value.fill(max);
                            this.validateValue(value);
                            this.updateUI({ value: this.state.value });
                            this.outputValue();
                            return;
                        } else if (data === "min") {
                            const [min] = this.getProp("setMinMax");
                            const { value } = this.state;
                            value.fill(min);
                            this.validateValue(value);
                            this.updateUI({ value: this.state.value });
                            this.outputValue();
                            return;
                        } else if (data === "minimum") {
                            this.outlet(1, Math.min(...value));
                            return;
                        } else if (data === "maximum") {
                            this.outlet(1, Math.max(...value));
                            return;
                        }
                    } else if (typeof data === "object") {
                        if ("fetch" in data) {
                            const { fetch } = data;
                            this.outlet(1, value[~~fetch - 1]);
                            return;
                        } else if ("set" in data) {
                            const { set } = data;
                            const [idx, val] = set;
                            if (idx >= 1 && idx <= value.length) value[~~idx - 1] = val;
                            this.validateValue(value);
                            this.updateUI({ value: this.state.value });
                            return;
                        } else if ("setlist" in data) {
                            const { setlist } = data;
                            if (!setlist.length || !Utils.isNumberArray(setlist)) return;
                            this.setProps({ size: setlist.length });
                            this.validateValue(setlist);
                            this.updateUI({ value: this.state.value });
                        } else if ("select" in data) {
                            const { select } = data;
                            for (let i = 0; i + 1 < select.length; i += 2) {
                                const idx = select[i];
                                const val = select[i + 1];
                                if (idx >= 1 && idx <= value.length) value[~~idx - 1] = val;
                            }
                            this.validateValue(value);
                            this.updateUI({ value: this.state.value });
                            this.outputValue();
                            return;
                        }
                    }
                }
                this.outputValue();
            }
        });
        this.on("propsUpdated", ({ props, oldProps }) => {
            if (props.size !== oldProps.size) this.setState({ value: [...this.state.value, ...new Array(props.size).fill(this.getProp("setMinMax")[0])].slice(0, props.size) });
            this.validateValue(this.state.value);
            this.updateUI({ value: this.state.value });
        });
        this.on("postInit", () => {
            this.setState({ value: new Array(this.getProp("size")).fill(this.getProp("setMinMax")[0]) });
        });
        this.on("updateState", ({ value }) => {
            this.validateValue(value);
            this.updateUI({ value: this.state.value });
            this.outputValue();
        });
    }
}
