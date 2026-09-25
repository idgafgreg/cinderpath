import {cp,mkdir,rm,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const files=['index.html','classic.html','manifest.webmanifest','runner','assets','game/src','game/content','game/styles.css'];
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of files)await cp(file,join('dist',file),{recursive:true});
// Cache name derives from the complete runner shell, so every changed build updates.
const hash=createHash('sha256');
async function visit(dir){for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=join(dir,item.name);if(item.isDirectory())await visit(p);else hash.update(await readFile(p));}}
await visit('dist');
const sw=(await readFile('sw.js','utf8')).replace("const CACHE='cinderpath-runner-v1'",`const CACHE='cinderpath-runner-${hash.digest('hex').slice(0,12)}'`);
await writeFile('dist/sw.js',sw);
try{await cp('docs/runner-home.png','dist/docs/runner-home.png');}catch{}
await writeFile('dist/.nojekyll','');
console.log('Built deployable static site in dist/');
