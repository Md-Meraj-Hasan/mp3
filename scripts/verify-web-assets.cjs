
const fs = require('fs');
const path = require('path');

const roots = process.argv.slice(2);
if (!roots.length) roots.push('dist');

let failed = false;

for (const root of roots) {
  const absoluteRoot = path.resolve(root);
  const htmlFiles = ['index.html', 'video-player.html'];

  for (const htmlName of htmlFiles) {
    const indexPath = path.join(absoluteRoot, htmlName);

    if (!fs.existsSync(indexPath)) {
      console.error(`[asset-check] Missing ${indexPath}`);
      failed = true;
      continue;
    }

    const html = fs.readFileSync(indexPath, 'utf8');

    // Read src and href references from HTML.
    const refs = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
      .map(match => match[1].trim())
      .filter(ref => ref.length > 0)
      // Ignore external URLs, data URLs and page/SVG fragments.
      .filter(ref => !/^(?:https?:|data:|#|\/\/|javascript:|mailto:|tel:)/i.test(ref));

    // Check that local JavaScript and CSS references exist.
    if (!refs.some(ref => /\.js(?:[?#]|$)/i.test(ref))) {
      console.error(
        `[asset-check] ${indexPath} has no local JavaScript bundle reference`
      );
      failed = true;
    }

    if (!refs.some(ref => /\.css(?:[?#]|$)/i.test(ref))) {
      console.error(
        `[asset-check] ${indexPath} has no local CSS reference`
      );
      failed = true;
    }

    let htmlFailed = false;

    for (const ref of refs) {
      // Remove query strings and fragments before checking the file.
      const pathname = ref.split(/[?#]/, 1)[0];

      if (!pathname) continue;
      // A fragment reference may point to a named element inside a directory.
         const candidatePath = path.resolve(
        absoluteRoot,
        pathname.startsWith('/') ? pathname.slice(1) : pathname
      );

if (
  ref.includes('#') &&
  fs.existsSync(candidatePath) &&
  fs.statSync(candidatePath).isDirectory()
) {
  continue;
}

      let clean;

      try {
        clean = decodeURIComponent(pathname);
      } catch {
        console.error(
          `[asset-check] Invalid URL encoding in ${indexPath}: ${ref}`
        );
        failed = true;
        htmlFailed = true;
        continue;
      }

      // Resolve root-relative and HTML-relative local asset paths safely.
      const relativePath = clean.startsWith('/')
        ? clean.slice(1)
        : clean;

      const filePath = path.resolve(absoluteRoot, relativePath);

      // Prevent references from escaping the build output directory.
      const relativeToRoot = path.relative(absoluteRoot, filePath);
      if (
        relativeToRoot === '..' ||
        relativeToRoot.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeToRoot)
      ) {
        console.error(
          `[asset-check] Asset path escapes build directory in ${indexPath}: ${ref}`
        );
        failed = true;
        htmlFailed = true;
        continue;
      }

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        console.error(
          `[asset-check] ${indexPath} references missing asset: ${ref}`
        );
        failed = true;
        htmlFailed = true;
      }
    }

    if (!htmlFailed) {
      console.log(
        `[asset-check] OK: ${indexPath} references existing local JS/CSS assets`
      );
    }
  }
}

if (failed) {
  process.exit(1);
}
  
