import { React, BaseUI } from "../sdk";
import type panel from "../objects/panel";
import type { PanelProps } from "../objects/panel";

export default class PanelUI extends BaseUI<panel, {}, PanelProps> {
    static sizing: "horizontal" | "vertical" | "both" | "ratio" = "both";
    static defaultSize: [number, number] = [210, 210];
    render() {
        const { backgroundColor, borderColor, borderRadius, borderStyle, borderWidth, opacity } = this.state;
        return (
            <BaseUI {...this.props}>
                <div style={{ position: "absolute", width: "100%", height: "100%", display: "block", overflow: "auto", backgroundColor, borderColor, borderRadius, borderStyle, borderWidth, opacity }} />
            </BaseUI>
        );
    }
}
