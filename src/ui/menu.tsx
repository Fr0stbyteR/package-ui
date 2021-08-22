import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import type { DropdownProps, StrictDropdownProps } from "semantic-ui-react";
import { React, BaseUI, SemanticUI, Utils } from "../sdk";
import type menu from "../objects/menu";
import type { MenuProps } from "../objects/menu";

const { Dropdown } = SemanticUI;

export interface MenuUIState extends MenuProps {
    value: StrictDropdownProps["value"];
}
export default class MenuUI extends BaseUI<menu, {}, MenuUIState> {
    state: MenuUIState & BaseUIState = {
        ...this.state
    };
    handleChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
        const { value } = data;
        this.setState({ value });
        this.object.outlet(0, value);
    };
    handleQuery = (query: number | string | number[] | string[]) => {
        const { options } = this.state;
        let value;
        if (typeof query === "number") {
            if (options[query]) {
                value = options[query].value;
            }
        } else if (typeof query === "string") {
            const found = options.find(o => o.text === query);
            if (found) {
                value = found.value;
            }
        } else if (Utils.isNumberArray(query)) {
            value = query.filter(i => !!options[i]).map(i => options[i].value);
        } else {
            value = options.filter(o => query.indexOf(o.text as string) !== -1).map(o => o.value);
        }
        if (value) {
            this.setState({ value });
            this.object.outlet(0, value);
        }
    };
    componentDidMount() {
        super.componentDidMount();
        this.object.on("query", this.handleQuery);
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.object.off("query", this.handleQuery);
    }
    render() {
        const {
            clearable, closeOnBlur, closeOnChange, closeOnEscape, deburr,
            defaultOpen, defaultValue, direction, disabled, error, lazyLoad,
            minCharacters, multiple, noResultsMessage, options, placeholder,
            scrolling, search, selectOnBlur, selectOnNavigation, simple,
            tabIndex, text, upward, wrapSelection, value
        } = this.state;
        const dropdownProps = {
            clearable, closeOnBlur, closeOnChange, closeOnEscape, deburr,
            defaultOpen, defaultValue, direction, disabled, error, lazyLoad,
            minCharacters, multiple, noResultsMessage, options, placeholder,
            scrolling, search, selectOnBlur, selectOnNavigation, simple,
            tabIndex, text, upward, wrapSelection, value
        };
        return (
            <BaseUI {...this.props}>
                <Dropdown {...dropdownProps} selection fluid onChange={this.handleChange} />
            </BaseUI>
        );
    }
}