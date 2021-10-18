import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang, isBang } from "../sdk";
import NumberBoxUI, { NumberBoxUIState } from "../ui/number";
import UIObject from "./base";

export interface NumberBoxState {
    value: number;
}
export interface NumberBoxProps {
    format: "Decimal (Integer)" | "Decimal (Floating-Point)" | "MIDI" | "MIDI (C4)" | "Binary" | "Hex" | "Roland Octal";
    triangle: boolean;
    numDecimalPlaces: number;
    triScale: number;
    bgColor: string;
    hTriColor: string;
    textColor: string;
    triColor: string;
    fontFamily: string;
    fontSize: number;
    fontFace: "regular" | "bold" | "italic" | "bold italic";
    cantChange: boolean;
    outputOnClick: boolean;
    mouseFilter: boolean;
    minimum: number;
    maximum: number;
}

export default class NumberBox extends UIObject<{}, NumberBoxState, [number | Bang], [number], [], NumberBoxProps, NumberBoxUIState, {}> {
    static description = "Display and output a number";
    static inlets: IInletsMeta = [{
        type: "anything",
        isHot: true,
        description: "Set Displayed Number and Repeat to Output"
    }];
    static outlets: IOutletsMeta = [{
        type: "number",
        description: "Output Incoming or Entered Number"
    }];
    static props: IPropsMeta<NumberBoxProps> = {
        format: {
            type: "enum",
            enums: ["Decimal (Integer)", "Hex", "Roland Octal", "Binary", "MIDI", "MIDI (C4)", "Decimal (Floating-Point)"],
            default: "Decimal (Integer)",
            description: "Sets characteristics of the appearance and behavior of the number box.",
            isUIState: true
        },
        triangle: {
            type: "boolean",
            default: true,
            description: "Toggles the drawing of a triangular arrow pointing to the number in the number box.",
            isUIState: true
        },
        numDecimalPlaces: {
            type: "number",
            default: 0,
            description: "Number of Decimal Places",
            isUIState: true
        },
        triScale: {
            type: "number",
            default: 1,
            description: "Scales the size of the triangle drawn in the number box.",
            isUIState: true
        },
        bgColor: {
            type: "color",
            default: "rgb(51, 51, 51)",
            description: "Sets the color for the number box object's displayed/unclicked background.",
            isUIState: true
        },
        hTriColor: {
            type: "color",
            default: "rgb(237, 237, 90)",
            description: "Sets the highlight color for the triangle inside the number box object that indicates that the contents are editable.",
            isUIState: true
        },
        textColor: {
            type: "color",
            default: "rgb(247, 247, 247)",
            description: "Sets the color for the number box object's displayed/unclicked number values.",
            isUIState: true
        },
        triColor: {
            type: "color",
            default: "rgb(125, 127, 132)",
            description: "Sets the color for the triangle inside the number box object that indicates that the contents are editable.",
            isUIState: true
        },
        fontFamily: {
            type: "enum",
            enums: ["Lato", "Georgia", "Times New Roman", "Arial", "Tahoma", "Verdana", "Courier New"],
            default: "Lato",
            description: "Font family",
            isUIState: true
        },
        fontSize: {
            type: "number",
            default: 11,
            description: "Text font size",
            isUIState: true
        },
        fontFace: {
            type: "enum",
            enums: ["regular", "bold", "italic", "bold italic"],
            default: "regular",
            description: "Text style",
            isUIState: true
        },
        cantChange: {
            type: "boolean",
            default: false,
            description: "Toggles the ability to disallow changes with the mouse or the computer keyboard.",
            isUIState: true
        },
        outputOnClick: {
            type: "boolean",
            default: false,
            description: "Toggles sending the current value when you click on the number box.",
            isUIState: true
        },
        mouseFilter: {
            type: "boolean",
            default: false,
            description: "Send Value on Mouse Up",
            isUIState: true
        },
        minimum: {
            type: "number",
            default: undefined,
            description: "Sets the minimum value that can be displayed or sent out by the number box.",
            isUIState: true
        },
        maximum: {
            type: "number",
            default: undefined,
            description: "Sets the maximum value that can be displayed or sent out by the number box.",
            isUIState: true
        }
    };
    static UI = NumberBoxUI;
    state: NumberBoxState = { value: 0 };
    toValidValue(valueIn: number): number {
        const min = this.getProp("minimum");
        const max = this.getProp("maximum");
        const format = this.getProp("format");
        let value = valueIn || 0;
        if (format !== "Decimal (Floating-Point)") value = Math.round(value);
		if (!isNaN(min)) value = Math.max(min, value);
		if (!isNaN(max)) value = Math.min(max, value);
        return value;
    }
    validateValue(valueIn: number) {
        const value = this.toValidValue(valueIn);
        if (value === this.state.value) return;
        this.setState({ value });
    }
    onChangeFromUI({ value }: { value: number }) {
        this.setState({ value });
        this.outlet(0, value);
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
                this.outlet(0, this.state.value);
            }
        });
        this.on("propsUpdated", () => {
            this.validateValue(this.state.value);
            this.updateUI({ value: this.state.value });
        });
    }
}