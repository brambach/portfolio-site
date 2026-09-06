import {email} from '../lib/site';
export const linkedInUrl='https://www.linkedin.com/in/bryce-rambach/';
export const xUrl='https://x.com/brycerambach';
export function ContactLinks(){
  return <nav className="contact-links" aria-label="Find Bryce"><a href={`mailto:${email}`}>Email ↗</a>{xUrl&&<a href={xUrl} target="_blank" rel="noreferrer">X ↗</a>}<a href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a></nav>;
}
