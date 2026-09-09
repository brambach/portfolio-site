export type ProjectId = 'agentsky' | 'dervo' | 'lucid' | 'arro' | 'port' | 'integration-portal';
export type Project = {
  id: ProjectId;
  name: string;
  line: string;
  category: string;
  status: string;
  role: string;
  introduction: string;
  decision: string;
  engineering: string;
  boundary: string;
};
export type ArchiveAvailability = 'recording' | 'source-note' | 'withheld-note' | 'concept-note';
export type ArchiveItem = {
  name: string;
  kind: string;
  text: string;
  availability: ArchiveAvailability;
  recordingId?: 'crypto' | 'devmetrics';
};
export const projects: Project[] = [
  {id:'agentsky', name:'AgentSky', line:'A little closer to the cloud.', category:'Interface & motion', status:'Independent design study', role:'Interface design, frontend development and motion direction', introduction:'An independent exploration of a cloud workspace for coding agents.', decision:'Make the request, the selected agent and the resulting files visible together. The interaction explains how the workspace fits together.', engineering:'The prototype sequences sample agent runs and workspace transfers. Changing agents resets the run, so old output never appears to belong to a new request.', boundary:'An independent concept. All runs and cloud transfers are illustrative.'},
  {id:'dervo', name:'Dervo', line:'Come back knowing.', category:'Product & desktop', status:'Local product prototype', role:'Product design and implementation', introduction:'A workspace for returning to work with coding agents. What changed, what supports it, and what needs your decision should be readable in one place.', decision:'Keep the decision beside its evidence. A returning person needs enough context to make the next call without reconstructing the whole conversation.', engineering:'The project explores shared state between a person and their agents, project selection and reviewable evidence. Interface experiments test how those pieces read together.', boundary:'Local prototype and design experiments. Demonstrations use sample work.'},
  {id:'lucid', name:'Lucid', line:'From conversation to clarity.', category:'Product & systems', status:'Product in development', role:'Product design and implementation', introduction:'An integration workspace that follows a request into scope, specifications and delivery. The interface gives complex system relationships a readable shape.', decision:'Carry the same integration through each stage. Requirements, field mappings and review decisions should feel like parts of one continuous piece of work.', engineering:'The source includes a Next.js application, integration runtime work and design studies across conversation, scope, specification, builds and runs.', boundary:'Development work. Portfolio examples don’t execute integrations or connect to customer systems.'},
  {id:'arro', name:'Arro', line:'Every day forward. Together.', category:'Mobile & interaction', status:'React Native prototype', role:'Product design and mobile implementation', introduction:'A family running ritual. A little encouragement, a shared trail and another reason to show up tomorrow.', decision:'Make showing up feel shared. Today’s activity, the weekly trail and milestones turn individual runs into a family story.', engineering:'The Expo and React Native prototype uses fixture data for the family, activity feed and milestones. Local interactions give the screens a rhythm before backend connections are added.', boundary:'Prototype with sample activity. No connected backend or Strava integration.'},
  {id:'port', name:'Port', line:'A moment to close.', category:'Native & sensory', status:'SwiftUI prototype', role:'Interaction design and native implementation', introduction:'A small phone ritual with a clear ending. Hold to close, watch the screen compress, then leave it quiet.', decision:'Give stopping a physical feeling. A deliberate hold starts a brief compression, with a timed sound and haptic cue in the native implementation.', engineering:'SwiftUI views coordinate the hold and collapse. Shared preferences retain the closed state and refresh the widget.', boundary:'Native source inspected. The portfolio interaction is a browser interpretation, without native haptics or app blocking.'},
  {id:'integration-portal', name:'Integration portal', line:'Make the complex legible.', category:'Product & engineering', status:'Anonymised employee work', role:'Interface design and frontend engineering, as an employee', introduction:'An operational workspace for the people delivering HR and payroll integrations. Configuration, mapping, testing and ongoing support need to make sense together.', decision:'Organise the interface around the work someone needs to complete. The product story follows an integration through decisions and review rather than presenting disconnected administration screens.', engineering:'The source spans two portal generations. This case study uses fictional, redrawn examples to explain interface decisions without exposing company or customer records.', boundary:'Employer-owned work. Company, vendors and people are unnamed. Screens are redrawn with fictional data. Current production behavior isn’t demonstrated here.'},
];
export const projectById = (id: string | null) => projects.find(project => project.id === id);
export function projectFromPath() { return projectById(location.pathname.split('/')[2] || ''); }
export const archive: ArchiveItem[] = [
  {name:'Crypto Command Center',kind:'Recorded prototype',availability:'recording',recordingId:'crypto',text:'A spatial market interface with a 3D globe and orbiting assets. Source and a historical demonstration survive. Current data connections haven’t been tested.'},
  {name:'DevMetrics',kind:'Recording recovered',availability:'recording',recordingId:'devmetrics',text:'A GitHub activity dashboard with commits, streaks and charts. The recording survives, but its implementation source wasn’t recovered.'},
  {name:'Throughline',kind:'Application source',availability:'source-note',text:'Turning work across Slack and GitHub into a readable update. Dashboard, connection flows and draft generation exist in source. External services haven’t been verified.'},
  {name:'Trace',kind:'Local tool source',availability:'source-note',text:'A watcher, parser, database and dashboard for coding-session context. Source survives. No fresh runtime verification.'},
  {name:'Bryce OS',kind:'Personal application',availability:'withheld-note',text:'Personal tools, watchers and schedules organised around one person. Captures need isolated sample data, so private workspace records stay out of this collection.'},
  {name:'Bryce Digital',kind:'Earlier website work',availability:'source-note',text:'Earlier brand, 3D and motion experiments. Two site versions and a historical film belong to the same project family.'},
  {name:'SideQuest',kind:'Product concept',availability:'concept-note',text:'An adventure and memory-log idea with product documents and visual studies. The native entry screen is a scaffold, not a completed app.'},
  {name:'Financial transaction classification',kind:'Team research report',availability:'source-note',text:'A team study with Brian Ly and Kien Tu. Bryce’s report contribution covers SVM implementation, kernel tuning and one-vs-rest classification. Source and notebooks weren’t recovered, and results haven’t been reproduced.'},
  {name:'Morning Triage Board',kind:'HTML study',availability:'source-note',text:'A compact morning view grouping mail, messages, calendar and notes. A standalone artifact survives. Connector operation hasn’t been verified.'},
  {name:'Studio website',kind:'Design study',availability:'concept-note',text:'A separate exploration of typography, motion and the presentation of operational software.'},
];
