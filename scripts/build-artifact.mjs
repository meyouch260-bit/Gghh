// Construit une page HTML autonome (JS + CSS inlinés) à publier comme page claude.ai.
// Usage : npm run build:artifact  ->  dist-artifact/soiree-jeux.html
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dir = 'dist/assets/';
const files = readdirSync(dir);
const js = readFileSync(dir + files.find((f) => f.endsWith('.js')), 'utf8');
const css = readFileSync(dir + files.find((f) => f.endsWith('.css')), 'utf8');
if (js.includes('</script')) throw new Error('Le bundle contient </script : inlining impossible.');

const html = `<title>Soirée Jeux</title>
<meta name="theme-color" content="#1a120d">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap">
<style>:root{color-scheme:dark}
${css}</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/soiree-jeux.html', html);
console.log(`dist-artifact/soiree-jeux.html (${Math.round(html.length / 1024)} Ko)`);
