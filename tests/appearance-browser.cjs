const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3100/',{waitUntil:'networkidle'});
  await page.waitForTimeout(1000);
  const appText=await page.locator('body').innerText();
  if(!appText.length)throw Error('Empty application');
  const result=await page.evaluate(async()=>{
   const [{ECSWorld},{BeingFactory},{AppearanceRegistry},{LifespanComponent,CharacterStateComponent,AnimationComponent},{equipArmor},{AssetManager},{renderLayeredCharacter},{FamilyComponent}]=await Promise.all([
    import('/src/ecs/World.ts'),import('/src/modules/beings/BeingFactory.ts'),import('/src/modules/appearance/Appearance.ts'),import('/src/modules/beings/BeingComponents.ts'),import('/src/modules/appearance/EquipmentAppearance.ts'),import('/src/renderer/assets/AssetManager.ts'),import('/src/renderer/systems/LayeredCharacterRenderer.ts'),import('/src/modules/beings/FamilyComponent.ts')
   ]);
   const stages={};const armor={};for(const stage of ['child','adult','elder']){
    stages[stage]={body:`/examples/appearance-template/characters/human/template_resident/${stage}/body.png`,casual:`/examples/appearance-template/characters/human/template_resident/${stage}/casual.png`};
    armor[stage]={front:`/examples/appearance-template/equipment/linen_robe/humanoid_standard/${stage}/front.png`};
   }
   AppearanceRegistry.instance.install({version:1,appearances:[{id:'human/human/template_resident',raceId:'human',speciesId:'human',bodyProfile:'humanoid_standard',frameSize:64,weight:1,stages}],equipment:[{itemId:'linen_robe',bodyProfile:'humanoid_standard',frameSize:64,stages:armor}],diagnostics:[]});
   const assets=AssetManager.getInstance();for(const s of Object.values(stages))for(const p of Object.values(s))await assets.loadTexture(p,p);for(const s of Object.values(armor))await assets.loadTexture(s.front,s.front);
   const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=700;canvas.style.cssText='position:fixed;left:0;top:0;z-index:999999;width:1100px;height:700px';canvas.id='appearance-qa';document.body.append(canvas);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#111827';ctx.fillRect(0,0,1100,700);ctx.fillStyle='white';ctx.font='22px sans-serif';ctx.fillText('Kiểm tra kỹ thuật: cùng nhân vật, đổi tuổi và trang phục',30,40);ctx.font='15px sans-serif';ctx.fillText('Đồ thường (xanh lá) / trang phục (xanh lam) — ảnh mẫu kỹ thuật, chưa phải mỹ thuật chính thức',30,70);
   const world=new ECSWorld();const id=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);let draws=0;
   for(const [ri,age] of [0,20,1000].entries()){
    world.getComponent(id,LifespanComponent).currentAge=age;ctx.fillStyle='white';ctx.fillText(['Trẻ em','Trưởng thành','Già'][ri],30,150+ri*180);
    for(const [di,direction]of ['down','left','right','up'].entries()){
     world.getComponent(id,CharacterStateComponent).state='walk';world.getComponent(id,CharacterStateComponent).direction=direction;world.getComponent(id,AnimationComponent).frameIndex=di%6;
     const x=220+di*220,y=220+ri*180;ctx.fillText(direction,x-35,y-100);
     equipArmor(world,id,null);if(renderLayeredCharacter(ctx,world,id,x-35,y,100))draws++;
     if(equipArmor(world,id,'linen_robe'))throw Error('Cannot equip compatible atlas');if(renderLayeredCharacter(ctx,world,id,x+60,y,100))draws++;
    }
   }
   return {draws,textureCount:9};
  });
  if(result.draws!==24)throw Error('Not all layers rendered');
  await page.locator('#appearance-qa').screenshot({path:'docs/appearance-preview.png'});
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({appLoaded:true,...result,pageErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
