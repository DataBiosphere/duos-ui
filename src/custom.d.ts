declare module '*.svg' {
    export const ReactComponent: React.FunctionComponent<
        React.SVGAttributes<SVGElement>
    >;

    const src: string;
    export default src;
}
