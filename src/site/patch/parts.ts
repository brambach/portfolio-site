/** Sets the browser bar to the newsprint while a patch page is up. */
export function paintNewsprint() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const before = meta?.content;
  if (meta) meta.content = '#fbf3df';
  return () => { if (meta && before) meta.content = before; };
}
