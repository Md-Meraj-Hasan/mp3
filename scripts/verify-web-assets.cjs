
const fs = require('fs');
const path = require('path');

const roots = process.argv.slice(2);
if (!roots.length) roots.push('dist');

let failed = false;

function isInsideRoot(root, target) {
  const relative = path.relative(root, target);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

function checkFile(root, htmlPath, ref) {
  const trimmed = ref.trim();

  // Ignore external links, data URLs and fragment-only references.
  if (
    !trimmed ||
    /^(?:https?:|data:|#|\/\/|javascript:|mailto:|tel:)/i.test(trimmed)
  ) {
    return true;
  }

  // Remove query and fragment before resolving the actual file path.
  const pathname = trimmed.split(/[?#]/, 1)[0];
  if (!pathname) return true;

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    console.error(`[asset-check] Invalid URL encoding: ${trimmed}`);
    return false;
  }

  // Ignore a URL whose path is a directory and whose suffix is a fragment.
  const candidate = path.resolve(
    root,
    decoded.startsWith('/') ? decoded.slice(1) : decoded
  );

  if (
    trimmed.includes('#') &&
    fs.existsSync(candidate) &&
    fs.statSync(candidate).isDirectory()
  ) {
    return true;
  }

  if (!isInsideRoot(root, candidate)) {
    console.error(`[asset-check] Path escapes build directory: ${trimmed}`);
    return false;
  }

  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    console.error(
      `[asset-check] ${path.relative(root, htmlPath)} references missing asset: ${trimmed}`
    );
    return false;
  }

  return true;
}

for (const inputRoot of roots) {
  const root = path.resolve(inputRoot);

  for (const htmlName of ['index.html', 'video-player.html']) {
    const htmlPath = path.join(root, htmlName);

    if (!fs.existsSync(htmlPath)) {
      console.error(`[asset-check] Missing ${htmlPath}`);
      failed = true;
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Read HTML src/href references.
    const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
      .map(match => match[1].trim())
      .filter(Boolean);

    const localRefs = refs.filter(
      ref => !/^(?:https?:|data:|#|\/\/|javascript:|mailto:|tel:)/i.test(ref)
    );

    if (!localRefs.some(ref => /\.js(?:[?#]|$)/i.test(ref))) {
      console.error(`[asset-check] ${htmlPath} has no local JavaScript reference`);
      failed = true;
    }

    if (!localRefs.some(ref => /\.css(?:[?#]|$)/i.test(ref))) {
      console.error(`[asset-check] ${htmlPath} has no local CSS reference`);
      failed = true;
    }

    let htmlFailed = false;

    for (const ref of refs) {
      if (!checkFile(root, htmlPath, ref)) {
        htmlFailed = true;
      }
    }

    if (!htmlFailed) {
      console.log(`[asset-check] OK: ${htmlPath}`);
    } else {
      failed = true;
    }
  }
}

if (failed) process.exit(1);
