import type { IArgsMeta, IInletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { DOMUIState } from "@jspatcher/jspatcher/src/core/objects/base/DOMUI";
import { isBang } from "../sdk";
import ViewUI from "../ui/view";
import UIObject from "./base";

export interface ViewProps {
    shadow: boolean;
    containerProps: JSX.IntrinsicAttributes & React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement>;
}
export default class view extends UIObject<{}, { children: ChildNode[] }, [string | Element], [], [string], ViewProps, DOMUIState> {
    static description = "View HTML Element";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "HTML string or HTMLElement object to view"
    }];
    static args: IArgsMeta = [{
        type: "string",
        optional: true,
        description: "initial innerHTML"
    }];
    static props: IPropsMeta<ViewProps> = {
        shadow: {
            type: "boolean",
            default: true,
            description: "Whether children should be attached to a Shadow DOM",
            isUIState: true
        },
        containerProps: {
            type: "object",
            default: {},
            description: "Available under non-shadow mode, the props for div container",
            isUIState: true
        }
    };
    static UI = ViewUI;
    _ = { children: [] as ChildNode[] };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 0;
        });
        const handleUpdateArgs = (args: [string?]) => {
            if (typeof args[0] === "string") {
                const template = document.createElement("template");
                template.innerHTML = args[0];
                this._.children = Array.from(template.content.children);
                this.updateUI({ children: this._.children });
            }
        };
        this.on("postInit", () => handleUpdateArgs(this.args));
        this.on("updateArgs", handleUpdateArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    if (typeof data === "string") {
                        const template = document.createElement("template");
                        template.innerHTML = data;
                        this._.children = Array.from(template.content.children);
                    } else if (data instanceof Element) {
                        this._.children = [data];
                    }
                    this.updateUI({ children: this._.children });
                }
            }
        });
    }
}
