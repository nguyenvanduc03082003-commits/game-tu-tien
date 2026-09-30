import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm,rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { scanAppearances } from '../scripts/appearance-catalog.mjs';
import { createTemplate,templatePNG } from '../scripts/appearance-template.mjs';
const root=await mkdtemp(path.join(tmpdir(),'appearance-catalog-'));
try {
 const base=path.join(root,'public/assets/sprites');await createTemplate(base);
 const first=await scanAppearances(root);assert.equal(first.appearances.length,1);assert.equal(first.equipment.length,1);assert.deepEqual(first.diagnostics,[]);
 const folder=path.join(base,'characters/human/template_resident');await rename(folder,path.join(base,'characters/human/new_resident'));
 const next=await scanAppearances(root);assert.equal(next.appearances[0].id,'human/human/new_resident');
 await writeFile(path.join(base,'characters/human/new_resident/child/body.png'),templatePNG('child','body',32));
 const broken=await scanAppearances(root);assert.equal(broken.appearances.length,0);assert.equal(broken.diagnostics.length,1);assert.equal(broken.equipment.length,1);
 console.log('PASS catalog: complete template, restart rescan, invalid image isolated');
} finally {await rm(root,{recursive:true,force:true});}
