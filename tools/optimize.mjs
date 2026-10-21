import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { minify } from 'html-minifier-terser';
import { build, transform } from 'esbuild';

// Operate only on Jekyll's disposable output, never source files.
const root = path.resolve(process.argv[2] || '_site');
if (root === process.cwd()) throw new Error('Refusing to optimize source directory');
await stat(path.join(root, 'index.html'));
let before = 0, after = 0;
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${file}`);
    if (entry.isDirectory()) { await visit(file); continue; }
    if (/\.map$/i.test(file)) throw new Error(`Public source map found: ${file}`);
    if (!/\.(html|css|js)$/.test(file)) continue;
    const source = await readFile(file, 'utf8');
    if (/sourceMappingURL\s*=/.test(source)) throw new Error(`Source map reference: ${file}`);
    let output;
    if (file.endsWith('.html')) {
      output = await minify(source, {
        collapseWhitespace: true, conservativeCollapse: true,
        removeComments: true, minifyCSS: true, minifyJS: true,
        // Keep semantic HTML, ARIA, structured data and canonical/feed links.
        removeAttributeQuotes: false, removeOptionalTags: false,
      });
    } else if (file.endsWith('.css')) {
      output = (await transform(source, { loader: 'css', minify: true, sourcemap: false })).code;
    } else {
      const result = await build({ entryPoints: [file], bundle: true, minify: true,
        sourcemap: false, write: false, target: ['es2020'], legalComments: 'none' });
      output = result.outputFiles[0].text;
    }
    before += Buffer.byteLength(source); after += Buffer.byteLength(output);
    await writeFile(file, output);
  }
}
await visit(root);
console.log(`Optimized HTML/CSS/JS: ${before} → ${after} bytes. No public source maps.`);
