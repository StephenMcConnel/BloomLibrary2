// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import React from "react";
import { useGetBookDetail, IBookDetail } from "../connection/LibraryQueryHooks";

export const ReadBookPage: React.FunctionComponent<{ id: string }> = props => {
    const book = useGetBookDetail(props.id);
    const url = book ? getUrlOfHtmlOfDigitalVersion(book) : "waiting";

    const bloomPlayerHost =
        "https://" +
        (window.location.hostname.indexOf("localhost") > -1
            ? "dev.bloomlibrary.org"
            : window.location.hostname);

    const bloomPlayerUrl = bloomPlayerHost + "/bloom-player/bloomplayer.htm";
    const iframeSrc = `${bloomPlayerUrl}?url=${url}&amp;showBackButton=true`;
    //console.log("iframe src = " + iframeSrc);

    // note that bloom-player is *supposed* to handle url="waiting" by just showing a loading
    // icon, but at the moment that isn't working or hasn't reached the server so I'm just
    // not showing it until we have something.
    return book ? (
        <iframe
            title="bloom player"
            css={css`
                border: none;
                width: 100%;
                height: 100%;
            `}
            src={iframeSrc}
        ></iframe>
    ) : (
        <div></div>
    );
};

function getHarvesterBaseUrl(book: IBookDetail) {
    // typical input url:
    // https://s3.amazonaws.com/BloomLibraryBooks-Sandbox/ken%40example.com%2faa647178-ed4d-4316-b8bf-0dc94536347d%2fsign+language+test%2f
    // want:
    // https://s3.amazonaws.com/bloomharvest-sandbox/ken%40example.com%2faa647178-ed4d-4316-b8bf-0dc94536347d/
    // We come up with that URL by
    //  (a) changing BloomLibraryBooks{-Sandbox} to bloomharvest{-sandbox}
    //  (b) strip off everything after the next-to-final slash
    let folderWithoutLastSlash = book.baseUrl;
    if (book.baseUrl.endsWith("%2f")) {
        folderWithoutLastSlash = book.baseUrl.substring(
            0,
            book.baseUrl.length - 3
        );
    }
    const index = folderWithoutLastSlash.lastIndexOf("%2f");
    const pathWithoutBookName = folderWithoutLastSlash.substring(0, index);
    return (
        pathWithoutBookName
            .replace("BloomLibraryBooks-Sandbox", "bloomharvest-sandbox")
            .replace("BloomLibraryBooks", "bloomharvest") + "/"
    );
    // Using slash rather than %2f at the end helps us download as the filename we want.
    // Otherwise, the filename can be something like ken@example.com_007b3c03-52b7-4689-80bd-06fd4b6f9f28_Fox+and+Frog.bloomd
}
function getUrlOfHtmlOfDigitalVersion(book: IBookDetail) {
    const harvesterBaseUrl = getHarvesterBaseUrl(book);
    // use this if you are are working on bloom-player and are using the bloom-player npm script tobloomlibrary
    // bloomPlayerUrl = "http://localhost:3000/bloomplayer-for-developing.htm";
    return harvesterBaseUrl + "bloomdigital%2findex.htm";
}
