import {describe,it,expect} from 'vitest';
import {visitorEvent} from './SiteAnalytics';

describe('visitor analytics',()=>{
  it('keeps the page and campaign while dropping unrelated parameters',()=>{
    expect(visitorEvent({type:'pageview',url:'https://www.brycerambach.com/projects?utm_source=x&name=private#details'})?.url).toBe('https://www.brycerambach.com/projects?utm_source=x');
  });
  it.each(['http://localhost:3003/','https://preview.vercel.app/','https://brycerambach.com/?profile=journey'])( 'excludes review traffic at %s',url=>{
    expect(visitorEvent({type:'pageview',url})).toBeNull();
  });
});
