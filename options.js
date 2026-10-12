const DEFAULTS = {
  enabled: true,
  deleteGoogleSearches: true,
  deleteNsfw: true,
  sweepOnStartup: true,
  customKeywords: [],
  customDomains: []
};

const $ = (id) => document.getElementById(id);
const toLines = (text) => text.split("\n").map((s) => s.trim()).filter(Boolean);

async function restore() {
  const s = await browser.storage.local.get(DEFAULTS);
  $("enabled").checked = s.enabled;
  $("deleteGoogleSearches").checked = s.deleteGoogleSearches;
  $("deleteNsfw").checked = s.deleteNsfw;
  $("sweepOnStartup").checked = s.sweepOnStartup;
  $("customKeywords").value = s.customKeywords.join("\n");
  $("customDomains").value = s.customDomains.join("\n");
}

function say(text) {
  $("status").textContent = text;
  setTimeout(() => { $("status").textContent = ""; }, 4000);
}

$("save").addEventListener("click", async () => {
  await browser.storage.local.set({
    enabled: $("enabled").checked,
    deleteGoogleSearches: $("deleteGoogleSearches").checked,
    deleteNsfw: $("deleteNsfw").checked,
    sweepOnStartup: $("sweepOnStartup").checked,
    customKeywords: toLines($("customKeywords").value),
    customDomains: toLines($("customDomains").value)
  });
  say("Saved.");
});

$("sweep").addEventListener("click", async () => {
  say("Cleaning...");
  const removed = await browser.runtime.sendMessage({ type: "sweep" });
  say("Done. Removed " + (removed || 0) + " history entries.");
});

restore();
