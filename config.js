// Site configuration. Loaded before the page renders and exposed as
// window.SITE_CONFIG. Copy config.js.example to config.js to get started,
// then edit the values below. (config.js may be git-ignored for private tweaks;
// config.js.example is the checked-in template.)
window.SITE_CONFIG = {
  // Big italic site title in the header.
  title: 'What the Tech?',
  // One-line tagline under the title.
  tagline: 'Notes from the workbench — homelab and self-hosting, Kubernetes and networking, signal processing and math, AI agents, and the occasional web build.',
  // Giscus comments (GitHub Discussions). Fill these from https://giscus.app
  // (enable Discussions on the repo, install the giscus app, then copy the IDs).
  // Comments stay hidden until repo + repoId + categoryId are set.
  giscus: {
    enabled: true,              // set false to turn comments off site-wide
    repo: 'therealmarcuschiu/tech',          // e.g. 'marcuschiu/thoughts'
    repoId: 'R_kgDOS1tLog',                  // data-repo-id from giscus.app
    category: 'Announcements',   // discussion category name
    categoryId: 'DIC_kwDOS1tLos4C-2lw',              // data-category-id from giscus.app
    mapping: 'specific',         // each article gets its own thread (keyed by slug)
    theme: 'dark',
  },
};
