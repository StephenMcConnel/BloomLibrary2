import { css } from "@emotion/react";

import React from "react";
import Button from "@material-ui/core/Button";
import { PlayStoreIcon } from "./PlayStoreIcon";
import { commonUI } from "../../theme";
import { FormattedMessage } from "react-intl";

interface IProps {
    fullWidth?: boolean;
}

export const GetBloomReaderButton: React.FunctionComponent<IProps> = (
    props
) => {
    return (
        <Button
            variant="outlined"
            color="secondary"
            startIcon={<PlayStoreIcon />}
            href="/bloom-reader"
            size="large"
            css={css`
                width: ${props.fullWidth
                    ? "100%"
                    : commonUI.detailViewMainButtonWidth};
                height: ${commonUI.detailViewMainButtonHeight};
                margin-bottom: 10px !important;
                float: right;
            `}
        >
            <h1
                css={css`
                    margin-bottom: 0;
                    margin-top: 0;
                `}
            >
                <p
                    css={css`
                        margin-bottom: 0;
                        margin-top: 0;
                        line-height: 19px;
                    `}
                >
                    <FormattedMessage
                        id="book.detail.getBloomReader"
                        defaultMessage="Get Bloom Reader"
                    />
                </p>
            </h1>
        </Button>
    );
};
