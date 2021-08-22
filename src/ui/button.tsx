import type BaseObject from "@jspatcher/jspatcher/src/core/objects/base/BaseObject";
import type { BaseUIProps, BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { React, BaseUI, Utils } from "../sdk";

export interface ButtonUIState extends BaseUIState {
    text: string;
    loading: boolean;
}
export default class ButtonUI<T extends BaseObject<{ text: string }, {}, any, any, any, any, { text: string }>> extends BaseUI<T, {}, ButtonUIState> {
    state: ButtonUIState = { ...this.state, loading: false, text: this.props.object.data.text };
    refSpan = React.createRef<HTMLSpanElement>();
    componentDidMount() {
        super.componentDidMount();
        if (this.props.editing) this.toggleEdit(this.props.editing);
    }
    componentDidUpdate(prevProps: Readonly<BaseUIProps>) {
        if (this.props.editing !== prevProps.editing) this.toggleEdit(this.props.editing);
    }
    handleChanged = (text: string) => {};
    toggleEdit(toggle: boolean) {
        const { editor, box } = this;
        if (editor.state.locked) return;
        if (!this.refSpan.current) return;
        const span = this.refSpan.current;
        if (toggle) {
            editor.selectOnly(box.id);
            this.setState({ text: span.textContent }, () => {
                span.focus();
                Utils.selectElementRange(span);
            });
        } else {
            window.getSelection().removeAllRanges();
            span.blur();
            this.setState({ text: span.textContent });
            this.handleChanged(span.textContent);
        }
    }
    handleMouseDown = (e: React.MouseEvent) => (this.props.editing ? e.stopPropagation() : null);
    handleClickSpan = (e: React.MouseEvent) => (this.props.editing ? e.stopPropagation() : null);
    handleClick = (e: React.MouseEvent) => {};
    handleKeyDown = (e: React.KeyboardEvent) => { // propagate for parent for focus on boxUI
        if (!this.props.editing) return;
        if (e.key === "Enter") {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    };
    handlePaste = (e: React.ClipboardEvent) => {
        if (!this.props.editing) return;
        e.preventDefault();
        document.execCommand("insertHTML", false, e.clipboardData.getData("text/plain"));
    };
    render() {
        const classArray = ["box-ui-button", "ui", "button", "compact", "mini"];
        return (
            <BaseUI {...this.props} additionalClassName={classArray.join(" ")} containerProps={{ onClick: this.handleClick }}>
                <div className="box-ui-text-container">
                    <span contentEditable={this.props.editing} className={"editable" + (this.props.editing ? " editing" : "")} ref={this.refSpan} onMouseDown={this.handleMouseDown} onClick={this.handleClickSpan} onPaste={this.handlePaste} onKeyDown={this.handleKeyDown} onBlur={this.props.onEditEnd} suppressContentEditableWarning={true}>
                        {this.state.text}
                    </span>
                </div>
            </BaseUI>
        );
    }
}
