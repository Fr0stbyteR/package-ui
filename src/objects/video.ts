import type PersistentProjectFile from "@jspatcher/jspatcher/src/core/file/PersistentProjectFile";
import type PatcherVideo from "@jspatcher/jspatcher/src/core/video/PatcherVideo";
import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import UIObject from "./base";
import { isBang } from "../sdk";
import VideoUI, { VideoUIState } from "../ui/video";

interface IS {
    key: string;
    video: PatcherVideo;
    file: PersistentProjectFile;
    url: string;
}
export interface VideoProps {
    autoPlay: boolean;
    controls: boolean;
    muted: boolean;
    playbackRate: number;
    volume: number;
    loop: boolean;
    opacity: number;
}
export default class video extends UIObject<{}, {}, [string | HTMLVideoElement | boolean | number | { goto: number }], [HTMLVideoElement, number], [string], VideoProps, VideoUIState> {
    static description = "Display a video";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "Image file name or url, { goto: number } to jump, boolean/number to switch play/stop"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "HTMLVideoElement"
    }, {
        type: "number",
        description: "currentTime"
    }];
    static args: IArgsMeta = [{
        type: "string",
        optional: true,
        description: "Image file name or url"
    }];
    static props: IPropsMeta<VideoProps> = {
        autoPlay: {
            type: "boolean",
            default: false,
            description: "Indicates whether playback should automatically begin as soon as enough media is available to do so without interruption.",
            isUIState: true
        },
        controls: {
            type: "boolean",
            default: true,
            description: "Indicates whether user interface items for controlling the resource should be displayed.",
            isUIState: true
        },
        muted: {
            type: "boolean",
            default: false,
            description: "Determines whether audio is muted.",
            isUIState: true
        },
        playbackRate: {
            type: "number",
            default: 1,
            description: "Sets the rate at which the media is being played back.",
            isUIState: true
        },
        volume: {
            type: "number",
            default: 1,
            description: "Indicates the audio volume, from 0.0 (silent) to 1.0 (loudest).",
            isUIState: true
        },
        loop: {
            type: "boolean",
            default: true,
            description: "Indicates whether the media element should start over when it reaches the end.",
            isUIState: true
        },
        opacity: {
            type: "number",
            default: 1,
            description: "Opacity of the video (0-1)",
            isUIState: true
        }
    };
    static UI = VideoUI;
    _: IS = { key: this.box.args[0]?.toString(), video: undefined, file: undefined, url: "" };
    subscribe() {
        super.subscribe();
        const handleFilePathChanged = () => {
            this._.key = this._.file?.projectPath;
        };
        const subsribeItem = async () => {
            const { video, file } = this._;
            if (video) await video.addObserver(this);
            if (file) {
                file.on("destroyed", reload);
                file.on("nameChanged", handleFilePathChanged);
                file.on("pathChanged", handleFilePathChanged);
            }
        };
        const unsubscribeItem = async () => {
            const { video, file } = this._;
            if (file) {
                file.off("destroyed", reload);
                file.off("nameChanged", handleFilePathChanged);
                file.off("pathChanged", handleFilePathChanged);
            }
            if (video) await video.removeObserver(this);
        };
        const reload = async () => {
            await unsubscribeItem();
            const { key } = this._;
            let video: PatcherVideo;
            let url: string;
            try {
                const { item } = await this.getSharedItem(key, "video");
                video = await item.instantiate({ env: this.patcher.env, project: this.patcher.project }) as PatcherVideo;
                this._.video = video;
                this._.file = item;
                url = video.objectURL;
            } catch {
                url = key;
            } finally {
                this._.url = url;
                this.updateUI({ url });
                await subsribeItem();
            }
        };
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
        });
        this.on("postInit", reload);
        this.on("updateArgs", (args) => {
            if (typeof args[0] === "string") {
                const oldKey = this._.key;
                const key = args[0]?.toString();
                this._.key = key;
                if (key !== oldKey) reload();
            }
        });
        this.on("inlet", async ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    if (typeof data === "number" || typeof data === "boolean") {
                        this.updateUI({ playing: !!data });
                    } else if (typeof data === "string") {
                        this._.key = data;
                        reload();
                    } else if (typeof data === "object") {
                        if (data instanceof HTMLVideoElement) {
                            this._.key = data.src;
                            reload();
                        } else if (typeof data.goto === "number") {
                            this.updateUI({ currentTime: data.goto, timestamp: performance.now() });
                        }
                    }
                }
            }
        });
        this.on("destroy", unsubscribeItem);
    }
}
