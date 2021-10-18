import type { IInletsMeta, IOutletsMeta, IPropsMeta, ObjectUpdateOptions } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { BaseObjectProps } from "@jspatcher/jspatcher/src/core/objects/base/BaseObject";
import { Bang, isBang } from "../sdk";
import SliderUI, { SliderUIState } from "../ui/slider";
import UIObject from "./base";

export interface SliderState {
    value: number;
}
export interface SliderProps {
    floatOutput: boolean;
    orientation: "Automatic" | "Horizontal" | "Vertical";
    relative: boolean;
    bgColor: string;
    elementColor: string;
    knobColor: string;
    knobShape: "Indicator+" | "Less Rounded" | "Rounded" | "Triangle" | "Rectangle" | "Indicator";
    thickness: number;
    min: number;
    mult: number;
    size: number;
}

export default class slider extends UIObject<{}, SliderState, [number | Bang], [number], [], SliderProps, SliderUIState, {}> {
    static description = "Move a slider to output values";
    static inlets: IInletsMeta = [{
        type: "anything",
        isHot: true,
        description: "Displays Value Received"
    }];
    static outlets: IOutletsMeta = [{
        type: "number",
        description: "Outputs Value When Slider is Changed"
    }];
    static props: IPropsMeta<SliderProps> = {
        floatOutput: {
            type: "boolean",
            default: false,
            description: "Toggles floating-point output from the slider object.",
            isUIState: true
        },
        orientation: {
            type: "enum",
            enums: ["Automatic", "Horizontal", "Vertical"],
            default: "Automatic",
            description: "Sets the slider object to a horizontal or vertical data display.",
            isUIState: true
        },
        relative: {
            type: "boolean",
            default: false,
            description: "Sets the way that the slider object responds to mouse clicks.",
            isUIState: true
        },
        bgColor: {
            type: "color",
            default: "rgb(51, 51, 51)",
            description: "Sets the slider background color.",
            isUIState: true
        },
        elementColor: {
            type: "color",
            default: "rgb(89, 89, 89)",
            description: "Sets the slider off color.",
            isUIState: true
        },
        knobColor: {
            type: "color",
            default: "rgb(206, 229, 232)",
            description: "Sets the slider knob color.",
            isUIState: true
        },
        knobShape: {
            type: "enum",
            enums: ["Indicator+", "Less Rounded", "Rounded", "Triangle", "Rectangle", "Indicator"],
            default: "Indicator+",
            description: "Sets the shape of the slider knob.",
            isUIState: true
        },
        thickness: {
            type: "number",
            default: 100,
            description: "Sets the thickness of the slider knob.",
            isUIState: true
        },
        min: {
            type: "number",
            default: 0,
            description: "Sets value that will be added to the slider object's value before it is sent out the outlet.",
            isUIState: true
        },
        mult: {
            type: "number",
            default: 1,
            description: "Multiplier",
            isUIState: true
        },
        size: {
            type: "number",
            default: 128,
            description: "Value range",
            isUIState: true
        }
    };
    static UI = SliderUI;
    state: SliderState = { value: 0 };
    toValidValue(valueIn: number): number {
        let size = this.getProp("size");
        const floatOutput = this.getProp("floatOutput");
		if (!floatOutput) size -= 1;

        return Math.min(size, Math.max(0, (floatOutput ? valueIn : ~~valueIn) || 0));
    }
    validateValue(valueIn: number) {
        const value = this.toValidValue(valueIn);
        if (value === this.state.value) return;
        this.setState({ value });
    }
    outputValue() {
        const min = this.getProp("min");
        const mult = this.getProp("mult");
        this.outlet(0, min + mult * this.state.value);
    }
    onChangeFromUI({ value }: { value: number }) {
        this.setState({ value });
        this.outputValue();
    }
    async updateProps(propsIn: Partial<SliderProps & BaseObjectProps>, options?: ObjectUpdateOptions) {
        if ("size" in propsIn) {
            const { size } = propsIn;
            const floatOutput = "floatOutput" in propsIn ? propsIn.floatOutput : this.getProp("floatOutput");
            if (floatOutput) propsIn.size = Math.max(1, size || 1);
            else propsIn.size = Math.max(2, ~~size || 2);
        } else if ("floatOutput" in propsIn) {
            const { floatOutput } = propsIn;
            const sizeIn = this.getProp("size");
            const size = floatOutput ? Math.max(1, sizeIn || 1) : Math.max(2, ~~sizeIn || 2);
            if (size !== sizeIn) this.setProps({ size });
        }
        return super.updateProps(propsIn, options);
    }
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 1;
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    const value = +data;
                    this.validateValue(value);
                    this.updateUI({ value: this.state.value });
                }
                this.outputValue();
            }
        });
        this.on("propsUpdated", () => {
            this.validateValue(this.state.value);
            this.updateUI({ value: this.state.value });
        });
    }
}
