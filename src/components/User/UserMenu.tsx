// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import React, { useState, useEffect } from "react";
import { Button, Menu, MenuItem, useTheme } from "@material-ui/core";
import loginIcon from "../../assets/NoUser.svg";
// these two firebase imports are strange, but not an error. See https://github.com/firebase/firebase-js-sdk/issues/1832
import firebase from "firebase/app";
import { ShowLoginDialog } from "./LoginDialog";
import { observer } from "mobx-react";
import { logout as logoutFromParseServer } from "../../connection/ParseServerConnection";
import Avatar from "react-avatar";
import { track } from "../../analytics/Analytics";
import * as Sentry from "@sentry/browser";
import { FormattedMessage, useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import {
    firebaseAuthStateChanged,
    getCurrentUser,
} from "../../firebase/firebase";
import { setCookie } from "../../Utilities";

// This React component displays a button for functions related to the user who may
// be logged in. If no user is logged in, it displays a generic icon with pull-down
// menu for logging in or signing up. If a user is logged in, it displays the user's
// picture (sometimes just a couple of letters of name) and the pull-down has items
// for logging out, showing a profile, and showing this user's books.
// Currently, it is also responsible for handling a user who lacks a verified
// email...currently just with an alert followed by forced logout. This functionality
// might move when we decide what we really want to show.
interface IProps extends React.HTMLProps<HTMLDivElement> {
    buttonHeight: string;
}

export const UserMenu: React.FunctionComponent<IProps> = observer((props) => {
    const l10n = useIntl();
    // This variable is used according to an apparently standard but rather
    // obscure convention for managing Material button/menu combinations.
    // When the menu is hidden, it is null. When the menu is showing, it
    // is the element that determines the position of the menu...in our case,
    // the element clicked. It's supposed to be an actual HTML element, which
    // isn't easily accessible in React, so we get it (in showMenu) from the
    // target of the clickAction. Since only one of the two button/menu
    // combinations is visible at any one time, a single state works for both.
    const [anchorEl, setAnchorEl] = useState(null as Element | null);

    const [loggedInUser, setLoggedInUser] = useState<firebase.User | null>(
        null
    );

    const history = useHistory(); // used to jump to My Books

    /*useEffect(() => {
        firebase
            .auth()
            .getRedirectResult()
            .then(result => {
                if (result.credential) {
                    // This gives you a Google Access Token. You can use it to access the Google API.
                    //var token = result.credential.accessToken;
                    // ...
                }

                //staticUser.set(result.user);
                firebase.auth().updateCurrentUser(result.user);
                console.log("getRedirectResult:user = " + result.user);
            })
            .catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
                console.log("During getRedirectResult, got " + error);
            });
    }, []);*/

    useEffect(
        () =>
            firebaseAuthStateChanged(() => {
                // If someone is now logged in, and it wasnt' who we previously had logged
                // in (or more likely no one was previously logged in), report login
                if (
                    firebase.auth()?.currentUser?.email &&
                    loggedInUser?.email !== firebase.auth()?.currentUser?.email
                ) {
                    setCookie("loggedIn", "true", 360);
                    // In previous blorg, we tracked the user name, but we're avoiding PII now.
                    track("Log In", {});
                }
                // If no one is now logged in and someone was, report logout.
                // Review: we won't (and probably can't?) get a report when the browser
                // or tab shuts down and similar.
                if (
                    !firebase.auth()?.currentUser?.email &&
                    loggedInUser?.email
                ) {
                    setCookie("loggedIn", "false", 360);
                    track("Log Out", {});
                }
                setLoggedInUser(firebase.auth().currentUser);
                // console.log(
                //     "$$$$$$$$$$$$ onAuthStateChanged " +
                //         firebase.auth().currentUser
                // );
            }),
        [loggedInUser]
    );
    useEffect(() => {
        getCurrentUser().then((currentUser) => {
            if (currentUser !== null) {
                setLoggedInUser(currentUser);
            }
        });
    }, []);

    const showMenu = (ev: any) => {
        setAnchorEl(ev.target as Element);
    };
    const closeMenu = () => setAnchorEl(null);
    const handleLogin = () => {
        closeMenu();
        //loginWithRedirect();
        try {
            ShowLoginDialog(true);
        } catch (error) {
            Sentry.captureException(error); // probably won't happen, nothing seems to bring us here
            // setState({ isLoading: false, error: error });
        }
    };
    const handleLogout = () => {
        closeMenu();
        firebase
            .auth()
            .signOut()
            .then(() => logoutFromParseServer());
    };
    const handleMyBooks = () => {
        closeMenu();
        const userEmail = !!loggedInUser ? loggedInUser.email : undefined;
        if (userEmail) {
            history.push("/my-books");
        } else {
            // This shouldn't happen. But if it does, we might as well log them out and do nothing else.
            handleLogout();
        }
    };
    // split out buttonHeight else react complains because it doesn't apply to <div>s
    const { buttonHeight, ...otherProps } = props;
    return (
        // <FirebaseAuthConsumer>
        //     {(authState: AuthEmission) => (
        <div {...otherProps}>
            {/* Logged out state */}
            {!loggedInUser /*authState.isSignedIn */ && (
                <React.Fragment>
                    {/* Material recommends a trick I could not make sense of to let Emotion styles
                        beat Material ones, but there seems no reason to avoid !important here: we
                        definitely always want to get rid of the Material top padding so the img aligns
                        with other things in the Header.*/}
                    <Button
                        aria-controls="login-menu"
                        aria-haspopup="true"
                        onClick={showMenu}
                        css={css`
                            padding-top: 0 !important;
                        `}
                    >
                        <img
                            src={loginIcon}
                            css={css`
                                width: ${props.buttonHeight};
                            `}
                            alt={l10n.formatMessage({
                                id: "usermenu.loginButton",
                                defaultMessage: "login",
                            })}
                        ></img>
                    </Button>
                    <Menu
                        id="login-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={closeMenu}
                        css={css`
                            top: 40px !important;
                        `}
                    >
                        <MenuItem onClick={handleLogin}>
                            <FormattedMessage
                                id="usermenu.signIn"
                                defaultMessage="Sign In / Sign Up"
                            />
                        </MenuItem>
                    </Menu>
                </React.Fragment>
            )}
            {/* Logged in state */}
            {!!loggedInUser && (
                <React.Fragment>
                    <Button
                        aria-controls="logout-menu"
                        aria-haspopup="true"
                        onClick={showMenu}
                        css={css`
                            padding-top: 0 !important;
                        `}
                        // If we decide not to log out users with unverified emails immediately,
                        // this or similar can be used to highlight the fact that the user is
                        // unverified (and hence not authorized).
                        // style={{
                        //     border: isAuthorized ? "" : "2px solid red"
                        // }}
                    >
                        <div
                            id="avatarCircle"
                            css={css`
                                border-radius: 50%;
                                overflow: hidden;
                                width: ${props.buttonHeight};
                                height: ${props.buttonHeight};
                            `}
                        >
                            {loggedInUser.photoURL && (
                                <img
                                    src={loggedInUser.photoURL}
                                    alt={l10n.formatMessage({
                                        id: "usermenu.avatar",
                                        defaultMessage: "user",
                                    })}
                                    css={css`
                                        width: ${props.buttonHeight};
                                    `}
                                />
                            )}
                            {!loggedInUser.photoURL && (
                                <Avatar
                                    email={loggedInUser.email ?? ""}
                                    name={loggedInUser.displayName ?? ""}
                                    size={props.buttonHeight}
                                    color={useTheme().palette.secondary.main}
                                />
                            )}
                        </div>
                    </Button>
                    <Menu
                        id="logout-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={closeMenu}
                    >
                        <MenuItem onClick={closeMenu}>
                            {/* It's not clear from BL-7984 what this menu item is supposed to do.
                            Possibly it's meant to be part of the Profile menu item. */}
                            {loggedInUser && loggedInUser.photoURL && (
                                <img
                                    src={loggedInUser.photoURL}
                                    // This use of the avatar image is decorative, not informational.  See BL-8963.
                                    alt=""
                                    css={css`
                                        width: ${props.buttonHeight};
                                        margin-right: 15px;
                                    `}
                                ></img>
                            )}
                            {loggedInUser && loggedInUser.email && (
                                <> {loggedInUser.email}</>
                            )}
                        </MenuItem>
                        {/* BL-9280 remove unimplemented Profile
                        <MenuItem onClick={handleNotImplemented}>
                            <FormattedMessage
                                id="usermenu.profile"
                                defaultMessage="Profile"
                            />
                        </MenuItem> */}
                        <MenuItem onClick={handleMyBooks}>
                            <FormattedMessage
                                id="usermenu.myBooks"
                                defaultMessage="My Books"
                            />
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <FormattedMessage
                                id="usermenu.logout"
                                defaultMessage="Log Out"
                            />
                        </MenuItem>
                    </Menu>
                </React.Fragment>
            )}
        </div>
        // )}
        // </FirebaseAuthConsumer>
    );
});
