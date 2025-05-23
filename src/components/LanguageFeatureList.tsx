import { css } from "@emotion/react";

import React, { useState } from "react";
import { IBasicBookInfo } from "../connection/LibraryQueryHooks";
import {
    getFeaturesAvailableForOneLanguageOfBook,
    featureIconHeight,
} from "./FeatureHelper";
import { getUniqueLanguages } from "./LanguageLink";
import { useTheme } from "@material-ui/core";
import TruncateMarkup from "react-truncate-markup";
import { ILanguage, getDisplayNamesForLanguage } from "../model/Language";
import { commonUI } from "../theme";
import { useShowTroubleshootingStuff } from "../Utilities";

interface IProps {
    basicBookInfo: IBasicBookInfo;
    contextLangTag?: string;
}
// Displays a list of the languages of the book. For each language it shows its autonym,
// and if that is different from its English name it shows the English name, too.
// Then, if any of the language-dependent features occur in the book for that language, it shows
// the appropriate icon.
// Currently the list is truncated at about two lines high. We may want to make that configurable.
// Enhance: consider truncating more cleanly after the last language name that fits,
// and showing some indication that there are more (ideally, a count of how many more).
export const LanguageFeatureList: React.FunctionComponent<IProps> = (props) => {
    const theme = useTheme();
    const [showTroubleshootingStuff] = useShowTroubleshootingStuff();

    // Figure out what to show in the language list area.
    // It's a mix of simple text nodes and possibly feature icons.
    const uniqueLanguages = getUniqueLanguages(props.basicBookInfo.languages);

    function moveLanguageToFront(langList: ILanguage[], frontLangTag?: string) {
        if (frontLangTag) {
            const frontLangIndex = langList.findIndex(
                (language) => language.isoCode === frontLangTag
            );
            if (frontLangIndex >= 0) {
                const frontLang = langList.splice(frontLangIndex, 1)[0];
                langList.unshift(frontLang);
            }
        }
    }
    // First, put L1 at the front of the list
    moveLanguageToFront(uniqueLanguages, props.basicBookInfo.lang1Tag);

    // If contextLangTag is present, put it first in the list, even before L1
    moveLanguageToFront(uniqueLanguages, props.contextLangTag);

    function getLanguageElements(showOneNamePerLanguage: boolean) {
        const languageElements: any[] = [];
        for (const language of uniqueLanguages) {
            const languageDisplayNames = getDisplayNamesForLanguage(language);
            const name = showOneNamePerLanguage
                ? languageDisplayNames.primary
                : languageDisplayNames.combined;
            if (
                showTroubleshootingStuff &&
                props.basicBookInfo.lang1Tag === language.isoCode
            ) {
                languageElements.push(<b>{name}</b>); // for evaluating duplication removal
            } else {
                languageElements.push(name);
            }

            // Looking for features that the book has with this language code attached,
            // such as talkingBook:en
            const langFeatures = getFeaturesAvailableForOneLanguageOfBook(
                props.basicBookInfo.features,
                language.isoCode
            );
            // Now make the actual icons, one for each langFeature that occurs for
            // the current language.
            for (const feature of langFeatures) {
                languageElements.push(
                    feature.icon({
                        key: language.isoCode + feature.featureKey,
                        fill: theme.palette.secondary.main,
                        style: {
                            height: featureIconHeight + "px",
                            width: featureIconHeight + "px",
                            marginLeft: "2px",
                        },
                    })
                );
            }
            languageElements.push(", ");
        }
        languageElements.pop(); // remove last separator (if any)
        return languageElements;
    }
    const [languageElementsDisplay, setLanguageElementsDisplay] = useState<
        Array<string | JSX.Element>
    >(getLanguageElements(false));

    return (
        <div
            css={css`
                color: ${commonUI.colors.minContrastGray};
                font-size: 9pt;
                margin-top: auto;
                padding: 3px;
                overflow: hidden;
            `}
        >
            <TruncateMarkup
                lines={2}
                // Per the docs:
                // To prevent infinite loops, onTruncate callback gets called only after the
                // initial run (on mount), any subsequent props/children updates will trigger a recomputation,
                // but onTruncate won't get called for these updates.
                onTruncate={(wasTruncated: boolean) => {
                    if (wasTruncated) {
                        // If the normal list which includes autonyms gets truncated,
                        // replace it with a list which has one name per language.
                        setLanguageElementsDisplay(getLanguageElements(true));
                    }
                }}
            >
                <span>{languageElementsDisplay}</span>
            </TruncateMarkup>
        </div>
    );
};
