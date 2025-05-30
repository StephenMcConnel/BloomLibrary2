import { css } from "@emotion/react";

import React from "react";
import { useLocation } from "react-router-dom";
import { Header } from "../components/header/Header";
import { Routes } from "../components/Routes";
import { FooterCodeSplit } from "../components/FooterCodeSplit";
import { useIsEmbedded } from "../components/Embedding/EmbeddingHost";
import { kStatsPageGray } from "../components/statistics/StatsInterfaces";
import { useIsAppHosted } from "../components/appHosted/AppHostedUtils";

// What we want inside the <Router> component. Has to be its own component so that we can have
// useLocation(), which only works inside the Router.
export const RouterContent: React.FunctionComponent<{}> = (props) => {
    const location = useLocation();
    const showingPlayer = location.pathname.startsWith("/player/");
    const appHostedMode = useIsAppHosted();
    const embeddedMode = useIsEmbedded();

    const showHeaderAndFooter = !(
        embeddedMode ||
        appHostedMode ||
        showingPlayer
    );

    return (
        <React.Fragment>
            {showHeaderAndFooter && <Header />}
            {/* This div takes up all the space available so that the footer
        is either at the bottom or pushed off screen. If we're showing the player,
        we don't have a header or footer. In most browsers, flex 1 0 auto would
        still work, and the one and only child div would take all the space.
        However, at the next level, we want the player iframe to fill the available
        height. In Safari (grrrrrr!), it doesn't work to make an iframe 100%
        of the height of a parent whose height is determined by flex grow.
        So, in that one case, we simply make this div have height 100%.*/}
            <div
                id="expandableContent"
                css={css`
                    ${showingPlayer || appHostedMode
                        ? "height: 100%;"
                        : "flex: 1 0 auto;"}
                    // I apologize for this hack
                    ${location.pathname.indexOf("/stats") > -1
                        ? `background-color:${kStatsPageGray}`
                        : ""}
                `}
                role="main"
            >
                <Routes />
            </div>
            {showHeaderAndFooter && <FooterCodeSplit />}
        </React.Fragment>
    );
};
