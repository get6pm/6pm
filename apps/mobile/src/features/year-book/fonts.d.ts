/** Metro bundles an imported font file as an asset and hands the code its numeric id. */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
