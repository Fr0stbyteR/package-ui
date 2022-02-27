import { React, BaseUI } from "../sdk";
import type preset from "../objects/preset";
import type { PresetData, PresetInternalState, PresetProps } from "../objects/preset";
import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";

export interface PresetUIState extends PresetProps, PresetInternalState {
    data: PresetData;
    currentPreset: number;
    hover: number;
}

export default class PresetUI extends BaseUI<preset, {}, PresetUIState> {
    static sizing: "horizontal" | "vertical" | "both" | "ratio" = "both";
    static defaultSize: [number, number] = [100, 40];
    state: PresetUIState & BaseUIState = { ...this.state, data: this.object.data, currentPreset: -1, hover: -1 };
    refContainer = React.createRef<HTMLDivElement>();
    handleClick = ($: number, e: React.MouseEvent<HTMLDivElement>) => {
        if (e.shiftKey) this.object.store($);
        else this.object.recall($);
    };
    handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target && e.target instanceof HTMLDivElement && e.target.className === "preset-bubble") {
            const $ = [...e.currentTarget.children].indexOf(e.target)
            this.setState({ hover: $ });
        } else {
            this.setState({ hover: -1 });
        }
    };
    render() {
        const { width, height, data, currentPreset, bgColor, bubbleSize, fontFace, fontFamily, fontSize, textColor, storedColor, activeColor, emptyColor, hover } = this.state;
        const rect = this.refContainer.current?.getBoundingClientRect();
        const columns = ~~(((typeof width === "number" ? width : rect?.width) || 100 - 4) / (bubbleSize + 4));
        const rows = ~~(((typeof height === "number" ? height : rect?.height) || 40 - 4) / (bubbleSize + 4));
        const bubbles: JSX.Element[] = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                const $ = i * columns + j;
                const bubbleStyle: React.CSSProperties = {
                    position: "absolute",
                    display: "flex",
                    left: `${4 + j * (bubbleSize + 4)}px`,
                    top: `${4 + i * (bubbleSize + 4)}px`,
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                    backgroundColor: data[$] ? (currentPreset === $ ? activeColor : storedColor) : emptyColor,
                    overflow: "hidden"
                };
                bubbles.push(<div key={`bubble${$}`} className="preset-bubble" style={bubbleStyle} onClick={(e) => this.handleClick($, e)} />);
            }
            
        }
        return (
            <BaseUI {...this.props}>
                <div ref={this.refContainer} style={{ position: "absolute", width: "100%", height: "100%", display: "block", overflow: "hidden", backgroundColor: bgColor }} onMouseMove={this.handleMouseMove}>
                    {...bubbles}
                    {hover >= 0 ? <div className="preset-hovered" style={{
                        height: `${fontSize + 4}px`,
                        font: `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`,
                        color: textColor,
                        ...((hover % columns) > columns / 2 ? { left: 0 } : { right: 0 })
                    }}><span>{hover}</span></div> : undefined}
                </div>
            </BaseUI>
        );
    }
}
