import type { IArgsMeta, IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import UIObject from "./base";
import { Bang, BaseUI, CodeUI, isBang } from "../sdk";

export default class code extends UIObject<{ value: string }, {}, [Bang, string], [string, Bang], [string], {}, { language: string; value: string }, { editorBlur: string; editorLoaded: never; change: string }> {
    static description = "Code Editor";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "bang",
        description: "Trigger output the code"
    }, {
        isHot: false,
        type: "string",
        description: "Set the code"
    }];
    static outlets: IOutletsMeta = [{
        type: "string",
        description: "Code"
    }, {
        type: "bang",
        description: "Bang when the code is changed"
    }];
    static args: IArgsMeta = [{
        type: "string",
        optional: true,
        default: "javascript",
        description: "language"
    }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 2;
            if (typeof this.data.value === "undefined") this.setData({ value: "" });
        });
        this.on("editorLoaded", () => this.updateUI({ language: this.box.args[0] || "javascript" }));
        this.on("change", () => this.outlet(1, new Bang()));
        this.on("updateArgs", (args) => {
            if (args[0]) this.updateUI({ language: args[0] });
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(0, this.data.value);
            } else if (inlet === 1) {
                const value = typeof data === "string" ? data : `${data}`;
                this.updateUI({ value });
                this.setData({ value });
            }
        });
    }
    static UI: typeof BaseUI = CodeUI;
}
