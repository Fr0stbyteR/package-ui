import type { DOMUIState } from "@jspatcher/jspatcher/src/core/objects/base/DOMUI";
import { DOMUI } from "../sdk";
import type view from "../objects/view";

export default class ViewUI extends DOMUI<view> {
    state: DOMUIState = { ...this.state, children: this.object._.children };
}
