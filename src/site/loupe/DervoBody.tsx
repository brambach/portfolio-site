import DervoDemo from '../cobalt/DervoDemo';
import { DERVO } from '../cobalt/copy';
import '../cobalt/cobalt.css';

/* Dervo's Home, rebuilt in HTML and looping (cobalt/DervoDemo.tsx), inside the cobalt frame its styles expect. */
export default function DervoBody() {
  return <div className="cb ch-dv"><DervoDemo label={DERVO.demo} /></div>;
}
