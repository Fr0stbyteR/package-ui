import ButtonUI from "./button";
import type message from "../objects/message";

export default class MessageUI extends ButtonUI<message> {
    static editableOnUnlock = true;
    handleChanged = (text: string) => this.object.handleUpdateArgs([text]);
    handleClick = (e: React.MouseEvent) => {
        if (this.editor.state.locked) this.object.outlet(0, this.object._.buffer);
    };
}
