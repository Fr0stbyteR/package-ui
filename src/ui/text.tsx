import type { DefaultPopupUIProps, DefaultPopupUIState } from "@jspatcher/jspatcher/src/core/objects/base/DefaultPopupUI";
import type PatcherText from "@jspatcher/jspatcher/src/core/text/PatcherText";
import TextEditor from "@jspatcher/jspatcher/src/core/text/TextEditor";
import type { StrictModalProps } from "semantic-ui-react";
import text from "../objects/text";
import { React, DefaultPopupUI, SemanticUI, TextEditorUI } from "../sdk"

const { Modal } = SemanticUI;

export interface TextUIState extends DefaultPopupUIState {
    patcherText: PatcherText;
    timestamp: number;
    editor: TextEditor;
}

export default class TextUI extends DefaultPopupUI<text, {}, TextUIState> {
    state: TextUIState = {
        ...this.state,
        patcherText: this.object._.text,
        timestamp: performance.now(),
        editor: undefined
    };
    static dockable = true;
    handleChanged = () => {
        if (this.state.editor.isTemporary) this.state.editor.save();
    };
    handleDoubleClick = () => {
        if (this.editor.state.locked) this.setState({ modalOpen: true }, () => this.state.editor.setActive());
    };
    handleClose = () => this.setState({ modalOpen: false }, () => this.props.editor.setActive());
    handleMouseDownModal = (e: React.MouseEvent) => e.stopPropagation();
    async componentDidMount() {
        super.componentDidMount();
        if (this.state.patcherText) {
            const editor = await this.object._.text.getEditor();
            this.setState({ editor });
            editor.on("changed", this.handleChanged);
        }
    }
    async componentDidUpdate(prevProps: Readonly<DefaultPopupUIProps>, prevState: Readonly<TextUIState>) {
        if (prevState.patcherText !== this.state.patcherText) {
            if (this.state.editor) {
                this.state.editor.off("changed", this.handleChanged);
                this.state.editor.destroy();
            }
            if (this.state.patcherText) {
                const editor = await this.object._.text.getEditor();
                this.setState({ timestamp: performance.now(), editor });
                editor.init();
                editor.on("changed", this.handleChanged);
            } else {
                this.setState({ timestamp: performance.now(), editor: undefined });
            }
        }
        super.componentDidUpdate(prevProps, prevState);
    }
    componentWillUnmount() {
        this.state.editor?.off("changed", this.handleChanged);
        this.state.editor?.destroy();
        super.componentWillUnmount();
    }
    render() {
        const content = <div style={{ height: "100%", width: "100%", display: "flex", position: "relative" }}>
            <div className="ui-flex-row" style={{ flex: "1 1 auto", overflow: "auto" }}>
                <div className="ui-center">
                    {
                        this.state.editor
                            ? <TextEditorUI key={this.state.timestamp} editor={this.state.editor} env={this.env} lang={this.env.language} />
                            : undefined
                    }
                </div>
            </div>
        </div>;
        const children = (
            <Modal.Content style={{ height: "100%", width: "100%", position: "relative" }} onMouseDown={this.handleMouseDownModal}>
                {content}
            </Modal.Content>
        );
        if (this.props.inDock) return children;
        const containerProps = { ...this.props.containerProps };
        if (!containerProps.onDoubleClick) containerProps.onDoubleClick = this.handleDoubleClick;
        const modalProps: StrictModalProps & { onKeyDown: any } = { ...this.props.modalProps, children, className: "subpatcher", open: this.state.modalOpen, onClose: this.handleClose, onKeyDown: undefined, basic: true, size: "fullscreen", closeIcon: true };
        return <DefaultPopupUI {...this.props} modalProps={modalProps} containerProps={containerProps} />;
    }
}
