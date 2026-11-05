// The download section: the newest release of this repository (pre-releases included, while DataNest is in preview), with
// its packages sorted by platform. The release workflow of DataNest makes the releases, so the site never changes for one.
(() => {
  'use strict';

  const REPO = 'dmitrypost/datanest-app';
  /** Turn a store on once the extension is published there (README.md, "When the extension is on a store"). */
  const STORES = { marketplace: false, openvsx: false };

  /** What each package is, by its file name (DataNest's .github/workflows/release.yml names them). */
  const KINDS = [
    { group: 'vsix', test: /^datanest-win32-x64-.*\.vsix$/i, label: 'Windows x64' },
    { group: 'vsix', test: /^datanest-darwin-arm64-.*\.vsix$/i, label: 'macOS, Apple silicon' },
    { group: 'vsix', test: /^datanest-darwin-x64-.*\.vsix$/i, label: 'macOS, Intel' },
    { group: 'vsix', test: /^datanest-linux-x64-.*\.vsix$/i, label: 'Linux x64' },
    { group: 'windows', test: /-setup\.exe$/i, label: 'Installer' },
    { group: 'windows', test: /\.msi$/i, label: 'MSI package' },
    { group: 'macos', test: /\.dmg$/i, label: 'Disk image' },
    { group: 'linux', test: /\.deb$/i, label: 'Debian and Ubuntu' },
    { group: 'linux', test: /\.rpm$/i, label: 'Fedora and openSUSE' },
  ];

  const status = document.querySelector('[data-release-status]');
  const releasesUrl = `https://github.com/${REPO}/releases`;

  function showStores() {
    let any = false;
    for (const link of document.querySelectorAll('[data-store]')) {
      const on = STORES[link.dataset.store] === true;
      link.hidden = !on;
      any = any || on;
    }
    document.querySelector('[data-store-links]').hidden = !any;
    document.querySelector('[data-store-note]').hidden = any;
  }

  function say(...parts) {
    status.replaceChildren(...parts.map((part) => (typeof part === 'string' ? document.createTextNode(part) : part)));
  }

  function link(href, text) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  }

  function size(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  }

  function extension(name) {
    const dot = name.lastIndexOf('.');
    return dot < 0 ? '' : name.slice(dot);
  }

  function showRelease(release) {
    const version = release.tag_name.replace(/^v/, '');
    const date = new Date(release.published_at ?? release.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    say(`DataNest ${version}${release.prerelease ? ', a preview,' : ''} released ${date}. `, link(release.html_url, 'Release notes'), '.');
    for (const asset of release.assets) {
      const kind = KINDS.find((candidate) => candidate.test.test(asset.name));
      if (kind === undefined) continue;
      const list = document.querySelector(`[data-assets="${kind.group}"]`);
      const item = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'asset';
      a.href = asset.browser_download_url;
      const label = document.createElement('span');
      label.className = 'asset__label';
      label.textContent = kind.label;
      const meta = document.createElement('span');
      meta.className = 'asset__meta';
      meta.textContent = `${extension(asset.name)}, ${size(asset.size)}`;
      a.append(label, meta);
      item.append(a);
      list.append(item);
    }
  }

  showStores();
  fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`GitHub answered ${response.status}`))))
    .then((releases) => {
      const release = releases.find((candidate) => !candidate.draft);
      if (release === undefined) {
        say('The first preview release is on its way: ', link(releasesUrl, 'watch the releases'), ' to hear when it lands.');
      } else {
        showRelease(release);
      }
    })
    .catch(() => say('The list of downloads could not be loaded from GitHub. ', link(releasesUrl, 'See every release'), '.'));
})();
