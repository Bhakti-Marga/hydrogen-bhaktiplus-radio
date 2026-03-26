export interface DetailsProps {
    title?: string;
    /** HTML-formatted description, rendered via dangerouslySetInnerHTML */
    descriptionHtml?: string | null;
    info?: DetailsInfo[];
}

export interface DetailsInfo {
    label: string;
    value: string[];
}
