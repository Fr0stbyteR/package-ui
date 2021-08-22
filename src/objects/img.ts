import type PersistentProjectFile from "@jspatcher/jspatcher/src/core/file/PersistentProjectFile";
import type PatcherImage from "@jspatcher/jspatcher/src/core/image/PatcherImage";
import type { IArgsMeta, IInletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import UIObject from "./base";
import { isBang } from "../sdk";
import ImgUI, { ImgUIState } from "../ui/img";

interface IS {
    key: string;
    image: PatcherImage;
    file: PersistentProjectFile;
    url: string;
}
export interface ImgProps {
    scroll: boolean;
    objectFit: "fill" | "cover" | "contain" | "none" | "scale-down";
    objectPosition: string;
}
export default class img extends UIObject<{}, {}, [string | HTMLImageElement], [HTMLImageElement], [string], ImgProps, ImgUIState> {
    static description = "Display an image";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "Image file name or url"
    }];
    static args: IArgsMeta = [{
        type: "string",
        optional: true,
        description: "Image file name or url"
    }];
    static props: IPropsMeta<ImgProps> = {
        scroll: {
            type: "boolean",
            default: false,
            description: "Allow overflow-scroll",
            isUIState: true
        },
        objectFit: {
            type: "enum",
            enums: ["fill", "cover", "contain", "none", "scale-down"],
            default: "contain",
            description: "CSS object-fit property",
            isUIState: true
        },
        objectPosition: {
            type: "string",
            default: "50% 50%",
            description: 'CSS object-position property, for example "50% 50%" or "left top"',
            isUIState: true
        }
    };
    static UI = ImgUI;
    _: IS = { key: this.box.args[0]?.toString(), image: undefined, file: undefined, url: "" };
    subscribe() {
        super.subscribe();
        const handleFilePathChanged = () => {
            this._.key = this._.file?.projectPath;
        };
        const subsribeItem = async () => {
            const { image, file } = this._;
            if (image) await image.addObserver(this);
            if (file) {
                file.on("destroyed", reload);
                file.on("nameChanged", handleFilePathChanged);
                file.on("pathChanged", handleFilePathChanged);
            }
        };
        const unsubscribeItem = async () => {
            const { image, file } = this._;
            if (file) {
                file.off("destroyed", reload);
                file.off("nameChanged", handleFilePathChanged);
                file.off("pathChanged", handleFilePathChanged);
            }
            if (image) await image.removeObserver(this);
        };
        const reload = async () => {
            await unsubscribeItem();
            const { key } = this._;
            let image: PatcherImage;
            let url: string;
            try {
                const { item } = await this.getSharedItem(key, "image");
                image = await item.instantiate({ env: this.patcher.env, project: this.patcher.project }) as PatcherImage;
                this._.image = image;
                this._.file = item;
                url = image.objectURL;
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
            this.outlets = 0;
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
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    if (typeof data === "string") {
                        this._.key = data;
                        reload();
                    }
                }
            }
        });
        this.on("destroy", unsubscribeItem);
    }
}
