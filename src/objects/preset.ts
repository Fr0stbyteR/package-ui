import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Box, isBang } from "../sdk";
import PresetUI, { PresetUIState } from "../ui/preset";
import UIObject from "./base";

export type PresetData = Record<string, any>[];
export interface PresetProps {
    bubbleSize: number;
    activeColor: string;
    storedColor: string;
    emptyColor: string;
    bgColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    fontFace: "regular" | "bold" | "italic" | "bold italic";
}

export interface PresetInternalState {
    boxInspected: Set<string>;
}

export default class preset extends UIObject<PresetData, {}, [number | { store: number } | "clearall" | { clear: number }, Record<string, any>], [never, number, never, number, Record<string, any>], [], PresetProps, PresetUIState, {}> {
    static description = "Store and recall settings";
    static inlets: IInletsMeta = [{
        type: "anything",
        isHot: true,
        description: `Store or Recall Presets: number | { store: number } | "clearall" | { clear: number }`
    }, {
        type: "anything",
        isHot: true,
        description: "Preset data"
    }];
    static outlets: IOutletsMeta = [{
        type: "anything",
        description: "Connect to Objects to Include in a Preset"
    }, {
        type: "number",
        description: "Preset number when called"
    }, {
        type: "anything",
        description: "Connect to Objects to Exclude in a Preset"
    }, {
        type: "anything",
        description: "Preset number when stored"
    }, {
        type: "anything",
        description: "Preset data"
    }];
    static props: IPropsMeta<PresetProps> = {
        bubbleSize: {
            type: "number",
            default: 8,
            description: "Size in pixel of each preset slot",
            isUIState: true
        },
        activeColor: {
            type: "color",
            default: "#CEE5E8",
            description: "Active preset slot color.",
            isUIState: true
        },
        storedColor: {
            type: "color",
            default: "#7D7F84",
            description: "Stored preset slot color.",
            isUIState: true
        },
        emptyColor: {
            type: "color",
            default: "#595959",
            description: "Empty preset slot color.",
            isUIState: true
        },
        bgColor: {
            type: "color",
            default: "rgb(51, 51, 51)",
            description: "Background color.",
            isUIState: true
        },
        textColor: {
            type: "color",
            default: "rgb(33, 33, 33)",
            description: "Text color.",
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
        }
    };
    static UI = PresetUI;
    _: PresetInternalState = { boxInspected: new Set() };
    get included() {
        const included = new Set<Box>();
        this.outletLines[0]?.forEach(l => included.add(l.destBox));
        return included;
    }
    get excluded() {
        const excluded = new Set<Box>();
        this.outletLines[2]?.forEach(l => excluded.add(l.destBox));
        return excluded;
    }
    get boxesInspected() {
        const { included, excluded } = this;
        const boxes = included.size ? included : new Set(Object.values(this.patcher.boxes));
        for (const b of excluded) {
            boxes.delete(b);
        }
        return boxes;
    }
    handleStateUpdated = () => {
        const { boxesInspected } = this;
        const data: Record<string, any> = {};
        for (const b of boxesInspected) {
            data[b.id] = b.object.state;
        }
        this.outlet(4, data);
    };
    updateBoxInspected() {
        const oldBoxes = this._.boxInspected;
        const newBoxes = [...this.boxesInspected];
        for (const boxId of [...oldBoxes]) {
            const found = newBoxes.find(b => b.id === boxId);
            if (!found) {
                oldBoxes.delete(boxId);
                this.patcher.boxes[boxId]?.object.off("stateUpdated", this.handleStateUpdated);
            }
        }
        for (const box of newBoxes) {
            if (!oldBoxes.has(box.id)) {
                oldBoxes.add(box.id);
                box.object.on("stateUpdated", this.handleStateUpdated);
            }
        }
    }
    store(slot: number) {
        const { boxesInspected } = this;
        const data: Record<string, any> = {};
        for (const b of boxesInspected) {
            const { state } = b.object;
            if (state) data[b.id] = { ...state };
        }
        this.data[slot] = data;
        this.setData(this.data);
        this.updateUI({ data: { ...this.data } });
        return data;
    }
    recall(slot: number) {
        const data = this.data[slot];
        if (!data) return false;
        const { boxesInspected } = this;
        for (const b of boxesInspected) {
            if (b.id in data) b.object.updateState(data[b.id]);
        }
        this.updateUI({ currentPreset: slot });
        return true;
    }
    clear(slot: number) {
        delete this.data[slot];
        this.setData(this.data);
    }
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 5;
            if (!this.data) this.setData([]);
        });
        this.on("postInit", () => {
        });
        this.on("connectedOutlet", ({ outlet }) => {
            if (outlet === 0 || outlet === 2) this.updateBoxInspected();
        });
        this.on("disconnectedOutlet", ({ outlet }) => {
            if (outlet === 0 || outlet === 2) this.updateBoxInspected();
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    if (typeof data === "number") {
                        if (!this.recall(~~+data)) return;
                        this.outlet(1, ~~+data);
                    } else if (typeof data === "object") {
                        if ("store" in data) {
                            this.store(data.store);
                            this.outlet(3, ~~+data);
                        } else if ("clear" in data) {
                            this.clear(data.clear);
                            this.updateUI({ data: { ...this.data } });
                        }
                    } else if (data === "clearall") {
                        this.setData([]);
                        this.updateUI({ data: { ...this.data } });
                    }
                }
            } else if (inlet === 1) {
                if (typeof data === "object") {
                    const { boxesInspected } = this;
                    for (const b of boxesInspected) {
                        if (b.id in data) b.object.updateState((data as Record<string, any>)[b.id]);
                    }
                }
            }
        });
        this.on("destroy", () => {
            this._.boxInspected.forEach(boxId => this.patcher.boxes[boxId]?.object.off("stateUpdated", this.handleStateUpdated));
        });
    }
}
