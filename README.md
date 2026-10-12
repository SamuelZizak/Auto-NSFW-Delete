# Auto History Cleaner

A small Firefox extension that automatically deletes Google searches and NSFW pages from your browsing history as soon as they are recorded.

Works in Firefox and Firefox-based browsers such as Zen.

## Features

- **Instant cleanup:** matching pages are removed from history the moment they are visited.
- **Google searches:** removes searches on any Google domain (google.com, google.co.uk, google.sk, ...).
- **NSFW pages:** matches a built-in list of known adult domains and keywords against the address and page title.
- **Cleans existing history:** sweeps your whole history on browser start, or on demand with a button.
- **Custom rules:** add your own keywords and domains from the settings page.
- **Local only:** no network requests, no tracking, no data leaves your browser.

## Installation

### Temporary (any Firefox-based browser)

1. Download or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `manifest.json`.

The add-on is removed when the browser restarts.

### Permanent

Firefox only keeps signed add-ons in release builds. Options:

- **Sign it for free:** submit the extension at [addons.mozilla.org](https://addons.mozilla.org/developers/) as **On your own** (unlisted) and install the signed `.xpi` you get back.
- **Developer Edition, Nightly or ESR:** set `xpinstall.signatures.required` to `false` in `about:config`, then install the `.xpi` via `about:addons` -> gear icon -> **Install Add-on From File...**.

To build the `.xpi` yourself, zip the files with no parent folder:

```sh
zip auto-history-cleaner.xpi manifest.json background.js options.html options.js
```

## Usage

Click the toolbar icon to open the settings:

| Setting | Description |
| --- | --- |
| Enabled | Master switch |
| Delete Google searches | Removes Google search result pages from history |
| Delete NSFW pages | Removes pages matching the built-in and custom rules |
| Clean existing history on browser start | Runs a full sweep every time the browser starts |
| Extra keywords | One per line, matched against the address and page title |
| Extra domains | One per line, subdomains included automatically |

**Clean existing history now** runs a sweep immediately and shows how many entries were removed.

## How it works

- `history.onVisited` fires when a page is recorded; if it matches, `history.deleteUrl` removes it.
- `history.onTitleChanged` re-checks pages once their title has loaded.
- A sweep uses `history.search` to go through the existing history and deletes every match.

The built-in keyword and domain lists are at the top of `background.js` and can be edited directly.

## Limitations

- Does not touch cookies, cache or form history (URL bar suggestions).
- Does not delete your Google account activity (see [myactivity.google.com](https://myactivity.google.com)).
- Entries already synced to other devices through browser sync may take time to disappear there.
- Keyword matching is simple, so it can occasionally delete a harmless page or miss a page with nothing suspicious in its address or title. Use the custom lists to tune it.
- Private windows never record history in the first place.

## Permissions

- `history`: needed to detect and delete history entries.
- `storage`: needed to save your settings.

## Project structure

```
manifest.json    Extension manifest
background.js    Matching rules, live deletion and sweep
options.html     Settings page
options.js       Settings page logic
```

## License

MIT
