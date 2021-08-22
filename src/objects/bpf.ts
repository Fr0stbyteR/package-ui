import type { TBPF, TBPFPoint, TStrictBPF } from "@jspatcher/jspatcher/src/core/types";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import UIObject from "./base";
import { Bang, isBang, MathUtils, Utils } from "../sdk";
import BPFUI, { BPFUIProps } from "../ui/bpf";

export interface BPFData {
    points: TStrictBPF;
}
export default class bpf extends UIObject<BPFData, {}, [TBPF | Bang], [TStrictBPF], [], BPFUIProps, BPFUIProps & BPFData> {
    static description = "Break-point function editor";
    static inlets: IInletsMeta = [{
        type: "anything",
        isHot: true,
        description: "Display & output a bpf, bang to output"
    }, {
        type: "anything",
        isHot: true,
        description: "Display without output"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "BPF triggered"
    }];
    static props: IPropsMeta<BPFUIProps> = {
        domain: {
            type: "number",
            default: 1000,
            description: "X-axis range, starts from 0",
            isUIState: true
        },
        range: {
            type: "object",
            default: [0, 1],
            description: "Y-axis range, [low, high]",
            isUIState: true
        },
        textColor: {
            type: "color",
            default: "rgba(0, 255, 255, 1)",
            description: "Text color",
            isUIState: true
        },
        fontFamily: {
            type: "enum",
            enums: ["Lato", "Georgia", "Times New Roman", "Arial", "Tahoma", "Verdana", "Courier New"],
            default: "Arial",
            description: "Font family",
            isUIState: true
        },
        fontSize: {
            type: "number",
            default: 10,
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
        pointColor: {
            type: "color",
            default: "white",
            description: "Text color",
            isUIState: true
        },
        lineColor: {
            type: "color",
            default: "white",
            description: "Line color",
            isUIState: true
        },
        bgColor: {
            type: "color",
            default: "rgba(0, 0, 0, 0.5)",
            description: "Background color",
            isUIState: true
        }
    };
    static UI = BPFUI;
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 1;
            if (!this.data.points) this.data.points = [];
        });
        let prevRange: [number, number];
        let prevDomain: number;
        this.on("postInit", () => {
            prevRange = this.getProp("range");
            prevDomain = this.getProp("domain");
        });
        this.on("updateProps", () => {
            const range = this.getProp("range");
            if (prevRange && prevRange !== range) {
                const points = this.data.points.map(p => [p[0], MathUtils.scaleClip(p[1], prevRange[0], prevRange[1], range[0], range[1]), p[2]] as TBPFPoint);
                this.setData({ points });
                this.updateUI(this.data);
                prevRange = range;
            }
            const domain = this.getProp("domain");
            if (typeof prevDomain === "number" && prevDomain !== domain) {
                const points = this.data.points.map(p => [MathUtils.scaleClip(p[0], 0, prevDomain, 0, domain), p[1], p[2]] as TBPFPoint);
                this.setData({ points });
                this.updateUI(this.data);
                prevDomain = domain;
            }
        });
        this.on("inlet", ({ data, inlet }) => {
            if (isBang(data)) {
                if (inlet === 0) {
                    const { points } = this.data;
                    this.outlet(0, points.map((p, i) => [p[1], p[0] - (i > 0 ? points[i - 1][0] : 0), p[2]]));
                }
            } else {
                let points: TStrictBPF;
                try {
                    points = Utils.decodeBPF(data, 3) as TStrictBPF;
                } catch (e) {
                    this.error("Cannot decode inlet BPF");
                }
                this.setData({ points });
                this.updateUI(this.data);
            }
        });
    }
}
