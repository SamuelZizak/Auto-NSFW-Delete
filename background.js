// Auto History Cleaner - background script
// Deletes Google searches and NSFW pages from history as soon as they are recorded.

const DEFAULTS = {
  enabled: true,
  deleteGoogleSearches: true,
  deleteNsfw: true,
  sweepOnStartup: true,
  // Extra user-defined words matched against URL and page title
  customKeywords: [],
  // Extra user-defined domains (e.g. "example.com"), subdomains included
  customDomains: []
};

// Built-in keyword list (matched case-insensitively against URL + title)
const NSFW_KEYWORDS = [
  "porn", "xxx", "nsfw", "hentai", "erotic", "sex video", "sexcam", "livecam",
  "camgirl", "nude", "nudes", "onlyfans", "rule34", "r34", "fetish", "bdsm",
  "milf", "xvideos", "xnxx", "xhamster", "redtube", "youporn", "spankbang",
  "chaturbate", "stripchat", "brazzers", "bangbros", "pornhub", "eporner",
  "tnaflix", "motherless", "fansly", "e-hentai", "nhentai", "hanime"
];

// Built-in domain list (subdomains included)
const NSFW_DOMAINS = [
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
  "youporn.com", "spankbang.com", "chaturbate.com", "stripchat.com",
  "brazzers.com", "bangbros.com", "eporner.com", "tnaflix.com",
  "motherless.com", "onlyfans.com", "fansly.com", "rule34.xxx",
  "e-hentai.org", "nhentai.net", "hanime.tv", "literotica.com"
];

let settings = { ...DEFAULTS };
let compiled = null;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compile() {
  const kws = [...NSFW_KEYWORDS, ...settings.customKeywords]
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  const doms = [...NSFW_DOMAINS, ...settings.customDomains]
    .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""))
    .filter(Boolean);
  compiled = {
    keywordRe: kws.length ? new RegExp(kws.map(escapeRegex).join("|"), "i") : null,
    domains: doms
  };
}

async function loadSettings() {
  const stored = await browser.storage.local.get(DEFAULTS);
  settings = { ...DEFAULTS, ...stored };
  compile();
}

function isGoogleSearch(url) {
  try {
    const u = new URL(url);
    // google.com, google.co.uk, google.sk, ... (also www./other subdomains)
    if (!/(^|\.)google\.[a-z.]{2,6}$/i.test(u.hostname)) return false;
    return (
      u.pathname === "/search" ||
      u.pathname.startsWith("/search/") ||
      (u.pathname === "/url" && u.searchParams.has("q")) ||
      u.searchParams.has("q") && u.pathname === "/webhp"
    );
  } catch (e) {
    return false;
  }
}

function hostMatches(hostname, domains) {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return domains.some((d) => h === d || h.endsWith("." + d));
}

function isNsfw(url, title) {
  try {
    const u = new URL(url);
    if (hostMatches(u.hostname, compiled.domains)) return true;
    if (compiled.keywordRe) {
      // Decode so that "porn%20videos" style queries still match
      let haystack = u.hostname + decodeURIComponent(u.pathname + u.search).replace(/[+_]/g, " ");
      if (title) haystack += " " + title;
      if (compiled.keywordRe.test(haystack)) return true;
    }
  } catch (e) {
    // malformed URL: fall back to a plain match on the raw string
    if (compiled.keywordRe && compiled.keywordRe.test(url + " " + (title || ""))) return true;
  }
  return false;
}

function shouldDelete(item) {
  if (!settings.enabled || !item || !item.url) return false;
  if (!/^https?:/i.test(item.url)) return false;
  if (settings.deleteGoogleSearches && isGoogleSearch(item.url)) return true;
  if (settings.deleteNsfw && isNsfw(item.url, item.title)) return true;
  return false;
}

async function removeIfMatch(item) {
  if (shouldDelete(item)) {
    try {
      await browser.history.deleteUrl({ url: item.url });
    } catch (e) {
      console.error("Auto History Cleaner: delete failed", e);
    }
  }
}

// Sweep existing history for anything that matches
async function sweep() {
  if (!settings.enabled) return 0;
  const items = await browser.history.search({
    text: "",
    startTime: 0,
    maxResults: 1000000
  });
  let removed = 0;
  for (const item of items) {
    if (shouldDelete(item)) {
      try {
        await browser.history.deleteUrl({ url: item.url });
        removed++;
      } catch (e) {
        // ignore individual failures
      }
    }
  }
  return removed;
}

// A page is recorded the moment it is visited - delete it right away.
browser.history.onVisited.addListener(removeIfMatch);

// The page title is often only filled in after load, so re-check then too
// (this catches NSFW pages whose URL gives nothing away).
browser.history.onTitleChanged.addListener((info) => {
  removeIfMatch({ url: info.url, title: info.title });
});

browser.storage.onChanged.addListener(async () => {
  await loadSettings();
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "sweep") {
    return loadSettings().then(sweep);
  }
});

(async () => {
  await loadSettings();
  if (settings.sweepOnStartup) {
    await sweep();
  }
})();
