// ============================================================
//  EDIT THIS FILE — all personal content for the site lives here
// ============================================================
window.SITE_CONFIG = {
  name: "Sander NF",
  handle: "sandernf",
  role: "IT student & developer",
  location: "Norway",
  // Lines cycled by the typing effect in the hero
  taglines: [
    "Migrating Docker Swarm to Kubernetes.",
    "Turning messy data into insight with AI.",
    "Running a homelab on Proxmox.",
    "I use Arch, btw.",
  ],
  about: [
    "Hi, I'm Sander — an IT and media production student at Kuben VGS who loves coding, hardware and figuring out how things work under the hood.",
    "I've done IT internships at Statens Pensjonskasse, where I worked on moving services from Docker Swarm to Kubernetes, and at Spenn, where I used AI to turn large amounts of qualitative data into insight.",
    "In my spare time I build PCs, run a homelab, and tinker with microelectronics and 3D printing.",
  ],
  stats: [
    { value: "2", label: "IT internships" },
    { value: "3", label: "workplaces" },
    { value: "btw", label: "I use Arch" },
  ],
  skills: {
    languages: ["LUA", "JavaScript", "Python", "SQL"],
    frontend: ["HTML/CSS"],
    backend: ["Node.js", "REST"],
    infra: ["Docker", "Kubernetes (k8s)", "GitHub Actions", "Proxmox"],
    "data & ai": ["Snowflake", "Streamlit", "Jupyter Notebook"],
    tools: ["Git", "Linux (arch btw)", "Figma"],
  },
  // Each project gets its own page (project.html?p=<name>).
  // `link` is optional — leave it out for work that isn't public.
  // `details` = longer write-up shown on the project page.
  // `report` = the `place` of an experience entry whose reference letter is shown in a "report" tab.
  projects: [
    {
      name: "twitch-chat-overlay",
      description: "A chat box overlay for Twitch streams. Runs locally in Python and plugs into OBS Studio as an HTTP URL.",
      tech: ["Python", "HTTP", "OBS"],
      link: "https://github.com/SanderNF/Twitch-Chat",
      period: "Sep 2025 — now",
      details: [
        "A side project: a chat box overlay for Twitch streams that runs locally in Python.",
        "The overlay is served over HTTP, so it can be added straight into OBS Studio (or any streaming software) as a browser source URL.",
      ],
    },
    {
      name: "homelab",
      description: "An old PC running Proxmox, hosting VMs for a Minecraft server, a Palworld server and a web server. Out-of-band management via IP-KVM, a Cisco 16-port gigabit switch and an APC Smart-UPS.",
      tech: ["Proxmox", "Networking", "IP-KVM"],
      details: [
        "An old PC running Proxmox, a hypervisor for virtual machines. Among other things it hosts a Minecraft server, a Palworld server and a web server.",
        "The server has \"lights out\" management through an IP-KVM (internet protocol keyboard, video, mouse), so it can be restarted or reconfigured remotely if something goes wrong at the hardware level.",
        "It's connected through a Cisco WebView 16-port gigabit switch and backed by an APC Smart-UPS (uninterruptible power supply).",
      ],
    },
    {
      name: "support-insights",
      description: "Internship project at Spenn: used AI in Snowflake to categorise support requests and built a Streamlit dashboard comparing what the chatbot solves versus human agents.",
      tech: ["Snowflake", "AI", "Streamlit"],
      period: "Oct — Nov 2025",
      details: [
        "Spenn's Customer Care team handles a large volume of support requests, many of them answered by a chatbot. The team needed insight into which kinds of requests the chatbot solves compared to human agents, and a way to follow trends in what users contact them about.",
        "I structured all the qualitative support data using AI in Snowflake, then built a visualisation dashboard in Streamlit on top of it.",
        "The dashboard was built so the Customer Care lead can keep using it after the internship ended.",
      ],
      report: "Spenn",
    },
    {
      name: "interview-analysis",
      description: "Internship project at Spenn: structured unstructured user interviews and built analyses across themes, reusable for future interviews.",
      tech: ["Snowflake", "AI", "Python"],
      period: "Oct — Nov 2025",
      details: [
        "Spenn regularly runs user interviews to learn how people experience the product, but the result is very unstructured data that's hard to analyse.",
        "I structured the interview material and built analyses across themes, for example what users see as \"the value of Spenn\", so stakeholders can understand the main findings without reading every interview.",
        "The solution works for interviews that have already been done and can be reused for future ones.",
        "At the end of the internship I presented both Spenn projects to the whole tech department.",
      ],
      report: "Spenn",
    },
  ],
  experience: [
    {
      period: "Jan — Feb 2026",
      title: "IT intern (3 weeks)",
      place: "Statens Pensjonskasse",
      text: "Worked on migrating from Docker Swarm to Kubernetes (k8s), and on automated testing in GitHub Actions. Mostly worked independently, taking part in weekly team meetings. Reference available on request.",
    },
    {
      period: "Oct — Nov 2025",
      title: "IT intern (3 weeks)",
      place: "Spenn",
      text: "Automated qualitative data analysis using AI. Worked mostly independently in Snowflake (Jupyter Notebook), and presented both cases to the whole tech department at the end.",
      // shown as an expandable box under the entry
      reference: {
        from: "Pål, Spenn",
        language: "Norwegian",
        sections: [
          { heading: "Referanserapport", text: "Praksisperioden hos Spenn - 20. okt. - 6. nov. 2025. Jeg har gleden av å gi en referanse for Sander, som har hatt praksisplass hos oss i Spenn høsten 2025. I praksisperioden har Sander arbeidet med to caser innen dataanalyse og bruk av AI, og han har levert resultater av svært høy kvalitet." },
          { heading: "Case 1: Analyse av supporthenvendelser i Snowflake og Streamlit", text: "Sander fikk ansvar for å tolke og strukturere store mengder kvalitativ data fra våre supporthenvendelser. Customer Care-teamet håndterer et betydelig volum av henvendelser, hvor en stor andel besvares av chatboten vår. Vi hadde behov for innsikt i hvilke kategorier henvendelser chatboten løser, sammenlignet med ekte agenter, samt mulighet til å følge trender i hva brukerne kontakter oss om.\nFor å løse dette strukturerte Sander all kvalitativ data ved hjelp av AI i Snowflake, og bygget deretter en visualiseringsløsning i Streamlit. Løsningen ble svært godt mottatt av interessentene, og var bygget på en måte som gjør at Customer Care-lederen kan bruke produktet videre etter at Sander er ferdig hos oss. Arbeidet ble levert på en utmerket måte, både teknisk og funksjonelt." },
          { heading: "Case 2: Analyse av brukerintervjuer", text: "Spenn gjennomfører jevnlig brukerintervjuer for å samle innsikt om hvordan produktet vårt oppleves. Dette er svært ustrukturert data, som er krevende å analysere. Sander tok eierskap til oppgaven, strukturerte datamaterialet og utviklet analyser på tvers av temaer – blant annet hva brukerne opplever som «verdien av Spenn». Resultatet gjorde det enkelt for interessentene å forstå hovedfunnene uten å måtte lese gjennom alle intervjuene selv. Dette gir oss økt forståelse av innholdet i intervjuene som gjennomføres, både de som allerede er gjennomført, men løsningen kan også brukes for fremtidige intervjuer." },
          { heading: "Presentasjon og formidling", text: "Mot slutten av praksisperioden presenterte Sander begge casene for hele tech avdelingen og andre nysgjerrige kolleger. Presentasjonen var imponerende – Sander fremstod trygg, kunnskapsrik og godt forberedt. Han svarte grundig og sikkert på alle spørsmål som kom, og demonstrerte tydelig at han forstod løsningene i dybden, ikke bare på et overfladisk nivå. Dette er særlig viktig i dagens AI-landskap, hvor forståelse av teknologien bak løsningene er avgjørende." },
          { heading: "Personlige egenskaper og samarbeidsevner", text: "Sander oppfattes som en svært nysgjerrig og lærevillig person, med evne til å fordype seg i temaer som interesserer ham. Han tok aktiv del i tekniske diskusjoner med erfarne utviklere og bidro med gjennomtenkte innspill. Han er ikke en passiv deltaker, men viser engasjement og initiativ. Når han løste casene satt han seg godt inn i hvordan AI modellene han benyttet fungerte, fordeler og ulemper.\nI tillegg er Sander punktlig, pålitelig og sosialt inkluderende. Han spør når det er noe han lurer på, og er rask til å bidra også i uformelle settinger som rundt lunsjbordet. Han etterlater et inntrykk av å være en solid og hyggelig student." },
          { heading: "Oppsummering", text: "Sander har levert en praksisperiode av svært høy kvalitet. Han viser teknisk forståelse, evne til å lære raskt, god formidlingsevne og gode samarbeidsegenskaper. Basert på det han har vist hos oss, mener jeg Sander har et stort potensial videre i sin utdanning og karriere." },
        ],
      },
    },
    {
      period: "Jan 2025",
      title: "Job shadowing (6 days)",
      place: "Norwegian Air Shuttle",
      text: "3 days in operations, 1 day with UI/UX and 2 days with the development department. Got an inside look at setting up and installing laptops, and got to fix a time synchronisation bug in the backend.",
    },
    {
      period: "2024 — 2028",
      title: "Information Technology and Media Production",
      place: "Kuben VGS",
      text: "Upper secondary school.",
    },
    {
      period: "2020 — 2024",
      title: "Lower secondary school",
      place: "Morellbakken ungdomsskole",
      text: "With programming as an elective.",
    },
  ],
  contact: {
    email: "you@example.com",
    github: "https://github.com/SanderNF",
    linkedin: "https://www.linkedin.com/in/your-profile",
  },
};
