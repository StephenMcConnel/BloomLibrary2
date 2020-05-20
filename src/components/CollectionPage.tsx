import React, { useEffect, useState, useMemo, useContext } from "react";
import { ByLevelPage } from "./PublisherPages";
import { EnablingWritersPage } from "./EnablingWritersPage";
//import { CachedTablesContext } from "../App";
import { useContentful } from "react-contentful";
import { ContentfulBanner } from "./banners/ContentfulBanner";
import {
    ICollection2,
    ISubCollection,
    getCollectionData,
    makeLanguageCollection,
    useCollection,
} from "../model/Collections";
import { RowOfPageCards, RowOfPageCardsForKey } from "./RowOfPageCards";
import { IBasicBookInfo } from "../connection/LibraryQueryHooks";
import { LevelGroups } from "./LevelGroups";
import { ListOfBookGroups } from "./ListOfBookGroups";
import { LanguageGroup } from "./LanguageGroup";
import { CachedTablesContext } from "../App";
import { CustomizableBanner } from "./banners/CustomizableBanner";
import { getLanguageBannerSpec } from "./banners/LanguageCustomizations";
import { PublisherBanner } from "./banners/PublisherBanner";
import { CollectionGroup } from "./CollectionGroup";
import { ByLanguageGroups } from "./ByLanguageGroups";
import { ByTopicsGroups } from "./ByTopicsGroups";

// export interface IBanner {
//     name: string;
//     bannerImage: string; // contentful id
//     imageCredits: any; // contentful rich text
//     blurb: any; // contentful rich text
// }

export const CollectionPage: React.FunctionComponent<{
    collectionNames: string;
}> = (props) => {
    const collectionNames = props.collectionNames.split("~");
    const collectionName = collectionNames[collectionNames.length - 1];
    const { collection, error, generatorTag, loading } = useCollection(
        collectionName
    );
    if (loading) {
        return null;
    }

    if (error) {
        console.error(error);
        return null;
    }

    if (!collection) {
        return <div>Collection not found</div>;
    }

    const parents = [...collectionNames];
    if (parents[0] === "root.read") {
        parents.splice(0, 1);
    }

    const collectionParents = parents.join("~"); // parents for subcollection includes own key
    parents.pop();

    const bookParents = parents.join("~"); // parents for books collection does not include own key

    const collectionRows = collection.childCollections.map((c) => {
        if (c.urlKey === "language-chooser") {
            return <LanguageGroup />;
        }
        return (
            <RowOfPageCardsForKey
                key={c.urlKey}
                urlKey={c.urlKey}
                parents={collectionParents}
            />
        );
    });

    let booksComponent: React.ReactElement | null = null;
    switch (collection.layout) {
        default:
            //"by-level": I'd like to have this case here for clarity, but lint chokes
            booksComponent = (
                <LevelGroups collection={collection} parents={bookParents} />
            );
            break;
        case "no-books": // leave it null
            break;
        case "all-books": // untested
            booksComponent = (
                <CollectionGroup
                    collection={collection}
                    parents={bookParents}
                />
            );
            break;
        case "by-language":
            // enhance: may want to use reportBooksAndLanguages callback so we can insert
            // a string like "X books in Y languages" into our banner. But as yet the
            // ContentfulBanner has no way to do that.
            booksComponent = (
                <ByLanguageGroups titlePrefix="" filter={collection.filter} />
            );
            break;
        case "by-topic": // untested on this path, though ByTopicsGroup is used in AllResultsPage
            booksComponent = (
                <ByTopicsGroups collection={collection} parents={bookParents} />
            );
            break;
    }

    let banner: React.ReactElement | null = null;
    if (generatorTag) {
        if (collection.urlKey.startsWith("language:")) {
            // Currently we use a special header for generated language collections.
            // We should probaby generalize somehow if we get a second kind of generated collection.
            banner = (
                <CustomizableBanner
                    filter={collection.filter}
                    title={collection.label}
                    spec={getLanguageBannerSpec(generatorTag)}
                />
            );
        } else if (collection.urlKey.startsWith("topic:")) {
            // This is taken from the (obsolete?) CategoryPageWithDefaultLayout which we used to show for topics.
            // Probably not our final answer.
            banner = (
                <PublisherBanner
                    filter={collection.filter}
                    title={collection.title}
                    showTitle={true}
                    collectionDescription={<React.Fragment />}
                />
            );
        }
    } else {
        banner = <ContentfulBanner id={collection.banner} />;
    }

    return (
        <div>
            {banner}
            <ListOfBookGroups>
                {collectionRows}
                {booksComponent}
            </ListOfBookGroups>
        </div>
    );
};