import type { TAudioUnit } from "@jspatcher/jspatcher/src/core/types";
import type { IInletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import UIObject from "./base";
import WaveformUI from "../ui/waveform";
import { PatcherAudio } from "../sdk";
import type { WaveformUIState } from "../ui/waveform";

export interface WaveformInternalState {
    audio: PatcherAudio;
}
export interface WaveformUIProps {
    interleaved: boolean;
    cursor: number;
    viewRange: [number, number];
    selRange: [number, number];
    verticalRange: [number, number];
    autoVerticalRange: boolean;
    showStats: boolean;
    bgColor: string;
    cursorColor: string;
    phosphorColor: string;
    hueOffset: number;
    textColor: string;
    gridColor: string;
    seperatorColor: string;
    audioUnit: TAudioUnit;
    bpm: number;
}
export type WaveformProps = WaveformUIProps;

export default class waveform extends UIObject<{}, WaveformInternalState, [PatcherAudio], [], [], WaveformProps, WaveformUIState> {
    static description = "Buffer waveform view";
    static inlets: IInletsMeta = [{
        isHot: false,
        type: "object",
        description: "Patcher Audio object (from buffer~)"
    }];
    static props: IPropsMeta<WaveformProps> = {
        interleaved: {
            type: "boolean",
            default: false,
            description: "Draw channels seperately",
            isUIState: true
        },
        cursor: {
            type: "number",
            default: 0,
            description: "Display a cursor",
            isUIState: true
        },
        viewRange: {
            type: "object",
            default: [0, 1],
            description: "Display only a part of the buffer",
            isUIState: true
        },
        selRange: {
            type: "object",
            default: null,
            description: "Nullable, display selection of a part of the buffer",
            isUIState: true
        },
        verticalRange: {
            type: "object",
            default: [-1, 1],
            description: "Vertical range",
            isUIState: true
        },
        autoVerticalRange: {
            type: "boolean",
            default: true,
            description: "Auto adjust vertical range if > 1",
            isUIState: true
        },
        showStats: {
            type: "boolean",
            default: true,
            description: "Show stats texts",
            isUIState: true
        },
        bgColor: {
            type: "color",
            default: "rgb(40, 40, 40)",
            description: "Background color",
            isUIState: true
        },
        cursorColor: {
            type: "color",
            default: "white",
            description: "Cursor color",
            isUIState: true
        },
        phosphorColor: {
            type: "color",
            default: "hsl(0, 100%, 85%)",
            description: "Phosphor color",
            isUIState: true
        },
        hueOffset: {
            type: "number",
            default: 60,
            description: "Channel Color Hue offset",
            isUIState: true
        },
        textColor: {
            type: "color",
            default: "#DDDD99",
            description: "Info text color",
            isUIState: true
        },
        gridColor: {
            type: "color",
            default: "#404040",
            description: "Grid color",
            isUIState: true
        },
        seperatorColor: {
            type: "color",
            default: "white",
            description: "Channel seperator color",
            isUIState: true
        },
        audioUnit: {
            type: "enum",
            default: "time",
            enums: ["time", "sample", "measure"],
            description: "Vertical grid mode",
            isUIState: true
        },
        bpm: {
            type: "number",
            default: 60,
            description: "If audioUnit is measure, a BPM can be used",
            isUIState: true
        }
    };
    static UI = WaveformUI;
    _: WaveformInternalState = { audio: undefined };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 0;
        });
        this.on("inlet", async ({ data, inlet }) => {
            if (inlet === 0) {
                if (data instanceof PatcherAudio) {
                    this._.audio = data;
                    this.updateUI(this._);
                    this.updateProps({ selRange: null, viewRange: [0, data.length], cursor: 0 });
                } else {
                    this.error("Input data is not PatcherAudio instance");
                }
            }
        });
    }
}
