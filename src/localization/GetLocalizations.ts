import UseAxios from "axios-hooks";
import { useMemo, useState } from "react";
import { setUserInterfaceTag } from "../model/Language";
import l10nStringsFileNames from "./crowdin-file-names.json";
import * as Sentry from "@sentry/browser";
import englishCodeStrings from "../translations/BloomLibrary.org/Code Strings.json";
import englishStatsStrings from "../translations/BloomLibrary.org/Stats Strings.json";
import englishTopicsAndFeaturesStrings from "../translations/BloomLibrary.org/Topics And Features.json";

export interface IStringMap {
    [id: string]: string;
}

let static_translationsToCurrentLanguage: IStringMap = {};

// This is an alternative to doing `const l10=useIntl(); l10.formatMessage()`,
// for places where we are not in react component and so can't use that hook. It
// bypasses the React-Intl, which is fine because we aren't really using that as
// anything but a glorified lookup table; we aren't yet using its pluralizing
// and other functions. If we did need those, there are other libraries that can
// provide those functions to us.
export function getTranslation(id: string, defaultMessage: string) {
    return static_translationsToCurrentLanguage[id] || defaultMessage;
}

interface IFilenamesToL10nJson {
    [id: string]: IStringMap;
}

interface ILocalizations {
    closestLanguage: string;
    stringsForThisLanguage: IStringMap | undefined;
}

export function useGetLocalizations(
    // explicitLanguageSetting is a language that the user has selected with our
    // UI (not the browser's). If it is undefined  (this would be the normal
    // case) or if we can't provide it for some reason we'll go and look at
    // their browser languages.
    explicitLanguageSetting: string // BCP 47
): ILocalizations {
    const [translationFiles] = useState<IFilenamesToL10nJson>({});

    const userInterfaceLanguageTag = useMemo<string>(() => {
        return chooseLanguageWeAreGoingToAskFor(
            explicitLanguageSetting || "en"
        );
    }, [explicitLanguageSetting]);

    setUserInterfaceTag(userInterfaceLanguageTag);

    let countStillWaiting = 0;

    let justUseEnglish = userInterfaceLanguageTag === "en";

    for (const filename of l10nStringsFileNames) {
        // NOTE that we're using a different "UseAxios" here; this one has this `manual` option we need
        // in order to skip trying to download English without violating the rule of hooks.
        const [{ response: jsonResponse, error, loading }] = UseAxios(
            {
                url: `/translations/${userInterfaceLanguageTag}/BloomLibrary.org/${encodeURIComponent(
                    filename
                )}`,
                method: "GET",
            },
            {
                manual: userInterfaceLanguageTag === "en", // true means don't actually do the query (but still be rule-of-hooks compatible)
            }
        );

        if (loading) {
            countStillWaiting++;
        }
        if (
            error &&
            // crowdin doesn't give us these because we only enable it for some languages
            filename !== "Contentful Bible Terms.json"
        ) {
            justUseEnglish = true;
            // this will happen when we ask for a language that is missing at least one of the files.
            if (error.response?.status === 404) {
                console.warn(
                    `Could not find at least one localization file for ${userInterfaceLanguageTag}. Will fall back to English.`
                );
            } else {
                console.error(error);
                Sentry.captureException(error);
            }
        }
        const translationsJson: any =
            jsonResponse && jsonResponse["data"] ? jsonResponse["data"] : "";
        if (translationsJson && !translationFiles[filename]) {
            translationFiles[filename] = getJsonLocalizations(translationsJson);
        }
    }

    if (justUseEnglish) {
        static_translationsToCurrentLanguage = {};
        return {
            closestLanguage: userInterfaceLanguageTag,
            // Note, the system works perfectly well if we just set this to {}.
            // When we're using localhost, we go ahead and load the strings only
            // so that we can detect strings that have not been placed in these
            // files by a developer yet and print out an error on the console.
            stringsForThisLanguage:
                window.location.hostname === "localhost"
                    ? {
                          ...getJsonLocalizations(englishCodeStrings),
                          ...getJsonLocalizations(englishStatsStrings),
                          ...getJsonLocalizations(
                              englishTopicsAndFeaturesStrings
                          ),
                      }
                    : {},
        };
    }
    if (countStillWaiting > 0) {
        return {
            closestLanguage: userInterfaceLanguageTag,
            stringsForThisLanguage: undefined,
        };
    }
    let translations: IStringMap = {};

    for (const filename of l10nStringsFileNames) {
        translations = { ...translations, ...translationFiles[filename] };
    }

    static_translationsToCurrentLanguage = translations;
    return {
        closestLanguage: userInterfaceLanguageTag,
        stringsForThisLanguage: translations,
    };
}

// Here we are transforming "Chrome JSON" format into the key:value format
// expected by our L10n framework Note that if we did this in crowdin-sync
// instead, we could avoid the cost of transporting any descriptions, which are
// unused at runtime.
function getJsonLocalizations(json: any): IStringMap {
    const translations: IStringMap = {};
    Object.keys(json).forEach((k) => {
        translations[k] = json[k].message;
    });
    return translations;
}

function chooseLanguageWeAreGoingToAskFor(
    preferredLanguageTag: string
): string {
    // Previously, when Crowdin was sometimes providing region codes as part of the
    // language tags, this logic was much more complex. Now that we are asking the CLI
    // to give us only the language subtag, we can simplify to this:

    return preferredLanguageTag.split("-")[0];
}

// // this is BCP 47
// // Enhance: the browser actually provides an ordered list of preferences. So then
// // someone who would like Portuguese but can settle for Spanish could get that.
// export function getListOfPreferredLanguages(): readonly string[] {
//     return navigator.languages && navigator.languages.length
//         ? navigator.languages
//         : [navigator.language] ?? ["en"];
// }
