// The projects for the clean portfolio mockups (clean-e.html and clean-e-project.html). Not part of the site build.
// Facts are copied from src/projects/catalog.ts; captions come from the live study pages (DervoStudy, PortalStudy,
// LucidStudy, ArroStudy) or describe what the screenshot itself shows. Screenshots live in public/.
window.WORK = [
  {
    id: "dervo", name: "Dervo", line: "Run more agents than you can watch.", kind: "Mac app",
    category: "Product & Mac app", status: "Private beta · macOS",
    role: "Founder: product design, the Mac app, its backend and the website",
    intro: "A Mac app for running Claude Code and Codex side by side. It tells you what finished, what’s stuck and what needs you, so you can leave agents running and come back to a few sentences instead of four terminals.",
    decision: "Status comes from the record of what each run did, not from the agent’s account of itself. Catch up reads that record, and one request to Home finds the right thread or starts a new one.",
    engineering: "A Tauri shell in Rust with signed, notarized releases and signed updates, a React interface and a Python backend that runs Claude Code and Codex. When one agent hits its usage limit, the thread can continue in the other.",
    boundary: "Private beta for invited testers on Apple Silicon Macs. Screens show example projects. Parts of the app began from the open-source Buzz project.",
    hero: { src: "/projects/dervo/catch-up.jpg", title: "Come back to a few sentences.", text: "Catch up says what finished, what’s stuck and what needs you since you last looked. Answer one question and the thread carries on." },
    gallery: [
      { src: "/projects/dervo/thread.jpg", title: "It reads the record, not the agent’s account.", text: "Every run ends with what changed, what was checked, what wasn’t, and what’s next. Approving it commits the work." },
      { src: "/projects/dervo/sunrise.jpg", title: "A sunrise that rises as the run goes.", text: "The landing page rebuilds the product in HTML, over a dotted sunrise drawn in a shader. It echoes the progress dot in the app, and it’s where the light on this site comes from." },
    ],
  },
  {
    id: "integration-portal", name: "Integration portal", line: "Make the complex legible.", kind: "Employee work",
    category: "Product & engineering", status: "Anonymised employee work",
    role: "Interface design and frontend engineering, as an employee",
    intro: "An operational workspace for the people delivering HR and payroll integrations. Configuration, mapping, testing and ongoing support need to make sense together.",
    decision: "Organise the interface around the work someone needs to complete. The product story follows an integration through decisions and review rather than presenting disconnected administration screens.",
    engineering: "The source spans two portal generations. This case study uses fictional, redrawn examples to explain interface decisions without exposing company or customer records.",
    boundary: "Employer-owned work. Company, vendors and people are unnamed. Screens are redrawn with fictional data. Current production behavior isn’t demonstrated here.",
    hero: { src: "/projects/portal/hub.webp", title: "Whose move is it?", text: "The hub says whose turn it is, what’s left and what happens next, in one place." },
    gallery: [
      { src: "/projects/portal/today.png", title: "What needs a person?", text: "A ranked list turns operational state into a sentence and an action. Everything else stays quiet." },
      { src: "/projects/portal/monitoring.png", title: "What happened, and what’s next?", text: "When a sync fails, it says what broke, what’s safe and what a person can do about it." },
    ],
  },
  {
    id: "lucid", name: "Lucid", line: "From conversation to clarity.", kind: "In development",
    category: "Product & systems", status: "Product in development",
    role: "Product design and implementation",
    intro: "An integration workspace that follows a request into scope, specifications and delivery. The interface gives complex system relationships a readable shape.",
    decision: "Carry the same integration through each stage. Requirements, field mappings and review decisions should feel like parts of one continuous piece of work.",
    engineering: "The source includes a Next.js application, integration runtime work and design studies across conversation, scope, specification, builds and runs.",
    boundary: "Development work. Portfolio examples don’t execute integrations or connect to customer systems.",
    hero: { src: "/projects/lucid/spec.png" },
    gallery: [
      { src: "/projects/lucid/mapping.png", title: "Every value carries its source.", text: "The specification brings fields, transformations and risk into one readable document." },
    ],
  },
  {
    id: "arro", name: "Arro", line: "Every day forward. Together.", kind: "React Native",
    category: "Mobile & interaction", status: "React Native prototype",
    role: "Product design and mobile implementation",
    intro: "A family running ritual. A little encouragement, a shared trail and another reason to show up tomorrow.",
    decision: "Make showing up feel shared. Today’s activity, the weekly trail and milestones turn individual runs into a family story.",
    engineering: "The Expo and React Native prototype uses fixture data for the family, activity feed and milestones. Local interactions give the screens a rhythm before backend connections are added.",
    boundary: "Prototype with sample activity. No connected backend or Strava integration.",
    hero: { src: "/projects/arro/today-sample.png", tall: true, title: "A little encouragement.", text: "See who’s already been out and who still has today. There’s room for a cheer, without turning the family into a leaderboard." },
    gallery: [
      { src: "/projects/arro/trail-sample.png", tall: true, title: "Every day adds up.", text: "The weekly trail makes everyone’s effort visible. A rest day can belong in the story too." },
    ],
  },
  {
    id: "port", name: "Port", line: "A moment to close.", kind: "SwiftUI",
    category: "Native & sensory", status: "SwiftUI prototype",
    role: "Interaction design and native implementation",
    intro: "A small phone ritual with a clear ending. Hold to close, watch the screen compress, then leave it quiet.",
    decision: "Give stopping a physical feeling. A deliberate hold starts a brief compression, with a timed sound and haptic cue in the native implementation.",
    engineering: "SwiftUI views coordinate the hold and collapse. Shared preferences retain the closed state and refresh the widget.",
    boundary: "Native source inspected. The portfolio interaction is a browser interpretation, without native haptics or app blocking.",
    hero: { port: true, title: "Hold to close.", text: "Press and hold the circle to try a browser version of the hold. It plays the sound from the project." },
    gallery: [],
  },
  {
    id: "agentsky", name: "AgentSky", line: "A little closer to the cloud.", kind: "Design study",
    category: "Interface & motion", status: "Independent design study",
    role: "Interface design, frontend development and motion direction",
    intro: "An independent exploration of a cloud workspace for coding agents.",
    decision: "Make the request, the selected agent and the resulting files visible together. The interaction explains how the workspace fits together.",
    engineering: "The prototype sequences sample agent runs and workspace transfers. Changing agents resets the run, so old output never appears to belong to a new request.",
    boundary: "An independent concept. All runs and cloud transfers are illustrative.",
    hero: { src: "/project-lab/sky.png", pos: "50% 40%" },
    gallery: [
      { src: "/project-lab/cloud.png", title: "Your workspace, anywhere.", text: "A simulated handoff: the local session closes and the cloud workspace keeps the instructions, the files and the conversation." },
    ],
  },
];

// The small preview used in the list and on hover: the same picture the project page opens on, so one can grow into the other.
window.WORK_SHOT = p => p.hero.port
  ? '<div class="port-tile"><i class="ring"></i><span>Hold to close</span></div>'
  : `<img src="${p.hero.src}" alt="" ${p.hero.pos ? `style="--pos:${p.hero.pos}"` : ""}>`;
