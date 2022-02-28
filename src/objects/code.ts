import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { monaco } from "react-monaco-editor";
import UIObject from "./base";
import { Bang, BaseUI, isBang } from "../sdk";
import CodeUI, { CodeUIState } from "../ui/code";

export interface CodeProps {
    language: string;
    options: monaco.editor.IEditorOptions;
    theme: string;
    opacity: number;
}

export default class code extends UIObject<{ value: string }, {}, [Bang, string], [string, Bang], [], CodeProps, CodeUIState, { editorBlur: string; editorLoaded: monaco.editor.IStandaloneCodeEditor; change: string }> {
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
    static props: IPropsMeta<CodeProps> = {
        language: {
            type: "string",
            default: "javascript",
            description: "Code Language",
            isUIState: true
        },
        options: {
            type: "object",
            default: { fontSize: 12 },
            description: "Layout Options",
            isUIState: true
        },
        theme: {
            type: "string",
            default: "vs-dark",
            description: "Theme",
            isUIState: true
        },
        opacity: {
            type: "number",
            default: 1,
            description: "Display Opacity",
            isUIState: true
        }
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 2;
            if (typeof this.data.value === "undefined") this.setData({ value: "" });
        });
        this.on("change", () => this.outlet(1, new Bang()));
        this.on("updateProps", (props) => {
            if ("language" in props) this.updateUI({ language: props.language });
            if ("options" in props) this.updateUI({ options: props.options });
            if ("theme" in props) this.updateUI({ theme: props.theme });
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
