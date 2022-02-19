import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { React, BaseUI } from "../sdk";
import type img from "../objects/img";
import type { ImgProps } from "../objects/img";

export interface ImgUIState extends ImgProps {
    url: string;
}
export default class ImgUI extends BaseUI<img, ImgProps, ImgUIState> {
    static sizing: "horizontal" | "vertical" | "both" | "ratio" = "both";
    static defaultSize: [number, number] = [210, 90];
    state: ImgUIState & BaseUIState = { ...this.state, url: this.object._.url };
    imgRef = React.createRef<HTMLImageElement>();
    handleLoadedMetadata = () => this.object.outlet(0, this.imgRef.current);
    componentDidMount() {
        super.componentDidMount();
        const image = this.imgRef.current;
        if (image) {
            this.object._.element = image;
            this.object.outlet(0, image);
            image.addEventListener("loadedmetadata", this.handleLoadedMetadata);
        }
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.imgRef.current?.removeEventListener("loadedmetadata", this.handleLoadedMetadata);
    }
    render() {
        const { objectFit, objectPosition, scroll, opacity } = this.state;
        return (
            <BaseUI {...this.props}>
                <div style={{ position: "absolute", width: "100%", height: "100%", display: "block", overflow: "auto" }}>
                    <img ref={this.imgRef} src={this.state.url} style={{ position: "absolute", ...(scroll ? {} : { width: "100%", height: "100%" }), objectFit, objectPosition, opacity }} />
                </div>
            </BaseUI>
        );
    }
}
