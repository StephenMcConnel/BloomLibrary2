import { css } from "@emotion/react";

import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { useGetCollection } from "../model/Collections";
import { splitPathname } from "./Routes";
import { CollectionLabel } from "../localization/CollectionLabel";
import { BlorgLink } from "./BlorgLink";
import { FormattedMessage, useIntl } from "react-intl";
import { CollectionInfoWidget } from "./CollectionInfoWidget";
import { appHostedSegment, useIsAppHosted } from "./appHosted/AppHostedUtils";
import { getDisplayNamesFromLanguageCode } from "../model/Language";
import { CachedTablesContext } from "../model/CacheProvider";
import { isFacetedSearchString } from "../connection/LibraryQueryHooks";

export const Breadcrumbs: React.FunctionComponent<{
    className?: string;
}> = (props) => {
    const location = useLocation();
    const l10n = useIntl();
    const { languagesByBookCount: languages } = useContext(CachedTablesContext);
    // TODO: this doesn't look good on a narrow screen (phone) when the breadcrumbs get very long.
    const breadcrumbsStyle = css`
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0; // better to let the consumer decide our margin
        //padding-left: 20px;
        margin-top: 5px;
        margin-bottom: 14px;

        /* bold only the last breadcrumb. Question: should we eve *show* the last one? It's redundant.
        li:last-child a {
            font-weight: bold;
        }*/
        li {
            line-height: 1em; // without this, "Chinese (简体中文)" doe not align with the part before it
            margin-right: 3px;
            //color: whitesmoke;

            &:after {
                margin-left: 3px;
                margin-right: 3px;
                content: "›";
            }
        }

        li:last-child::after {
            color: transparent;
        }
    `;
    const appHostedMode = useIsAppHosted();
    const crumbs: React.ReactElement[] = [];
    crumbs.push(
        <li key="home">
            <BlorgLink
                css={css`
                    text-decoration: none !important;
                    @media (hover) {
                        &:hover {
                            text-decoration: underline !important;
                        }
                    }
                `}
                href={appHostedMode ? "/" + appHostedSegment + "/langs" : "/"}
            >
                <FormattedMessage id="header.home" defaultMessage="Home" />
            </BlorgLink>
        </li>
    );
    const { breadcrumbs, collectionName, filters } = splitPathname(
        location.pathname
    );
    // A leading slash, can produce an empty element, or even two if there's nothing
    // following it. splitPathName should deal with that, but it's cheap to keep the robustness.
    // We try to keep root.read out of the URL, but if it creeps in we can at least keep
    // it out of breadcrumbs.
    // On a 'more' page there may also be a 'more' which we don't need.
    while (
        breadcrumbs[0] === "more" ||
        breadcrumbs[0] === "" ||
        breadcrumbs[0] === "root.read"
    ) {
        breadcrumbs.splice(0, 1);
    }
    breadcrumbs.forEach((c, i) => {
        if (c !== appHostedSegment) {
            // We want to keep "app-hosted-v1" in the list of breadcrumbs so it will be part of any
            // url we jump to, but it's not actually a place we can go to.
            crumbs.push(
                <CollectionCrumb
                    key={c}
                    collectionName={c}
                    previousBreadcrumbs={breadcrumbs.slice(0, i)}
                />
            );
        }
    });
    // We may not have a collection name, especially for a book or player url without
    // breadcrumbs.
    if (
        collectionName &&
        !breadcrumbs.includes(collectionName) &&
        !["root.read", "grid", "bulk"].includes(collectionName)
    ) {
        // Enhance: if there are no filters, this doesn't need to be a link.
        crumbs.push(
            <CollectionCrumb
                key={collectionName}
                collectionName={collectionName}
                previousBreadcrumbs={breadcrumbs}
            />
        );
    }
    for (const item of filters) {
        let label = item;
        const labelParts = item.replace(/%3A/g, ":").split(":");
        const prefix = labelParts[0];
        // Text to be bolded in the label.  This may be left empty.
        // Only the first occurrence of the this text is bolded.
        // The text to be bolded is enclosed in quotes in the label string
        // to prevent matching against other parts of the label.
        let boldedText = "";
        switch (prefix.toLowerCase()) {
            case "level":
                label = l10n.formatMessage(
                    {
                        id: "book.metadata.level",
                        defaultMessage: "Level {levelNumber}",
                    },
                    { levelNumber: labelParts[1] }
                );
                break;
            case "search":
                const searchString = labelParts.slice(1).join(":");
                if (searchString.startsWith("deeper:")) {
                    boldedText = labelParts
                        .slice(2)
                        .join(":")
                        .replace(/\\"/g, '"');
                    label = l10n.formatMessage(
                        {
                            id: "search.booksLooseMatching",
                            defaultMessage:
                                'Books with a loose match to "{searchTerms}"',
                        },
                        { searchTerms: boldedText }
                    );
                } else if (isFacetedSearchString(searchString)) {
                    boldedText = searchString.replace(/\\"/g, '"');
                    label = l10n.formatMessage(
                        {
                            id: "search.booksMatching",
                            defaultMessage: 'Books matching "{searchTerms}"',
                        },
                        {
                            searchTerms: boldedText,
                        }
                    );
                } else {
                    boldedText = searchString.replace(/\\"/g, '"');
                    label = l10n.formatMessage(
                        {
                            id: "search.booksStrongMatching",
                            defaultMessage:
                                'Books with a strong match to "{searchTerms}"',
                        },
                        { searchTerms: boldedText }
                    );
                }
                break;
            case "language":
                const languageNames = getDisplayNamesFromLanguageCode(
                    labelParts[1],
                    languages
                );
                label = languageNames?.combined || labelParts[1];
                break;
            case "skip":
            case "all":
                continue;
        }
        const displayLabel = decodeURIComponent(label);
        // If we have a boldedText, we need to find it in the label and bold it.
        let displayWithBold: JSX.Element | null = null;
        if (boldedText) {
            const indexBold = label.indexOf('"' + boldedText + '"');
            if (indexBold) {
                const prebold = decodeURIComponent(
                    label.substring(0, indexBold)
                );
                const postbold = decodeURIComponent(
                    label.substring(indexBold + boldedText.length + 2)
                );
                const bolded = (
                    <em>
                        <strong>{decodeURIComponent(boldedText)}</strong>
                    </em>
                );
                displayWithBold = (
                    <span>
                        {prebold}
                        {bolded}
                        {postbold}
                    </span>
                );
            }
        }
        crumbs.push(
            <li key={item}>
                {displayWithBold ? displayWithBold : displayLabel}
                {/* enhance: reinstate if we come up with a destination for the link.<BlorgLink
                    css={css`
                        text-decoration: none !important;
                    `}
                    to="/"
                >
                    {label}
                </BlorgLink> */}
            </li>
        );
    }

    return (
        <ul css={breadcrumbsStyle} className={props.className}>
            {crumbs}
        </ul>
    );
};
//     const router = useContext(RouterContext);
//     if (!router) {
//         throw new Error(
//             "Breadcrumbs found that there is no Router defined in a RouterContext. If this is a story, see the examples using an AddDecorator()"
//         );
//     }
//     return (
//         <ul css={breadcrumbsStyle}>
//             {router!.breadcrumbStack.map((l) => (
//                 <li key={l.title}>
//                     <a
//                         css={css`
//                             text-decoration: none !important;
//                         `}
//                         target="_blank"
//                         // todo: seems we're supposed to make this a button that looks like a link for accessibility
//                         onClick={() => {
//                             router!.goToBreadCrumb(l);
//                         }}
//                     >
//                         {l.title}
//                     </a>
//                 </li>
//             ))}
//         </ul>
//     );
// };

const CollectionCrumb: React.FunctionComponent<{
    collectionName: string;
    previousBreadcrumbs: string[];
}> = (props) => {
    const { collection } = useGetCollection(props.collectionName);

    const path = [...props.previousBreadcrumbs];
    path.push(props.collectionName);
    return (
        <li>
            <BlorgLink
                css={css`
                    text-decoration: none !important;
                    @media (hover) {
                        &:hover {
                            text-decoration: underline !important;
                        }
                    }
                `}
                href={"/" + path.join("/")}
            >
                {collection ? (
                    <CollectionLabel collection={collection}></CollectionLabel>
                ) : (
                    ""
                )}
            </BlorgLink>
            {collection ? <CollectionInfoWidget collection={collection} /> : ""}
        </li>
    );
};
