import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const stages = ['child','adult','elder'];
const safeId = /^[a-z][a-z0-9_-]*$/;
export async function scanAppearances(root = process.cwd()) {
  const base = path.join(root,'public/assets/sprites');
  const result = {version:1, appearances:[], equipment:[], diagnostics:[]};
  const dirs = async p => { try { return (await readdir(p,{withFileTypes:true})).filter(e=>e.isDirectory()&&!e.isSymbolicLink()).map(e=>e.name).sort(); } catch(e) { if(e.code==='ENOENT') return []; throw e; } };
  const json = async p => {try { return JSON.parse(await readFile(p,'utf8')); } catch(e) {if(e.code==='ENOENT') return {}; throw e;}};
  async function png(file, frameSize, optional=false) {
    let b; try {b=await readFile(file);} catch(e) {if(optional&&e.code==='ENOENT') return undefined;throw e;}
    if(b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.toString('ascii',12,16)!=='IHDR') throw Error('PNG không hợp lệ: '+file);
    if(b.readUInt32BE(16)!==frameSize*6||b.readUInt32BE(20)!==frameSize*8) throw Error('Bảng ảnh phải có 6 cột × 8 hàng: '+file);
    return path.relative(path.join(root,'public'),file).split(path.sep).join('/');
  }
  function size(value=64) {if(![32,64].includes(value)) throw Error('frameSize phải là 32 hoặc 64');return value;}
  const seen = new Set();
  for(const race of ['human','demon','beast']) {
    const groups = race==='beast' ? await dirs(path.join(base,'characters',race)) : [race];
    for(const species of groups) {
      const group = path.join(base,'characters',race,...(race==='beast'?[species]:[]));
      for(const name of await dirs(group)) {
        const folder=path.join(group,name);
        try {
          if(!safeId.test(name)||!safeId.test(species)) throw Error('Tên thư mục phải dùng chữ thường, số, _ hoặc -');
          const c=await json(path.join(folder,'appearance.json'));
          const id=`${race}/${species}/${name}`;
          if(seen.has(id)) throw Error('ID trùng: '+id);
          const frameSize=size(c.frameSize);
          const bodyProfile=c.bodyProfile ?? (race==='beast'?species:'humanoid_standard');
          if(!safeId.test(bodyProfile)) throw Error('bodyProfile không hợp lệ');
          const weight=c.weight??1;
          if(!Number.isFinite(weight)||weight<=0) throw Error('weight phải lớn hơn 0');
          const images={};
          for(const stage of stages) images[stage]={body:await png(path.join(folder,stage,'body.png'),frameSize),casual:await png(path.join(folder,stage,'casual.png'),frameSize,race==='beast')};
          result.appearances.push({id,raceId:race,speciesId:species,bodyProfile,frameSize,weight,stages:images});seen.add(id);
        } catch(e) {result.diagnostics.push(`${folder}: ${e.message}`);}
      }
    }
  }
  for(const itemId of await dirs(path.join(base,'equipment'))) {
    for(const profile of await dirs(path.join(base,'equipment',itemId))) {
      const folder=path.join(base,'equipment',itemId,profile);
      try {
        if(!safeId.test(itemId)||!safeId.test(profile)) throw Error('ID trang bị/profile không hợp lệ');
        const c=await json(path.join(folder,'visual.json'));const frameSize=size(c.frameSize);const images={};
        for(const stage of stages) images[stage]={front:await png(path.join(folder,stage,'front.png'),frameSize),back:await png(path.join(folder,stage,'back.png'),frameSize,true)};
        result.equipment.push({itemId,bodyProfile:profile,frameSize,stages:images});
      }catch(e){result.diagnostics.push(`${folder}: ${e.message}`);}
    }
  }
  return result;
}
export function appearancePlugin() {
  return {name:'appearance-catalog',
    configureServer(server) {
      server.middlewares.use('/appearance-manifest.json',async (_req,res)=>{
        try {res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(await scanAppearances(server.config.root)));}
        catch(e){res.statusCode=500;res.end(JSON.stringify({error:e.message}));}
      });
    },
    async generateBundle() {const catalog=await scanAppearances();for(const d of catalog.diagnostics) this.warn(d);this.emitFile({type:'asset',fileName:'appearance-manifest.json',source:JSON.stringify(catalog)});}
  };
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const catalog=await scanAppearances();
  console.log(`${catalog.appearances.length} bộ nhân vật; ${catalog.equipment.length} bộ trang phục`);
  for(const d of catalog.diagnostics) console.error(d);
  if(process.argv.includes('--write')) await writeFile('public/appearance-manifest.json',JSON.stringify(catalog,null,2));
  if(catalog.diagnostics.length) process.exitCode=1;
}
