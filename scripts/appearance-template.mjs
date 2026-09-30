import { deflateSync } from 'node:zlib';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
function crc32(bytes) {let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data) {const t=Buffer.from(type);const n=Buffer.alloc(4);n.writeUInt32BE(data.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([n,t,data,crc]);}
// Technical registration atlas; rectangles intentionally reveal alignment and walking phase.
export function templatePNG(stage='adult', layer='body', frame=64) {
 const width=frame*6,height=frame*8,pixels=Buffer.alloc((width*4+1)*height);
 const rect=(x,y,w,h,color)=>{for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){if(px>=0&&py>=0&&px<width&&py<height){const i=py*(width*4+1)+1+px*4;for(let c=0;c<4;c++)pixels[i+c]=color[c];}}};
 const small=stage==='child'?0.72:1;
 for(let row=0;row<8;row++)for(let col=0;col<(row<4?4:6);col++) {
  const x=col*frame+frame/2,y=row*frame+Math.round(frame*0.875),unit=frame/64;
  const r=(dx,dy,w,h,color)=>rect(Math.round(x+dx*unit*small),Math.round(y+dy*unit*small),Math.max(1,Math.round(w*unit*small)),Math.max(1,Math.round(h*unit*small)),color);
  const sway=row>=4?(col%2===0?-2:2):0;
  if(layer==='body') {
   r(-7,-40,14,14,[222,170,125,255]);r(-7,-41,14,4,stage==='elder'?[185,185,185,255]:[60,43,32,255]);
   r(-7,-25,14,18,[185,140,110,255]);r(-7+sway,-8,5,8,[60,55,50,255]);r(2-sway,-8,5,8,[60,55,50,255]);
   r((row%4===1?-6:row%4===2?3:-3),-34,3,3,[20,20,20,255]);
  } else {r(-9,-25,18,19,layer==='casual'?[55,140,105,255]:[85,110,200,255]);r(-9,-25,18,3,[220,200,120,255]);}
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
export async function createTemplate(root) {
 const files=[];
 for(const stage of ['child','adult','elder']) {
  for(const layer of ['body','casual'])files.push([path.join(root,'characters/human/template_resident',stage,layer+'.png'),templatePNG(stage,layer)]);
  files.push([path.join(root,'equipment/linen_robe/humanoid_standard',stage,'front.png'),templatePNG(stage,'armor')]);
 }
 for(const [file] of files){try{await access(file);throw Error('Không ghi đè file hiện có: '+file);}catch(e){if(e.code!=='ENOENT')throw e;}}
 for(const [file,bytes]of files){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes,{flag:'wx'});}
 return files.map(([file])=>file);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 const root=path.resolve('examples/appearance-template');
 console.log((await createTemplate(root)).join('\n'));
}
