// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import React from "react";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import { commonUI } from "../../../theme";
import { IFeatureGroupProps } from "./FeatureGroupCodeSplit";

export const FeatureGroup: React.FunctionComponent<IFeatureGroupProps> = (
    props
) => {
    return (
        <React.Fragment>
            <TableRow key={props.name} css={css``}>
                <TableCell
                    colSpan={99}
                    scope="row"
                    css={css`
                        color: white !important;
                        background-color: ${commonUI.colors.resourcesArea};
                    `}
                >
                    <span
                        css={css`
                            width: 30px;
                            display: inline-block;
                        `}
                    ></span>
                    {props.name}
                </TableCell>
            </TableRow>
            {props.children}
        </React.Fragment>
    );
};

// though we normally don't like to export defaults, this is required for react.lazy (code splitting)
export default FeatureGroup;
