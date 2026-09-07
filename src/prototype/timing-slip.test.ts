import {expect,it} from 'vitest';
import {challengeLink,timingSlip} from './timing-slip';
it('escapes names in downloadable artwork and includes the actual time',()=>{
 const svg=timingSlip('<script>&"',41050);
 expect(svg).not.toContain('<script>');expect(svg).toContain('&lt;script&gt;&amp;&quot;');
 expect(svg).toContain('0:41.050');
});
it('encodes the run ID without accepting a different destination',()=>{
 expect(challengeLink('a&name=fake')).toBe('https://brycerambach.com/?challenge=a%26name%3Dfake');
});
