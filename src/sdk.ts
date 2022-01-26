import type { IJSPatcherSDK } from "@jspatcher/jspatcher/src/core/SDK";

const sdk = (globalThis as any).jspatcherEnv.sdk as IJSPatcherSDK;
export const {
    React,
    ReactDOM,
    SemanticUI,
    PatcherAudio,
    OperableAudioBuffer,
    TempTextFile,
    PatcherText,
    TextEditor,
    TextEditorUI,
    Patcher,
    PatcherEditor,
    PatcherEditorUI,
    Box,
    Line,
    BaseObject,
    DefaultObject,
    BaseUI,
    DefaultUI,
    CanvasUI,
    CodeUI,
    DefaultPopupUI,
    CodePopupUI,
    DOMUI,
    generateDefaultObject,
    generateRemoteObject,
    generateRemotedObject,
    Bang,
    isBang,
    TransmitterNode,
    TemporalAnalyserNode,
    SpectralAnalyserNode,
    MathUtils,
    BufferUtils,
    Utils,
    getReactMonacoEditor
} = sdk;

export interface Bang extends InstanceType<typeof Bang> {}
export interface PatcherAudio extends InstanceType<typeof PatcherAudio> {}
export interface OperableAudioBuffer extends InstanceType<typeof OperableAudioBuffer> {}
export interface TempTextFile extends InstanceType<typeof TempTextFile> {}
export interface PatcherText extends InstanceType<typeof PatcherText> {}
export interface Patcher extends InstanceType<typeof Patcher> {}
export interface Box extends InstanceType<typeof Box> {}
export interface Line extends InstanceType<typeof Line> {}
export interface BaseObject extends InstanceType<typeof BaseObject> {}
export interface TransmitterNode extends InstanceType<typeof TransmitterNode> {}
export interface TemporalAnalyserNode extends InstanceType<typeof TemporalAnalyserNode> {}
export interface SpectralAnalyserNode extends InstanceType<typeof SpectralAnalyserNode> {}
export interface CanvasUI extends InstanceType<typeof CanvasUI> {}
