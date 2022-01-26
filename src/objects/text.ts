import type PersistentProjectFile from "@jspatcher/jspatcher/src/core/file/PersistentProjectFile";
import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { ProjectFileEventMap } from "@jspatcher/jspatcher/src/core/file/AbstractProjectFile";
import DefaultObject from "./base-default";
import { Bang, isBang, PatcherText, TempTextFile } from "../sdk";
import TextUI, { TextUIState } from "../ui/text";

interface IS {
    key: string;
    text: PatcherText;
    file: PersistentProjectFile | TempTextFile;
}
export interface TextProps {
}
export default class text extends DefaultObject<{}, {}, [Bang | string, string, string], [string, PatcherText, Bang], [string], TextProps, TextUIState> {
    static description = "Read a text";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "Bang to output stored buffer, string to store"
    }, {
        isHot: false,
        type: "anything",
        description: "String to store"
    }, {
        isHot: false,
        type: "anything",
        description: "Set variable name."
    }];
    static outlets: IOutletsMeta = [{
        type: "string",
        description: "Text file content"
    }, {
        type: "anything",
        description: "PatcherText"
    }, {
        type: "bang",
        description: "Output a bang while the PatcherText buffer object is loaded/changed."
    }];
    static args: IArgsMeta = [{
        type: "string",
        optional: true,
        description: "Text file name or url"
    }];
    static props: IPropsMeta<TextProps> = {};
    static UI = TextUI;
    _: IS = { key: this.box.args[0]?.toString(), text: undefined, file: undefined };
    subscribe() {
        super.subscribe();
        const handleSaved = async (e: ProjectFileEventMap["saved"]) => {
            if (e.instance === this._.text) return;
            await reload();
        };
        const handleFilePathChanged = () => {
            this._.key = this._.file?.projectPath;
        };
        const subsribeItem = async () => {
            const { text, file } = this._;
            if (text) await text.addObserver(this);
            if (file) {
                file.on("destroyed", reload);
                file.on("nameChanged", handleFilePathChanged);
                file.on("pathChanged", handleFilePathChanged);
                file.on("saved", handleSaved);
            }
        };
        const unsubscribeItem = async () => {
            const { text, file } = this._;
            if (file) {
                file.off("destroyed", reload);
                file.off("nameChanged", handleFilePathChanged);
                file.off("pathChanged", handleFilePathChanged);
                file.off("saved", handleSaved);
            }
            if (text) await text.removeObserver(this);
        };
        const reload = async () => {
            await unsubscribeItem();
            const { key } = this._;
            let text: PatcherText;
            try {
                const { item, newItem } = await this.getSharedItem(key, "text", async () => {
                    const resp = await fetch(key);
                    const content = await resp.arrayBuffer();
                    text = new PatcherText({ env: this.env, project: this.patcher.project });
                    await text.init(content);
                    this._.text = text;
                    return text;
                });
                if (newItem) {
                    text.file = item;
                } else {
                    text = await item.instantiate({ env: this.patcher.env, project: this.patcher.project }) as PatcherText;
                }
                this._.text = text;
                this._.file = item;
                this.updateUI({ patcherText: text });
            } catch (error) {
                this.error(error);
            } finally {
                await subsribeItem();
                this.outlet(2, new Bang());
            }
        };
        this.on("preInit", () => {
            this.inlets = 3;
            this.outlets = 3;
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
                    if (typeof data === "string") {
                        this._.text.text = data;
                        if (this._.file instanceof TempTextFile) this._.file.save(this._.text, this);
                        else this._.file.save(await this._.text.serialize(), this);
                    }
                }
                this.outletAll([this._.text.text, this._.text]);
            } else if (inlet === 1) {
                if (typeof data === "string") {
                    this._.text.text = data;
                    if (this._.file instanceof TempTextFile) this._.file.save(this._.text, this);
                    else this._.file.save(await this._.text.serialize(), this);
                }
            }
        });
        this.on("destroy", unsubscribeItem);
    }
}
