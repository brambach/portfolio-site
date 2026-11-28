import { ArrowLeft, ArrowRight } from '../cobalt/parts';
import { NAME } from '../cobalt/copy';
import { DotNumber } from '../dotNumber';
import { homeHref } from '../routes';
import { CaseTop, usePage } from './caseStudy';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import '../motion.css';
import '../cobalt/cobalt.css';
import './teammate.css';

/* An address that doesn't exist, in the black and white look: the case studies' frame and type on white paper, the
   number set in the same dots as the site's icon (the zero drawn as rings), and two ways back in. */

export default function NotFound() {
  usePage(`not found, ${NAME.toLowerCase()}`);
  const search = location.search;
  return <div className="cb bw tm nf">
    <div className="wrap project">
      <CaseTop />
      <main className="t-col nf-main">
        <div className="t-hero">
          <p className="t-label">404 · Not found</p>
          <DotNumber className="nf-dots" zero="ring" />
          <h1>Nothing here.</h1>
          <p className="t-lede">This address doesn’t go anywhere. It might be an old link, or a typo.</p>
          <ul className="nf-ways">
            <li><a href={homeHref(search)} className="back"><ArrowLeft />Back to the home page</a></li>
            <li><a href={homeHref(search, '#work')} className="nf-go">See the work<ArrowRight size={12} /></a></li>
          </ul>
        </div>
      </main>
    </div>
  </div>;
}
