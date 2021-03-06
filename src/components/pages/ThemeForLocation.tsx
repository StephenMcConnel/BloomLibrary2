import React from "react";
import { useSetBrowserTabTitle } from "../Routes";
import { CreationThemeProvider } from "../../theme";
import { useLocation } from "react-router-dom";

export const ThemeForLocation: React.FunctionComponent<{ urlKey: string }> = (
    props
) => {
    useSetBrowserTabTitle(props.urlKey);
    const inCreate =
        useLocation().pathname.toLowerCase().indexOf("create") > -1;

    if (inCreate) {
        return <CreationThemeProvider>{props.children}</CreationThemeProvider>;
    } else {
        return <React.Fragment>{props.children}</React.Fragment>;
    }
};
