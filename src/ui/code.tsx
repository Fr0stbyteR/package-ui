import * as React from "react";
import { Dimmer, Loader } from "semantic-ui-react";
import type MonacoEditor from "react-monaco-editor";
import type { monaco } from "react-monaco-editor";
import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { BaseUI, getReactMonacoEditor } from "../sdk";
import code, { CodeProps } from "../objects/code";

export interface CodeUIState extends BaseUIState, CodeProps {
    language: string;
    value: string;
    editorLoaded: boolean;
    editing: boolean;
}

export default class CodeUI extends BaseUI<code, {}, CodeUIState> {
    static sizing = "both" as const;
    static defaultSize: [number, number] = [400, 225];
    state: CodeUIState = { ...this.state, editing: false, value: this.object.data.value, editorLoaded: false };
    codeEditor: monaco.editor.IStandaloneCodeEditor;
    editorJSX: typeof MonacoEditor;
    handleCodeEditorMount = (monaco: monaco.editor.IStandaloneCodeEditor) => {
        this.codeEditor = monaco;
        this.object.emit("editorLoaded", monaco);
        monaco.onDidBlurEditorText(() => this.object.emit("editorBlur", monaco.getValue()));
    };
    handleResize = () => {
        if (this.state.editorLoaded) {
            requestAnimationFrame(() => this.codeEditor.layout());
        }
    };
    handleChange = (value: string, event: monaco.editor.IModelContentChangedEvent) => {
        this.setState({ value });
        this.object.setData({ value });
        this.object.emit("change");
    };
    handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    };
    handleKeyUp = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    };
    async componentDidMount() {
        super.componentDidMount();
        const reactMonacoEditor = await getReactMonacoEditor();
        this.editorJSX = reactMonacoEditor.default;
        this.setState({ editorLoaded: true });
        this.editor.on("presentation", this.handleResize);
        window.addEventListener("resize", this.handleResize);
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.handleResize);
        this.editor.off("presentation", this.handleResize);
        super.componentWillUnmount();
    }
    render() {
        return (
            <BaseUI {...this.props} containerProps={{ onKeyDown: this.handleKeyDown, onKeyUp: this.handleKeyUp, style: { opacity: this.state.opacity } }}>
                {
                    this.state.editorLoaded
                        ? <this.editorJSX value={this.state.value} language={this.state.language} theme={this.state.theme} editorDidMount={this.handleCodeEditorMount} onChange={this.handleChange} options={this.state.options} width={this.state.width} height={this.state.height} />
                        : <Dimmer active><Loader content="Loading" /></Dimmer>
                }
            </BaseUI>
        );
    }
}
