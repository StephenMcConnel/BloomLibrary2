import React from "react";
import { BookGroup } from "./BookGroup";
import { css } from "emotion";
import { IFilter } from "../IFilter";
import { PublisherBanner } from "./PublisherBanner";
import { useTopicList } from "./useQueryBlorg";
import { BannerContents, LanguageBanner, ProjectBanner } from "./Banners";

export const CategoryPage: React.FunctionComponent<{
    title: string;
    filter: IFilter;
}> = props => (
    <>
        <BannerContents
            title={props.title}
            about="some about"
            bookCountMessage="{0}  books"
            filter={props.filter}
        />
        <ul className={"pageResults"}>
            <BookGroup title={`All books`} filter={props.filter} />
        </ul>
    </>
);

export const LanguagePage: React.FunctionComponent<{
    title: string;
    filter: IFilter;
}> = props => (
    <>
        <LanguageBanner filter={props.filter} title={props.title} />
        <ul className={"pageResults"}>
            <BookGroup
                title={`Featured ${props.filter.language} books.`}
                filter={{
                    ...props.filter,
                    ...{ otherTags: "bookshelf:Featured" }
                }}
            />
            <BookGroup
                title="Most Recent"
                filter={props.filter}
                order={"-createdAt"}
            />
            <BookGroupForEachTopic filter={props.filter} />
            <BookGroup
                title={`All ${props.filter.language} books.`}
                filter={props.filter}
            />
        </ul>
    </>
);
export const ProjectPage: React.FunctionComponent<{
    title: string;
    filter: IFilter;
}> = props => (
    <>
        <ProjectBanner filter={props.filter} title={props.title} />
        <ul className={"pageResults"}>
            <BookGroupForEachTopic filter={props.filter} />
        </ul>
    </>
);
export const BookGroupForEachTopic: React.FunctionComponent<{
    filter: IFilter;
}> = props => {
    const { response, loading, error, reFetch } = useTopicList();
    if (response) {
        console.log(response);
        return (
            <>
                {response.data["results"].map((tag: any) => {
                    if (tag.name.split(":")[0] === "topic") {
                        const topic = tag.name.split(":")[1];
                        return (
                            <BookGroup
                                title={`${topic} books`}
                                filter={{
                                    ...props.filter,
                                    ...{ topic: topic }
                                }}
                            />
                        );
                    } else return <></>;
                })}

                {/* TODO: currently the above will show some books as "NoTopic" books. But the vast majority of books without a top
             do not have topic:NoTopic. There isn't an obvious way of writing a ParseServer query to get a subset of
             books (e.g. workshop) that also do not have any topics. We could a) do that on client b) custom function on server
             or c) walk the Library and insert "NoTopic" wherever it is missing.
            */}
            </>
        );
    } else return <>"waiting for topics"</>;
};

// export const AfricaStoryBookPage: React.FunctionComponent = () => {
//     return (
//         <div className={blackOnWhite}>
//             <PublisherBanner logoUrl="https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/African_Storybook_logo_blue.png/150px-African_Storybook_logo_blue.png" />
//             <ul>
//                 <BookGroup
//                     title="African Storybook Project Books in Bloom Format"
//                     filter={{ otherTags: "bookshelf:African Storybook" }}
//                 />
//             </ul>
//         </div>
//     );
// };
// export const BookDashPage: React.FunctionComponent = () => {
//     return (
//         <div className={blackOnWhite}>
//             <PublisherBanner logoUrl="https://allchildrenreading.org/wordpress/wp-content/uploads/2017/04/book-dash-logo-full-colour_full-transparency-300x149.png" />
//             <ul>
//                 <BookGroup
//                     title="Book Dash Books in Bloom Format"
//                     filter={{ otherTags: "bookshelf:Book Dash" }}
//                 />
//             </ul>
//         </div>
//     );
// };

// export const PrathamPage: React.FunctionComponent = () => {
//     return (
//         <div className={blackOnWhite}>
//             <PublisherBanner logoUrl="https://prathambooks.org/wp-content/uploads/2018/04/Logo-black.png" />
//             <ul>
//                 <BookGroup
//                     title="Pratham Level 1 Books"
//                     filter={{ otherTags: "bookshelf:Pratham" }}
//                 />
//                 <BookGroup
//                     title="Pratham Level 2 Books"
//                     filter={{ otherTags: "bookshelf:Pratham" }}
//                 />
//                 <BookGroup
//                     title="Pratham Level 3 Books"
//                     filter={{ otherTags: "bookshelf:Pratham" }}
//                 />
//             </ul>
//         </div>
//     );
// };