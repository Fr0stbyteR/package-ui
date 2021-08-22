import * as Util from "util";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang } from "../sdk";
import UIObject from "./base";
import MessageUI from "../ui/message";

export interface IS {
    buffer: any;
    editing: boolean;
}

export default class message extends UIObject<{ text: string }, {}, [any, any], [any], [any], {}, { text: string }> {
    static description = "Message";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "Trigger output the message"
    }, {
        isHot: false,
        type: "anything",
        description: "Set the message"
    }];
    static outlets: IOutletsMeta = [{
        type: "anything",
        description: "Message to send"
    }];
    static UI = MessageUI;
    _: IS = { buffer: new Bang(), editing: false };
    handleUpdateArgs = (args: any[]) => {
        if (typeof args[0] !== "undefined") {
            this.setData({ text: this.stringify(args[0]) });
            this._.buffer = this.parse(args[0]);
        } else {
            this._.buffer = new Bang();
        }
        this.updateUI({ text: this.data.text });
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 1;
        });
        this.on("postInit", () => {
            const args = this.box.args;
            if (typeof this.data.text === "string") this._.buffer = this.parse(this.data.text);
            else if (typeof args[0] !== "undefined") {
                if (typeof this.data.text !== "string") {
                    this.setData({ text: this.stringify(args[0]) });
                    this._.buffer = args[0];
                }
            } else {
                this.setData({ text: "" });
                this._.buffer = new Bang();
            }
        });
        this.on("updateArgs", this.handleUpdateArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) this.outlet(0, this._.buffer);
            else if (inlet === 1) this.handleUpdateArgs([data]);
        });
    }
    parse(o: any) {
        if (typeof o === "string") {
            if (o.length > 0) {
                try {
                    return JSON.parse(o);
                } catch (e) {
                    return o;
                }
            }
            return new Bang();
        }
        return o;
    }
    stringify(o: any) {
        if (typeof o === "string") return o;
        try {
            return JSON.stringify(o);
        } catch (e) {
            return Util.inspect(o);
        }
    }
}
