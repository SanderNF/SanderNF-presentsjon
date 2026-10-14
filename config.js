// ============================================================
//  EDIT THIS FILE — all personal content for the site lives here
// ============================================================
// Translatable text is written as { en: "…", no: "…" }. A plain string is used
// for every language. The 1337 language is generated from the English text.
window.SITE_CONFIG = {
  name: "Sander NF",
  handle: "sandernf",
  role: { en: "IT student & developer", no: "IT-elev og utvikler" },
  location: { en: "Norway", no: "Norge" },
  // Lines cycled by the typing effect in the hero
  taglines: [
    { en: "Migrating Docker Swarm to Kubernetes.", no: "Migrerer Docker Swarm til Kubernetes." },
    { en: "Turning messy data into insight with AI.", no: "Gjør rotete data om til innsikt med KI." },
    { en: "Running a homelab on Proxmox.", no: "Kjører en homelab på Proxmox." },
    { en: "I use Arch, btw.", no: "Jeg bruker Arch, btw." },
  ],
  about: [
    { en: "Hi, I'm Sander — an IT and media production student at Kuben VGS who loves coding, hardware and figuring out how things work under the hood.", no: "Hei, jeg er Sander — elev på informasjonsteknologi og medieproduksjon ved Kuben VGS. Jeg elsker koding, maskinvare og å finne ut hvordan ting fungerer under panseret." },
    { en: "I've done IT internships at Statens pensjonskasse, where I worked on their new development platform with Docker, Kubernetes and Go, and at Spenn, where I used AI to turn large amounts of qualitative data into insight.", no: "Jeg har hatt IT-praksis hos Statens pensjonskasse, der jeg jobbet med deres nye utviklingsplattform med Docker, Kubernetes og Go, og hos Spenn, der jeg brukte KI til å gjøre store mengder kvalitative data om til innsikt." },
    { en: "In my spare time I build PCs, run a homelab, tinker with microelectronics and 3D printing, and enjoy photography.", no: "På fritiden bygger jeg PC-er, drifter en homelab, tukler med mikroelektronikk og 3D-printing, og driver med fotografering." },
  ],
  stats: [
    { value: "2", label: { en: "IT internships", no: "IT-praksiser" } },
    { value: "3", label: { en: "workplaces", no: "arbeidsplasser" } },
    { value: "btw", label: { en: "I use Arch", no: "jeg bruker Arch" } },
  ],
  skills: {
    languages: ["LUA", "JavaScript", "Python", "SQL", "Go"],
    frontend: ["HTML/CSS"],
    backend: ["Node.js", "REST"],
    infra: ["Docker", "Kubernetes (k8s, kind)", "GitHub Actions", "Proxmox"],
    "data & ai": ["Snowflake", "Streamlit", "Jupyter Notebook"],
    tools: ["Git", "Linux (arch btw)", "JIRA", "Confluence", "Figma"],
  },
  // GitHub stat cards from github-stats-extended, through your own endpoint.
  // Colours and language are added automatically to match the site. Set to null to hide the cards.
  // Without an Access-Control-Allow-Origin header on the endpoint, plain <img> cards are shown instead.
  githubStats: {
    endpoint: "http://sandernf.xyz:8000/githubstats/api",
    username: "SanderNF",
    // "native" = drawn in the site's style, "svg" = the original cards inlined (both need CORS on the endpoint)
    display: "native",
    stats: { show_icons: "true", hide_rank: "true" },
    topLangs: { langs_count: "5", hide: "css", layout: "compact" },
  },
  // Each project gets its own page (project.html?p=<name>).
  // `link` is optional — leave it out for work that isn't public.
  // `details` = longer write-up shown on the project page.
  // `report` = the `place` of an experience entry whose reference letter is shown in a "report" tab.
  // `files` = Markdown files (paths from the site root) shown as extra tabs, e.g. ["networkmap.md"].
  //   Use { en: "…", no: "…" } for a file that has a Norwegian version.
  projects: [
    {
      name: "twitch-chat-overlay",
      description: { en: "A chat box overlay for Twitch streams. Runs locally in Python and plugs into OBS Studio as an HTTP URL.", no: "En chatboks-overlay for Twitch-strømmer. Kjører lokalt i Python og legges inn i OBS Studio som en HTTP-URL." },
      tech: ["Python", "HTTP", "OBS"],
      link: "https://github.com/SanderNF/Twitch-Chat",
      period: { en: "Sep 2025 — now", no: "sep. 2025 — nå" },
      details: [
        { en: "A side project: a chat box overlay for Twitch streams that runs locally in Python.", no: "Et fritidsprosjekt: en chatboks-overlay for Twitch-strømmer som kjører lokalt i Python." },
        { en: "The overlay is served over HTTP, so it can be added straight into OBS Studio (or any streaming software) as a browser source URL.", no: "Overlayen serveres over HTTP, så den kan legges rett inn i OBS Studio (eller annen strømmeprogramvare) som en nettleserkilde-URL." },
      ],
    },
    {
      name: "homelab",
      description: { en: "An old PC running Proxmox, hosting a Minecraft server, a Palworld server, a web server, Ollama, Pi-hole and TrueNAS. Out-of-band management via PiKVM, a network of UniFi and Cisco switches (including a 48-port Catalyst PoE), and an APC Smart-UPS.", no: "En gammel PC som kjører Proxmox, med en Minecraft-server, en Palworld-server, en webserver, Ollama, Pi-hole og TrueNAS. Fjernstyring via PiKVM, et nettverk av UniFi- og Cisco-switcher (blant annet en 48-ports Catalyst PoE) og en APC Smart-UPS." },
      tech: ["Proxmox", "Networking", "PiKVM", "UniFi", "Cisco"],
      files: [{ en: "networkmap.md", no: "i18n/no/networkmap.md" }],
      details: [
        { en: "An old PC running Proxmox, a hypervisor for virtual machines. It hosts a Minecraft server, a Palworld server and a web server, plus Ollama for running AI models locally, Pi-hole for network-wide ad blocking, and TrueNAS for storage.", no: "En gammel PC som kjører Proxmox, en hypervisor for virtuelle maskiner. Den kjører en Minecraft-server, en Palworld-server og en webserver, i tillegg til Ollama for å kjøre KI-modeller lokalt, Pi-hole for reklameblokkering i hele nettverket og TrueNAS for lagring." },
        { en: "The server has \"lights out\" management through a PiKVM (an IP-KVM: internet protocol keyboard, video, mouse), so it can be restarted or reconfigured remotely if something goes wrong at the hardware level.", no: "Serveren har «lights out»-administrasjon gjennom en PiKVM (en IP-KVM: internet protocol keyboard, video, mouse), så den kan startes på nytt eller rekonfigureres eksternt hvis noe går galt på maskinvarenivå." },
        { en: "The network runs from the router to a UniFi 8-port PoE switch in the living room, then over a longer cable run to a Cisco WebView 16-port gigabit switch and a newly acquired Cisco Catalyst 48-port PoE switch. The Proxmox server is connected with two gigabit cables, alongside the PiKVM.", no: "Nettverket går fra ruteren til en UniFi 8-ports PoE-switch i stua, og videre over en lengre kabel til en Cisco WebView 16-ports gigabit-switch og en nyinnkjøpt Cisco Catalyst 48-ports PoE-switch. Proxmox-serveren er koblet til med to gigabit-kabler, sammen med PiKVM-en." },
        { en: "Everything is backed by an APC Smart-UPS (uninterruptible power supply).", no: "Alt er sikret med en APC Smart-UPS (avbruddsfri strømforsyning)." },
      ],
    },
    {
      name: "support-insights",
      description: { en: "Internship project at Spenn: used AI in Snowflake to categorise support requests and built a Streamlit dashboard comparing what the chatbot solves versus human agents.", no: "Praksisprosjekt hos Spenn: brukte KI i Snowflake til å kategorisere supporthenvendelser, og bygde et Streamlit-dashboard som sammenligner hva chatboten løser med hva ekte agenter løser." },
      tech: ["Snowflake", "AI", "Streamlit"],
      period: { en: "Oct — Nov 2025", no: "okt. — nov. 2025" },
      details: [
        { en: "Spenn's Customer Care team handles a large volume of support requests, many of them answered by a chatbot. The team needed insight into which kinds of requests the chatbot solves compared to human agents, and a way to follow trends in what users contact them about.", no: "Customer Care-teamet i Spenn håndterer et stort volum av supporthenvendelser, og mange av dem besvares av en chatbot. Teamet trengte innsikt i hvilke typer henvendelser chatboten løser sammenlignet med ekte agenter, og en måte å følge trender i hva brukerne kontakter dem om." },
        { en: "I structured all the qualitative support data using AI in Snowflake, then built a visualisation dashboard in Streamlit on top of it.", no: "Jeg strukturerte all den kvalitative supportdataen ved hjelp av KI i Snowflake, og bygde deretter et visualiseringsdashboard i Streamlit oppå den." },
        { en: "The dashboard was built so the Customer Care lead can keep using it after the internship ended.", no: "Dashboardet ble bygget slik at Customer Care-lederen kan fortsette å bruke det etter at praksisen var over." },
      ],
      report: "Spenn",
    },
    {
      name: "interview-analysis",
      description: { en: "Internship project at Spenn: structured unstructured user interviews and built analyses across themes, reusable for future interviews.", no: "Praksisprosjekt hos Spenn: strukturerte ustrukturerte brukerintervjuer og bygde analyser på tvers av temaer, som kan gjenbrukes for fremtidige intervjuer." },
      tech: ["Snowflake", "AI", "Python"],
      period: { en: "Oct — Nov 2025", no: "okt. — nov. 2025" },
      details: [
        { en: "Spenn regularly runs user interviews to learn how people experience the product, but the result is very unstructured data that's hard to analyse.", no: "Spenn gjennomfører jevnlig brukerintervjuer for å lære hvordan folk opplever produktet, men resultatet er svært ustrukturert data som er vanskelig å analysere." },
        { en: "I structured the interview material and built analyses across themes, for example what users see as \"the value of Spenn\", so stakeholders can understand the main findings without reading every interview.", no: "Jeg strukturerte intervjumaterialet og bygde analyser på tvers av temaer, for eksempel hva brukerne ser på som «verdien av Spenn», slik at interessentene kan forstå hovedfunnene uten å lese hvert intervju." },
        { en: "The solution works for interviews that have already been done and can be reused for future ones.", no: "Løsningen fungerer for intervjuer som allerede er gjennomført, og kan gjenbrukes for fremtidige." },
        { en: "At the end of the internship I presented both Spenn projects to the whole tech department.", no: "På slutten av praksisperioden presenterte jeg begge Spenn-prosjektene for hele tech-avdelingen." },
      ],
      report: "Spenn",
    },
  ],
  experience: [
    {
      period: { en: "Jan — Feb 2026", no: "jan. — feb. 2026" },
      title: { en: "Developer intern, application platform team (3 weeks)", no: "Utviklerpraktikant, team applikasjonsplattform (3 uker)" },
      place: "Statens pensjonskasse",
      text: { en: "Worked on LOS, SPK's new development platform: migrating from Docker Swarm to Kubernetes (k8s, kind), automated testing in GitHub Actions, and some Go. Took part in mob programming sessions and team meetings, and got a change deployed to the ad-hoc test environment.", no: "Jobbet med LOS, Statens pensjonskasses nye utviklingsplattform: migrering fra Docker Swarm til Kubernetes (k8s, kind), automatisert testing i GitHub Actions og litt Go. Deltok i mob-programmering og teammøter, og fikk deployet en endring til ad-hoc-testkjøremiljøet." },
      // the attest from SPK, quoted as written (date of birth left out)
      reference: {
        from: "Tofik Sahraoui, Statens pensjonskasse",
        language: "Norwegian",
        sections: [
          { heading: "Attest for Sander Nybø Flaen", text: "Oslo, 6. mars 2026\nSander Nybø Flaen […] jobbet som utvikler i team applikasjonsplattform i Statens pensjonskasse.\nSander har i perioden februar 2026 jobbet i team applikasjonsplattform." },
          { heading: "", text: "Han har hovedsakelig jobbet med oppgaver knyttet til plattformen (LOS) som er vår nye utviklingsplattform. Disse har inkludert:\n• Docker container teknologi\n• Felles arbeidsøkter som vi kaller for mob-programmering\n• Han har fått deployet en endring til vårt ad-hoc testkjøremiljø\n• Deltatt på møter som teamet har hatt\n• Jobbet med Go-lang\n• K8s Kind" },
          { heading: "", text: "Sander har vist stor interesse for å jobbe både med backend og han har løst alle sine oppgaver på en god måte. Som teammedlem så har han i stor grad bidratt med å oppnå teamets mål, både de funksjonelle og tekniske." },
          { heading: "Teknologi:", text: "Github actions, JIRA, Confluence, Go lang, Kubernetes" },
          { heading: "", text: "Med vennlig hilsen\nTeamleder Tofik Sahraoui\nStatens pensjonskasse" },
        ],
      },
    },
    {
      period: { en: "Oct — Nov 2025", no: "okt. — nov. 2025" },
      title: { en: "IT intern (3 weeks)", no: "IT-praktikant (3 uker)" },
      place: "Spenn",
      text: { en: "Automated qualitative data analysis using AI. Worked mostly independently in Snowflake (Jupyter Notebook), and presented both cases to the whole tech department at the end.", no: "Automatiserte kvalitativ dataanalyse ved hjelp av KI. Jobbet for det meste selvstendig i Snowflake (Jupyter Notebook), og presenterte begge casene for hele tech-avdelingen til slutt." },
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
      period: { en: "Jan 2025", no: "jan. 2025" },
      title: { en: "Job shadowing (6 days)", no: "Jobbskygging (6 dager)" },
      place: "Norwegian Air Shuttle",
      text: { en: "Followed the development department and IT operations over two weeks: 3 days in operations, 1 day with UI/UX and 2 days with development. Got an inside look at setting up and installing laptops, and got to fix a time synchronisation bug in the backend.", no: "Fulgte utviklingsavdelingen og IT-drift over to uker: 3 dager i drift, 1 dag hos UI/UX og 2 dager med utvikling. Fikk innblikk i oppsett og installasjon av laptoper, og fikk fikse en tidssynkroniseringsfeil i backenden." },
      // reference from Norwegian, quoted as written (phone number left out)
      reference: {
        from: "Thomas Klokkerhaug, Norwegian",
        language: "Norwegian",
        sections: [
          { heading: "Referanse – jobbskygging", text: "Sander gjennomførte jobbskygging hos oss over en periode på to uker, hvor han fulgte både Digital Delivery (utviklingsavdelingen) og IT Operations." },
          { heading: "", text: "I løpet av perioden viste Sander stor interesse for fagområdene, spesielt innen utvikling, samtidig som han var nysgjerrig på hvordan IT-drift fungerer i praksis. Han stilte relevante spørsmål, var engasjert i det han observerte, og viste god forståelse for sammenhengen mellom utvikling og drift." },
          { heading: "", text: "Sander fremsto som en hyggelig, lærevillig og positiv elev, som raskt tilpasset seg nye miljøer og tok initiativ til å få mest mulig ut av oppholdet.\nVi opplever Sander som en motivert kandidat for videre utdanning og arbeid innen IT, og ønsker ham lykke til videre." },
          { heading: "", text: "Med vennlig hilsen | Kind regards\nThomas Klokkerhaug\nDirector Digital Delivery & Business IT" },
        ],
      },
    },
    {
      period: "2024 — 2028",
      title: { en: "Information Technology and Media Production", no: "Informasjonsteknologi og medieproduksjon" },
      place: "Kuben VGS",
      text: { en: "Upper secondary school.", no: "Videregående skole." },
    },
    {
      period: "2020 — 2024",
      title: { en: "Lower secondary school", no: "Ungdomsskole" },
      place: "Morellbakken ungdomsskole",
      text: { en: "With programming as an elective.", no: "Med programmering som valgfag." },
    },
  ],
  contact: {
    email: "you@example.com",
    github: "https://github.com/SanderNF",
    linkedin: "https://www.linkedin.com/in/your-profile",
  },
};
