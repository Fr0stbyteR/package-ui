import type { IInletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { CSSProperties } from "react";
import PanelUI from "../ui/panel";
import UIObject from "./base";

export interface PanelProps extends Required<Pick<CSSProperties, "backgroundColor" | "borderRadius" | "borderWidth" | "borderColor" | "borderStyle" | "opacity">> {
}
export default class panel extends UIObject<{}, {}, [any], [], [], PanelProps, PanelProps> {
    static description = "Panel UI";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "Can be used to change properties"
    }];
    static props: IPropsMeta<PanelProps> = {
        backgroundColor: {
            type: "color",
            description: "Background color",
            default: "gray",
            isUIState: true
        },
        borderRadius: {
            type: "string",
            description: 'Border radius in CSS expression, "4px" or "50%"',
            default: "0",
            isUIState: true
        },
        borderWidth: {
            type: "string",
            description: 'Border width in CSS expression, "4px" or "1vw"',
            default: "0px",
            isUIState: true
        },
        borderColor: {
            type: "color",
            description: "Border color",
            default: "lightslategray",
            isUIState: true
        },
        borderStyle: {
            type: "enum",
            enums: ["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"],
            description: 'Border style in CSS expression',
            default: "solid",
            isUIState: true
        },
        opacity: {
            type: "number",
            description: "CSS opacity (0-1)",
            default: 1,
            isUIState: true
        },
    };
    static UI = PanelUI;
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 0;
        });
    }
}
