/** Metro bundles an imported image as an asset and hands the code its numeric id. */
declare module '*.png' {
  const asset: number;
  export default asset;
}
