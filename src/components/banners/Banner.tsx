import css from "@emotion/css/macro";
import React from "react"; // see https://github.com/emotion-js/emotion/issues/1156
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import { ICollection, IBanner } from "../../model/ContentInterfaces";
import { StandardBannerLayout } from "./StandardBannerLayout";
import { ImageOnRightBannerLayout } from "./ImageOnRightBannerLayout";
export const Banner: React.FunctionComponent<{
    collection: ICollection;
    banner: IBanner;
}> = (props) => {
    const defaultTextColor = props.banner.backgroundImage ? "white" : "black";
    return (
        <div
            css={css`
                display: flex;
                flex-direction: column;
                overflow: hidden;

                *,
                a {
                    color: ${props.banner.textColor || defaultTextColor};
                    font-size: 14pt;
                }
                a:visited {
                    text-decoration: underline;
                }
                background-color: ${props.banner.backgroundColor};

                /* this can override any of the above*/
                ${props.banner.css}
            `}
        >
            {(props.banner.backgroundColor && (
                <ImageOnRightBannerLayout {...props} banner={props.banner} />
            )) || <StandardBannerLayout {...props} banner={props.banner} />}
        </div>
    );
};