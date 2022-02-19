import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import type { AbstractUIState } from "@jspatcher/jspatcher/src/core/objects/base/AbstracttUI";
import { React, BaseUI } from "../sdk";
import type video from "../objects/video";
import type { VideoProps } from "../objects/video";

export interface VideoUIState extends VideoProps {
    url: string;
    currentTime: number;
    timestamp: number;
    playing: boolean;
}
export default class VideoUI extends BaseUI<video, VideoProps, VideoUIState> {
    static sizing: "horizontal" | "vertical" | "both" | "ratio" = "both";
    static defaultSize: [number, number] = [210, 90];
    state: VideoUIState & BaseUIState = {
        ...this.state,
        url: this.object._.url,
        currentTime: 0,
        timestamp: performance.now()
    };
    lastTimeUpdate = this.state.timestamp;
    videoRef = React.createRef<HTMLVideoElement>();
    handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        this.object.outlet(1, e.currentTarget.currentTime);
    }
    componentDidMount() {
        super.componentDidMount();
        const video = this.videoRef.current;
        if (video) {
            const { playbackRate, volume, currentTime, playing } = this.state;
            video.playbackRate = playbackRate;
            video.volume = volume;
            video.currentTime = currentTime;
            if (playing) video.play();
        }
    }
    componentDidUpdate(prevProps: any, prevState: Readonly<VideoUIState & BaseUIState & AbstractUIState>) {
        const video = this.videoRef.current;
        if (video) {
            const { playbackRate, volume, playing, currentTime, timestamp } = this.state;
            if (prevState.playbackRate !== playbackRate) {
                video.playbackRate = playbackRate;
            } else if (prevState.volume !== volume) {
                video.volume = volume;
            }
            if (prevState.playing !== playing) {
                if (playing) video.play();
                else video.pause();
            } else if (this.lastTimeUpdate !== timestamp) {
                video.currentTime = currentTime;
                this.lastTimeUpdate = timestamp;
            }
        }
    }
    render() {
        const { autoPlay, controls, muted, loop, opacity } = this.state;
        return (
            <BaseUI {...this.props}>
                <div style={{ position: "absolute", width: "100%", height: "100%", display: "block", overflow: "auto" }}>
                    <video src={this.state.url} style={{ position: "absolute", width: "100%", height: "100%", opacity }} {...{ autoPlay, controls, muted, loop }} ref={this.videoRef} onTimeUpdate={this.handleTimeUpdate} />
                </div>
            </BaseUI>
        );
    }
}
