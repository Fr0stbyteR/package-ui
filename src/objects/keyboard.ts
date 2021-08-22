import type { TMIDIEvent } from "@jspatcher/jspatcher/src/core/types";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import UIObject from "./base";
import { Utils } from "../sdk";
import KeyboardUI, { KeyboardUIProps } from "../ui/keyboard";

type KeyMap = number[];
export interface KeyboardInternalState {
    keys: KeyMap;
    selected: number;
}
export default class keyboard extends UIObject<{}, {}, [TMIDIEvent | "flush", TMIDIEvent], [Uint8Array & { length: 3 }], [], KeyboardUIProps, KeyboardUIProps & KeyboardInternalState> {
    static description = "Keyboard";
    static inlets: IInletsMeta = [{
        type: "anything",
        isHot: true,
        description: 'Display & output same MIDI event, "flush" to flush active notes'
    }, {
        type: "object",
        isHot: true,
        description: "Display without output"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "MIDI event triggered"
    }];
    static props: IPropsMeta<KeyboardUIProps> = {
        from: {
            type: "number",
            default: 24,
            description: "Lowest MIDI key to display",
            isUIState: true
        },
        to: {
            type: "number",
            default: 96,
            description: "Highest MIDI key to display",
            isUIState: true
        },
        blackKeyColor: {
            type: "color",
            default: "black",
            description: "Display color of black key",
            isUIState: true
        },
        whiteKeyColor: {
            type: "color",
            default: "white",
            description: "Display color of white key",
            isUIState: true
        },
        keyOnColor: {
            type: "color",
            default: "grey",
            description: "Display color of pressed key",
            isUIState: true
        },
        selectedColor: {
            type: "color",
            default: "yellow",
            description: "Display color of selected key",
            isUIState: true
        },
        mode: {
            type: "enum",
            enums: ["mono", "poly", "touch"],
            default: "poly",
            description: "Triggering mode",
            isUIState: true
        }
    };
    static UI = KeyboardUI;
    _: KeyboardInternalState = { keys: this.flushed, selected: undefined };
    get flushed() {
        const keys: KeyMap = [];
        for (let i = 0; i < 128; i++) {
            keys[i] = 0;
        }
        return keys;
    }
    flush() {
        const { keys } = this._;
        for (let $key = 0; $key < 128; $key++) {
            if (keys[$key]) {
                this.outlet(0, new Uint8Array([9 << 4, $key, 0]) as Uint8Array & { length: 3 });
                this._.keys[$key] = 0;
            }
        }
        this._.selected = undefined;
    }
    keyTrigger(keyIn: number, velocityIn: number, noOutput?: boolean) {
        const key = Math.max(0, Math.min(127, ~~+keyIn));
        const velocity = Math.max(0, Math.min(127, ~~+velocityIn));
        const mode = this.getProp("mode");
        if (mode === "mono") {
            const keys = this.flushed;
            keys[key] = velocity;
            if (!noOutput) this.outlet(0, new Uint8Array([9 << 4, key, velocity]) as Uint8Array & { length: 3 });
            this._.keys = keys;
            this._.selected = key;
        } else if (mode === "poly") {
            const { keys } = this._;
            const v = +!keys[key] * (velocity || 1);
            keys[key] = v;
            if (!noOutput) this.outlet(0, new Uint8Array([9 << 4, key, v]) as Uint8Array & { length: 3 });
            this._.keys = { ...keys };
            this._.selected = v ? key : undefined;
        } else {
            const { keys } = this._;
            keys[key] = velocity;
            if (!noOutput) this.outlet(0, new Uint8Array([9 << 4, key, velocity]) as Uint8Array & { length: 3 });
            this._.keys = { ...keys };
            this._.selected = velocity ? key : undefined;
        }
        this.updateUI(this._);
    }
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 1;
        });
        let prevMode: KeyboardUIProps["mode"];
        this.on("postInit", () => prevMode = this.getProp("mode"));
        this.on("updateProps", () => {
            if (prevMode && prevMode !== this.getProp("mode")) {
                this.flush();
                this._.keys = { ...this._.keys };
                this._.selected = undefined;
                this.updateUI(this._);
            }
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0 && data === "flush") {
                this.flush();
                this._.keys = { ...this._.keys };
                this._.selected = undefined;
                this.updateUI(this._);
            } else if (Utils.isMIDIEvent(data)) {
                const cmd = data[0] >> 4;
                const channel = data[0] & 0xf;
                const data1 = data[1];
                const data2 = data[2];
                if (channel === 9) return;
                if (cmd === 8 || (cmd === 9 && data2 === 0)) this.keyTrigger(data1, 0, inlet === 1);
                else if (cmd === 9) this.keyTrigger(data1, data2, inlet === 1);
            }
        });
    }
}
