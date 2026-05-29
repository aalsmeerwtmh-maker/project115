// Type declaration for .sql files imported as strings.
// babel-plugin-inline-import transforms these imports into string literals at build time.
declare module '*.sql' {
  const content: string;
  export default content;
}
