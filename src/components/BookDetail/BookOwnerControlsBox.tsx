import { css } from "@emotion/react";

import React, { Fragment, useContext, useEffect, useState } from "react";
import { Book } from "../../model/Book";
import { observer } from "mobx-react-lite";

import { DeleteButton } from "./DeleteButton";
import { FormattedMessage, useIntl } from "react-intl";
import { commonUI } from "../../theme";
import { Button, Checkbox, FormControlLabel } from "@material-ui/core";
import DraftIcon from "../../assets/DRAFT-Stamp.svg?react";
import { Alert } from "@material-ui/lab";
import { BlorgLink } from "../BlorgLink";
import { BookExtraPanels } from "./BookExtraPanels";
import { AvatarCircle, LoggedInFirebaseUser } from "../User/AvatarCircle";
import { User, useGetUserIsModerator } from "../../connection/LoggedInUser";
import { getCurrentUser } from "../../authentication/firebase/firebase";
import firebase from "firebase/compat/app";
import {
    IUserBookPermissions,
    useGetPermissions,
} from "../../connection/LibraryQueryHooks";
import { OSFeaturesContext } from "../OSFeaturesContext";
import { ControlsBox } from "./ControlsBox";

export const BookOwnerControlsBox: React.FunctionComponent<{
    book: Book;
    user: User;
    showDownloadDialog: any; // pass down the ref
}> = observer((props) => {
    const l10n = useIntl();
    const { bloomDesktopAvailable } = useContext(OSFeaturesContext);

    const [firebaseUser, setFirebaseUserUrl] = useState<firebase.User | null>(
        null
    );
    useEffect(() => {
        getCurrentUser().then((currentUser) => {
            if (currentUser !== null) {
                setFirebaseUserUrl(currentUser);
            }
        });
    }, [props.user]);

    const userIsUploader =
        props.user.username === props.book.uploader?.username;
    const userIsModerator = useGetUserIsModerator();
    const permissions: IUserBookPermissions = useGetPermissions(
        !!firebaseUser,
        props.book.id
    );

    const showControlsBox =
        // We expect userIsModerator to become obsolete as soon as we have Users set up in Contentful.
        // At that point, moderators will have all permissions.x as true.
        userIsModerator ||
        // See comment below about userIsUploader.
        userIsUploader ||
        permissions.editSurfaceMetadata === true ||
        permissions.reupload === true ||
        permissions.delete === true;

    if (!showControlsBox) return <Fragment />;

    const showSurfaceMetadataControls =
        userIsModerator ||
        // We want to use permissions.editSurfaceMetadata rather than userIsUploader.
        // But we haven't yet implemented book modification for non-moderator, non-uploader users.
        // So for now, we must only show these controls when they will work (moderator or uploader).
        userIsUploader;
    //permissions.editSurfaceMetadata === true;

    const showDownloadForEditButton = permissions.reupload === true;
    const showDeleteButton = userIsModerator || permissions.delete === true;

    return (
        <ControlsBox>
            <div>
                <div
                    css={css`
                        display: flex;
                        align-items: center;
                    `}
                >
                    <AvatarCircle
                        buttonHeight="28px"
                        loggedInUser={firebaseUser as LoggedInFirebaseUser}
                    ></AvatarCircle>
                    <h1
                        id={"book.detail.youHavePermission"}
                        css={css`
                            color: ${commonUI.colors.bloomBlue};
                            margin-top: 0;
                            margin-bottom: 0;
                            display: inline-block;
                            margin-left: 10px;
                        `}
                    >
                        You have permission to modify this book
                    </h1>
                </div>
                {showSurfaceMetadataControls && (
                    <>
                        <h2
                            css={css`
                                margin-bottom: 0;
                                color: ${commonUI.colors.bloomBlue};
                            `}
                            id="book.detail.draft"
                        >
                            Draft
                        </h2>
                        <FormControlLabel
                            css={css`
                                margin-top: 5px;
                            `}
                            control={
                                <Checkbox
                                    css={css`
                                        padding-top: 0;
                                        margin-right: -5px;
                                        padding-right: 1px;
                                    `}
                                    checked={props.book.draft}
                                    onChange={(e) => {
                                        props.book.draft = e.target.checked;
                                        props.book.saveAdminDataToParse();
                                    }}
                                />
                            }
                            label={
                                <div
                                    css={css`
                                        display: flex;
                                    `}
                                >
                                    <DraftIcon
                                        css={css`
                                            width: 54px;
                                        `}
                                    />
                                    <div>
                                        {l10n.formatMessage({
                                            id: "book.detail.draftDescription",
                                            defaultMessage:
                                                "Do not show this book to the public yet. I will share its URL with reviewers for feedback.",
                                            description:
                                                "Label for a check box which, if checked, marks the book as 'DRAFT' and prevents the book from showing in most views",
                                        })}
                                    </div>
                                </div>
                            }
                        />
                    </>
                )}
                <div
                    css={css`
                        display: flex;
                        flex-direction: column;
                    `}
                >
                    <h2
                        css={css`
                            margin-bottom: 0;
                            color: ${commonUI.colors.bloomBlue};
                        `}
                        id="book.detail.editing"
                    >
                        Editing
                    </h2>
                    <Alert severity="info">
                        <div>
                            <FormattedMessage
                                id={"book.detail.updateBookNotice"}
                                defaultMessage={
                                    "If you want to update this book with any changes, just upload it again from Bloom, using the same account. Your new version will replace this one."
                                }
                            />
                        </div>
                        {showDownloadForEditButton && (
                            <div
                                css={css`
                                    margin-top: 10px;
                                `}
                            >
                                <FormattedMessage
                                    id={"book.detail.getForEditBookNotice"}
                                    defaultMessage={
                                        "If necessary, we can give you the book to edit in Bloom. You must first have Bloom 6.0 or greater installed ({downloadLink})."
                                    }
                                    values={{
                                        downloadLink: (
                                            <BlorgLink
                                                href="/downloads"
                                                css={css`
                                                    color: ${commonUI.colors
                                                        .bloomBlue};
                                                `}
                                            >
                                                <FormattedMessage
                                                    id={
                                                        "book.detail.downloadLink"
                                                    }
                                                    defaultMessage={
                                                        "Download Bloom"
                                                    }
                                                />
                                            </BlorgLink>
                                        ),
                                    }}
                                />
                            </div>
                        )}
                    </Alert>
                    {showDownloadForEditButton && (
                        <Button
                            onClick={() => props.showDownloadDialog.current?.()}
                            color="secondary"
                            variant="outlined"
                            css={css`
                                align-self: flex-end;
                                margin-top: 5px;
                            `}
                            disabled={!bloomDesktopAvailable}
                        >
                            <FormattedMessage
                                id={"book.detail.editDownload"}
                                defaultMessage={
                                    "Download into Bloom for editing"
                                }
                            />
                        </Button>
                    )}
                </div>
            </div>
            {showSurfaceMetadataControls && (
                <BookExtraPanels book={props.book} />
            )}
            {showDeleteButton && (
                <div
                    css={css`
                        margin-top: 30px;
                    `}
                >
                    <DeleteButton book={props.book} />
                </div>
            )}
        </ControlsBox>
    );
});
