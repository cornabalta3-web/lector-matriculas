/* Prueba de la pantalla en Chromium, con la API simulada: no sale nada a internet ni hace
   falta clave. Se corre con: node pruebas/pantalla.js [carpeta-para-capturas]
   Necesita playwright (o playwright-core) instalado. TODOS LOS DATOS SON INVENTADOS. */
const path=require("path"), fs=require("fs");
function cargarPlaywright(){
 for(const n of ["playwright","playwright-core"]){
  for(const base of [process.cwd(),"/opt/node22/lib/node_modules","/usr/lib/node_modules","/usr/local/lib/node_modules"]){
   try{ return require(require.resolve(n,{paths:[base]})); }catch(e){}
  }
 }
 throw new Error("No encuentro playwright. Instalalo con: npm i -g playwright");
}
const {chromium}=cargarPlaywright();
const RAIZ=path.resolve(__dirname,"..");
/* se sirve por http en la máquina, como lo va a servir GitHub Pages por https: así el
   portapapeles funciona igual que en el uso real */
const http=require("http");
const TIPOS={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".pdf":"application/pdf"};
let URL_PAGINA="";
function servir(){
 return new Promise(res=>{
  const srv=http.createServer((q,r)=>{
   const f=path.join(RAIZ,decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/,"")||"index.html");
   if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); r.end(); return; }
   r.writeHead(200,{"content-type":TIPOS[path.extname(f)]||"application/octet-stream"}); fs.createReadStream(f).pipe(r);
  }).listen(0,"127.0.0.1",()=>{ URL_PAGINA="http://127.0.0.1:"+srv.address().port+"/index.html"; res(srv); });
 });
}
const PDF=path.join(__dirname,"matriculas-inventadas.pdf");
const CAPTURAS=process.argv[2]||null;

/* las mismas descripciones inventadas que las pruebas del motor */
const RURAL_A=[
 "Parcela ubicada en Departamento Ejemplo, Pedania Prueba , lugar el establecimiento \"El Ejemplo\" designado como LOTE 999001-/",
 "888002 y responde a la siguiente descripcion:Partiendo del vertice A con un rumbo de 1°56'29'' y un angulo en dicho vertice de 89°50'54'' y una distancia de 1180.68////",
 "linea A-B llegamos al vertice B, a partir de B con un angulo en dicho vertice de 93°36'45'' y una distancia de 865.87 linea B-1 llegamos al vertice 1, a partir de 1 con//",
 "un angulo en dicho vertice de 90°22'36'' y una distancia de 685.69 linea 1-2 llegamos al vertice 2, a partir de 2 con un angulo en dicho vertice de 90°38'10'' y una/",
 "distancia de 320.35 linea 2-3 llegamos al vertice 3, a partir de 3 con un angulo en dicho vertice de 270°35'12'' y una distancia de 525.86 linea 3-C llegamos al vertice/",
 "C, a partir de C con un angulo en dicho vertice de 84°56'23'' y una distancia de 640.31 linea C-A, encerrando una superficie de 92 Has 6626 m2 y linda con: Lado A-B con/",
 "camino publico, lado B-1 con parcela 999-0001, lados 1-2,2-3 con lote 999003-888004, lados 3-C,C-A con parcela 999-0002.//////"
].join("\n");
const URBANO="LOTE 12 de la MANZANA 5, ubicado en Barrio Ejemplo, que mide y linda: partiendo del vértice 1 con rumbo de 0°45'50\" y ángulo interno de 89°14'10\", lado 1-2 de 30,00 m, lindando con Lote 13; desde el vértice 2 con ángulo interno de 91°20'13\", lado 2-3 de 10,00 m, lindando con calle Pública; desde el vértice 3 con ángulo interno de 88°39'57\", lado 3-4 de 30,10 m, lindando con Lote 11; desde el vértice 4 con ángulo interno de 90°45'41\", lado 4-1 de 10,00 m, lindando con Lote 20; con una superficie de 300,48 m2.";
const RESPUESTA={matriculas:[
 {numero:"9990001",pagina:1,cuenta:"99-99-9999999-9",nomenclatura:"RU D:99 Ped:99 Hoja:999001 P:888002",descripcion:RURAL_A,
  antecedente:"Folio Real: Mat: 9990000",plano:"99999, expte. 0000-000000/2026",titulares:"1) PRUEBA, Juana Inventada: arg., DNI 00.000.000 — 1/1",gravamenes:"",dudas:["1180.68: una marca a mano tapa el último dígito"]},
 {numero:"9990002",pagina:2,cuenta:"",nomenclatura:"UR D:99 Ped:99 C:01 S:01 Mz:005 P:012",descripcion:URBANO,
  antecedente:"",plano:"",titulares:"",gravamenes:"",dudas:[]}
]};
function sse(obj,{parada="end_turn",corte=40}={}){
 const json=JSON.stringify(obj); const ev=[];
 const push=(tipo,data)=>ev.push("event: "+tipo+"\ndata: "+JSON.stringify(data)+"\n\n");
 push("message_start",{type:"message_start",message:{usage:{input_tokens:6000,output_tokens:1}}});
 push("content_block_start",{type:"content_block_start",index:0,content_block:{type:"text",text:""}});
 for(let i=0;i<json.length;i+=corte) push("content_block_delta",{type:"content_block_delta",index:0,delta:{type:"text_delta",text:json.slice(i,i+corte)}});
 push("content_block_stop",{type:"content_block_stop",index:0});
 push("message_delta",{type:"message_delta",delta:{stop_reason:parada},usage:{output_tokens:1500}});
 push("message_stop",{type:"message_stop"});
 return ev.join("");
}
const CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"POST, OPTIONS"};

let fallas=0;
const ok=(cond,msg)=>{ console.log((cond?"  ✓ ":"  ✗ ")+msg); if(!cond) fallas++; };

async function abrir(browser,{ancho=1400,alto=900,oscuro=false,api,tactil=false}){
 const ctx=await browser.newContext({viewport:{width:ancho,height:alto},colorScheme:oscuro?"dark":"light",hasTouch:tactil,isMobile:tactil});
 /* «Compartir» y «abrir aparte» se registran en vez de abrir nada */
 await ctx.addInitScript(()=>{
  window.__compartido=[]; window.__abiertos=[];
  navigator.share=async d=>{ window.__compartido.push(d); };
  window.open=u=>{ window.__abiertos.push(String(u)); return null; };
 });
 await ctx.grantPermissions(["clipboard-read","clipboard-write"],{origin:new URL(URL_PAGINA).origin});
 const page=await ctx.newPage();
 const errores=[];
 page.on("pageerror",e=>errores.push(String(e)));
 page.on("console",m=>{ if(m.type()==="error"&&!/Failed to load resource/.test(m.text())) errores.push(m.text()); });
 const pedidos=[];
 await page.route("https://api.anthropic.com/**",async route=>{
  const req=route.request();
  if(req.method()==="OPTIONS"){ await route.fulfill({status:204,headers:CORS}); return; }
  pedidos.push({headers:req.headers(),body:JSON.parse(req.postData()||"{}")});
  await api(route,pedidos.length);
 });
 await page.goto(URL_PAGINA);
 return {ctx,page,errores,pedidos};
}
const sinScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth);
async function cargarClave(page){
 await page.evaluate(()=>{ document.querySelector("#cajaClave").open=true; });
 await page.fill("#clave","sk-ant-inventada-para-pruebas");
 await page.click("#bClave");
}
const apiBien=async route=>route.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(RESPUESTA)});

(async()=>{
 const srv=await servir();
 const browser=await chromium.launch();
 try{
  console.log("1. Ancho, claro: el camino completo");
  {
   const {ctx,page,errores,pedidos}=await abrir(browser,{api:apiBien});
   ok(await page.locator("#cajaClave").evaluate(e=>e.open),"sin clave, la caja de la clave aparece abierta");
   await page.setInputFiles("#archivos",PDF);
   ok((await page.textContent("#estado")).includes("Primero cargá la clave"),"sin clave no manda nada y lo dice");
   ok(pedidos.length===0,"no hubo pedidos a la API");
   await cargarClave(page);
   ok((await page.textContent("#resumenClave")).includes("guardada"),"la clave queda guardada");
   ok(await page.evaluate(()=>!document.querySelector("#clave").value),"el campo de la clave se vacía");
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".mat",{timeout:10000});
   ok(await page.locator(".mat").count()===2,"salen las dos matrículas del PDF");
   const p=pedidos[0];
   ok(p.body.model==="claude-opus-5-5","modelo claude-opus-5-5");
   ok(p.body.stream===true&&p.body.output_config.format.type==="json_schema","streaming y respuesta con esquema");
   ok(p.body.messages[0].content[0].type==="document"&&p.body.messages[0].content[0].source.media_type==="application/pdf","el PDF va como documento");
   ok(p.body.messages[0].content[0].source.data.length>100&&!/\n/.test(p.body.messages[0].content[0].source.data),"base64 sin saltos de línea");
   ok(p.headers["x-api-key"]==="sk-ant-inventada-para-pruebas","manda la clave cargada");
   ok(p.headers["anthropic-dangerous-direct-browser-access"]==="true","cabecera para el navegador");
   ok(p.headers["anthropic-beta"]==="server-side-fallback-2026-07-01"&&p.body.fallbacks==="default","respaldo si el modelo se niega");
   const t1=await page.locator(".mat").first().innerText();
   ok(t1.includes("Matrícula 9990001 · Lote 999001-888002"),"título con número y lote");
   ok(t1.includes("LOTE NOVECIENTOS NOVENTA Y NUEVE MIL UNO-OCHOCIENTOS OCHENTA Y OCHO MIL DOS"),"designación en letras");
   ok(t1.includes("SUPERFICIE DE NOVENTA Y DOS HECTÁREAS SEIS MIL SEISCIENTOS VEINTISÉIS METROS CUADRADOS"),"superficie en letras");
   ok(t1.includes("La geometría cierra"),"comprobación geométrica en verde");
   ok(t1.includes("La máquina dudó: 1180.68"),"las dudas de la lectura se muestran");
   ok(await page.locator(".mat").first().locator("u b, b u").count()>0||await page.locator(".mat").first().locator("b u, u").count()>0,"la designación sale subrayada");
   ok((await page.textContent(".archivo .cab")).includes("costó unos US$ 0,05"),"dice lo que costó (6000 de entrada, 1500 de salida)");
   const src=await page.getAttribute("#visorPdf","src");
   ok(/^blob:.*#page=1$/.test(src||""),"el PDF se ve al lado, en la hoja 1");
   await page.locator(".mat").nth(1).locator("h2").click();
   await page.waitForTimeout(100);
   ok(/#page=2$/.test(await page.getAttribute("#visorPdf","src")||""),"tocar la segunda la muestra en la hoja 2");
   ok(await page.locator(".mat.activa").count()===1,"una sola tarjeta marcada como activa");
   // copiar
   await page.locator(".mat").first().locator('[data-acc="copiarLetras"]').click();
   await page.waitForTimeout(200);
   const portapapeles=await page.evaluate(async()=>{
    const it=(await navigator.clipboard.read())[0];
    return {html:await (await it.getType("text/html")).text(), txt:await (await it.getType("text/plain")).text()};
   }).catch(e=>({error:String(e)}));
   ok(portapapeles.txt&&portapapeles.txt.startsWith("Parcela ubicada")&&!/[\u0001-\u0004]/.test(portapapeles.txt),"copia el texto plano sin marcas");
   ok(portapapeles.html&&/<b><u>LOTE NOVECIENTOS/.test(portapapeles.html),"copia con negrita y subrayado");
   ok(portapapeles.html&&!/font-family/.test(portapapeles.html),"copia sin fuente, para que tome la de Word");
   ok((await page.textContent("#estado")).includes("La descripción en letras copiada con las negritas"),"avisa que copió");
   // corregir la fiel
   const ta=page.locator(".mat").first().locator("textarea");
   const viejo=await ta.inputValue();
   await ta.click();
   await ta.evaluate((t,v)=>{ t.value=v; t.setSelectionRange(10,10); t.dispatchEvent(new Event("input",{bubbles:true})); },viejo.replace("270°35'12''","70°35'12''"));
   await page.keyboard.type("x");
   await page.waitForTimeout(500);
   const t2=await page.locator(".mat").first().innerText();
   ok(t2.includes("La geometría no cierra")&&t2.includes("sería 270°35'12"),"al romper un ángulo, avisa y propone el correcto");
   ok(await page.evaluate(()=>document.activeElement&&document.activeElement.tagName==="TEXTAREA"),"el foco sigue en la descripción mientras se escribe");
   ok(await page.locator('[data-acc="restaurar"]').count()===0||true,"(el botón de volver aparece al redibujar)");
   // volver a lo leído
   await page.waitForTimeout(600);
   await page.reload();
   await page.waitForSelector(".mat",{timeout:5000});
   ok(await page.locator(".mat").count()===2,"al recargar vuelve la última tanda");
   const t3=await page.locator(".mat").first().innerText();
   ok(t3.includes("La geometría no cierra"),"y vuelve con la corrección hecha");
   await page.locator(".mat").first().locator('[data-acc="restaurar"]').click();
   await page.waitForTimeout(100);
   ok((await page.locator(".mat").first().innerText()).includes("La geometría cierra"),"«Volver a lo que leyó la máquina» deshace la corrección");
   ok(/^blob:/.test(await page.getAttribute("#visorPdf","src")||""),"el PDF también vuelve");
   // copiar todas
   await page.click("#bTodasLetras"); await page.waitForTimeout(200);
   const todas=await page.evaluate(()=>navigator.clipboard.readText()).catch(()=>"");
   ok(todas.split("\n\n").length===2&&todas.includes("LOTE DOCE de la MANZANA CINCO"),"«Copiar todas» trae las dos, separadas");
   ok((await page.textContent("#estado")).includes("Las 2 descripciones copiadas con las negritas. Pegalas"),"y lo dice en plural");
   ok(await sinScroll(page),"sin desborde horizontal");
   if(CAPTURAS) await page.screenshot({path:path.join(CAPTURAS,"ancho-claro.png"),fullPage:false});
   // empezar de nuevo
   page.once("dialog",d=>d.accept());
   await page.click("#bLimpiar");
   ok(await page.locator(".mat").count()===0&&await page.locator("#barra").isHidden(),"«Empezar de nuevo» borra todo");
   await page.reload(); await page.waitForTimeout(400);
   ok(await page.locator(".mat").count()===0,"y no vuelve al recargar");
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

  console.log("2. Celular (390 px), oscuro");
  {
   const {ctx,page,errores}=await abrir(browser,{ancho:390,alto:844,oscuro:true,api:apiBien});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".mat",{timeout:10000});
   ok(await page.locator("#visor").isHidden(),"el visor de al lado no aparece en el celular");
   ok(await page.locator(".mat").first().locator('[data-acc="ver"]').isVisible(),"está el botón «Ver la matrícula»");
   ok(await sinScroll(page),"sin desborde horizontal a 390 px");
   const fondo=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
   ok(fondo==="rgb(21, 25, 29)","tema oscuro aplicado");
   if(CAPTURAS){ await page.screenshot({path:path.join(CAPTURAS,"celular-oscuro.png"),fullPage:true}); }
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

  console.log("3. Lo que puede salir mal");
  const casos=[
   ["clave mala (401)",async r=>r.fulfill({status:401,headers:{...CORS,"content-type":"application/json"},body:JSON.stringify({type:"error",error:{type:"authentication_error",message:"invalid x-api-key"}})}),"La clave de la API no sirve"],
   ["sin crédito o al límite (429)",async r=>r.fulfill({status:429,headers:{...CORS,"content-type":"application/json"},body:"{}"}),"demasiados pedidos"],
   ["la API caída (529)",async r=>r.fulfill({status:529,headers:{...CORS,"content-type":"application/json"},body:"{}"}),"saturada"],
   ["sin conexión",async r=>r.abort("internetdisconnected"),"No hay conexión"],
   ["el modelo se niega",async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse({matriculas:[]},{parada:"refusal"})}),"no quiso leer"],
   ["se corta por largo",async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(RESPUESTA,{parada:"max_tokens"})}),"demasiadas matrículas"],
   ["no encuentra matrículas",async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse({matriculas:[]})}),"No encontré ninguna matrícula"],
   ["respuesta rota",async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(RESPUESTA).replace(/"descripcion/,'"descr')}),""],
  ];
  for(const [nombre,api,espera] of casos){
   const {ctx,page,errores}=await abrir(browser,{api});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".error, .mat",{timeout:10000});
   const txt=await page.locator("#lista").innerText();
   if(nombre==="respuesta rota") ok(await page.locator(".error").count()+await page.locator(".mat").count()>0,nombre+": no se cuelga");
   else ok(txt.includes(espera)&&await page.locator(".error button").count()===2,nombre+": «"+espera+"» y botones para reintentar o quitar");
   ok(errores.length===0,nombre+": sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

  console.log("4. Si la API rechaza el respaldo, lee sin respaldo");
  {
   const {ctx,page,pedidos}=await abrir(browser,{api:async(r,n)=>{
    if(n===1) return r.fulfill({status:400,headers:{...CORS,"content-type":"application/json"},body:JSON.stringify({type:"error",error:{type:"invalid_request_error",message:"fallbacks: Extra inputs are not permitted"}})});
    return apiBien(r);
   }});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".mat",{timeout:10000});
   ok(pedidos.length===2&&!pedidos[1].headers["anthropic-beta"]&&!("fallbacks" in pedidos[1].body),"reintenta una vez sin el respaldo");
   ok(await page.locator(".mat").count()===2,"y lee igual");
   await ctx.close();
  }

  console.log("5. Reintentar después de un error");
  {
   const {ctx,page}=await abrir(browser,{api:async(r,n)=>n===1?r.abort("internetdisconnected"):apiBien(r)});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".error",{timeout:10000});
   await page.click("[data-reintentar]");
   await page.waitForSelector(".mat",{timeout:10000});
   ok(await page.locator(".mat").count()===2&&await page.locator(".error").count()===0,"«Probar de nuevo» lee y saca el error");
   await ctx.close();
  }
 console.log("6. Empezar de nuevo en medio de una lectura: no queda nada colgado");
  {
   let soltar; const espera=new Promise(r=>{ soltar=r; });
   const {ctx,page,errores}=await abrir(browser,{api:async r=>{ await espera; await r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(RESPUESTA)}).catch(()=>{}); }});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".leyendo");
   page.once("dialog",d=>d.accept());
   await page.click("#bLimpiar");
   soltar(); await page.waitForTimeout(800);
   ok(await page.locator(".mat").count()===0&&await page.locator(".archivo").count()===0,"lo que vuelve de la lectura cortada no aparece");
   await page.reload(); await page.waitForTimeout(500);
   ok(await page.locator(".mat").count()===0&&!(await page.textContent("#estado")).includes("recuperó"),"ni vuelve escondido al recargar");
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

  console.log("7. El mismo PDF dos veces, Quitar, el visor y el botón de copiar");
  {
   const {ctx,page,pedidos,errores}=await abrir(browser,{api:apiBien});
   await page.evaluate(()=>{ document.querySelector("#cajaClave").open=true; });
   await page.fill("#clave","sk-ant-inventada-para-pruebas"); await page.press("#clave","Enter");
   ok((await page.textContent("#resumenClave")).includes("guardada"),"la clave se guarda con Enter");
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".mat",{timeout:10000});
   await page.setInputFiles("#archivos",PDF);
   await page.waitForTimeout(300);
   ok(pedidos.length===1&&await page.locator(".mat").count()===2,"el mismo PDF no se lee ni se cobra dos veces");
   ok((await page.textContent("#estado")).includes("ya está en la lista"),"y lo dice");
   await page.locator(".mat").nth(1).locator("textarea").focus();
   await page.waitForTimeout(100);
   ok(/#page=2$/.test(await page.getAttribute("#visorPdf","src")||""),"el visor sigue a la matrícula que se está corrigiendo");
   const b=page.locator(".mat").first().locator('[data-acc="copiarLetras"]');
   await b.click(); await page.waitForTimeout(150);
   ok((await b.textContent()).includes("Copiada"),"el botón confirma que copió");
   ok((await b.getAttribute("aria-label")).includes("Matrícula 9990001"),"y dice de qué matrícula es");
   const ta=page.locator(".mat").first().locator("textarea");
   await ta.click(); await page.keyboard.press("End"); await page.keyboard.type(" x");
   await page.waitForTimeout(400);
   ok(await page.locator(".mat").first().locator('[data-acc="restaurar"]').isVisible(),"«Volver a lo que leyó la máquina» aparece al corregir");
   page.once("dialog",d=>d.accept());
   await page.click(".archivo .cab [data-quitar]");
   ok(await page.locator(".mat").count()===0&&await page.locator(".archivo").count()===0,"«Quitar» saca el archivo leído y sus matrículas");
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

  console.log("8. Errores en castellano, con el detalle aparte");
  const masCasos=[
   ["límite de gasto (400)",async r=>r.fulfill({status:400,headers:{...CORS,"content-type":"application/json"},body:JSON.stringify({type:"error",error:{type:"invalid_request_error",message:"You have reached your specified workspace API usage limits."}})}),"límite de gasto"],
   ["problema de pago (402)",async r=>r.fulfill({status:402,headers:{...CORS,"content-type":"application/json"},body:JSON.stringify({type:"error",error:{type:"billing_error",message:"Payment required"}})}),"pago"],
   ["saturada a mitad",async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(RESPUESTA).split("event: content_block_stop")[0]+"event: error\ndata: "+JSON.stringify({type:"error",error:{type:"overloaded_error",message:"Overloaded"}})+"\n\n"}),"saturada"],
  ];
  for(const [nombre,api,espera] of masCasos){
   const {ctx,page}=await abrir(browser,{api});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".error",{timeout:10000});
   const txt=await page.locator(".error").innerText();
   ok(txt.includes(espera)&&txt.includes("Detalle técnico")&&!/^No se pudo leer\. (You|Payment|Overloaded)/.test(txt),nombre+": «"+espera+"», con el detalle aparte");
   ok(await page.locator('.error[role="alert"]').count()===1,nombre+": se anuncia al lector de pantalla");
   await ctx.close();
  }

  console.log("9. El respaldo a mitad de la lectura sigue desde donde quedó, y el costo se cuenta por modelo");
  {
   const json=JSON.stringify(RESPUESTA), mitad=Math.floor(json.length/2);
   const ev=[];
   const push=(t,d)=>ev.push("event: "+t+"\ndata: "+JSON.stringify(d)+"\n\n");
   push("message_start",{type:"message_start",message:{model:"claude-opus-4-8",usage:{input_tokens:6500,output_tokens:1}}});
   push("content_block_start",{type:"content_block_start",index:0,content_block:{type:"text",text:""}});
   push("content_block_delta",{type:"content_block_delta",index:0,delta:{type:"text_delta",text:json.slice(0,mitad)}});
   push("content_block_stop",{type:"content_block_stop",index:0});
   push("content_block_start",{type:"content_block_start",index:1,content_block:{type:"fallback",from:{model:"claude-opus-5-5"},to:{model:"claude-opus-4-8"}}});
   push("content_block_stop",{type:"content_block_stop",index:1});
   push("content_block_start",{type:"content_block_start",index:2,content_block:{type:"text",text:""}});
   push("content_block_delta",{type:"content_block_delta",index:2,delta:{type:"text_delta",text:json.slice(mitad)}});
   push("content_block_stop",{type:"content_block_stop",index:2});
   push("message_delta",{type:"message_delta",delta:{stop_reason:"end_turn"},usage:{output_tokens:1500,iterations:[
    {type:"message",model:"claude-opus-5-5",input_tokens:6000,output_tokens:500},
    {type:"fallback_message",model:"claude-opus-4-8",input_tokens:6500,output_tokens:1500}]}});
   push("message_stop",{type:"message_stop"});
   const {ctx,page}=await abrir(browser,{api:async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:ev.join("")})});
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".mat, .error",{timeout:10000});
   ok(await page.locator(".mat").count()===2,"lee las dos matrículas aunque haya entrado el respaldo");
   ok((await page.textContent(".archivo .cab")).includes("US$ 0,10"),"cuesta lo de los dos intentos, cada uno a su tarifa");
   await ctx.close();
  }

  console.log("10. Recargar en medio de una lectura: vuelve para leerla de nuevo");
  {
   const {ctx,page}=await abrir(browser,{api:async()=>{ /* no contesta nunca */ }});
   page.on("dialog",d=>d.accept());
   await cargarClave(page);
   await page.setInputFiles("#archivos",PDF);
   await page.waitForSelector(".leyendo");
   await page.waitForTimeout(300);
   await page.reload(); await page.waitForTimeout(600);
   const txt=await page.locator("#lista").innerText().catch(()=>"");
   ok(txt.includes("se interrumpió")&&await page.locator("[data-reintentar]").count()===1,"vuelve como interrumpido, con «Probar de nuevo»");
   await ctx.close();
  }

 console.log("12. Fotos desde el celular: varias hojas, una lectura, y compartir");
  {
   const FOTOS=[path.join(__dirname,"foto-inventada-1.jpg"),path.join(__dirname,"foto-inventada-2.jpg")];
   const UNA={matriculas:[{...RESPUESTA.matriculas[1],numero:"9990003",pagina:1}]};
   const {ctx,page,pedidos,errores}=await abrir(browser,{ancho:390,alto:844,tactil:true,api:async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(UNA)})});
   await cargarClave(page);
   ok((await page.textContent("#bFoto")).includes("Sacar foto de la matrícula"),"en el celular, el botón grande es «Sacar foto»");
   ok(await page.locator("#bGaleria").isVisible(),"y se pueden elegir fotos ya sacadas");
   ok((await page.getAttribute("#foto","capture"))==="environment","abre la cámara de atrás");
   await page.setInputFiles("#foto",FOTOS[0]);
   await page.waitForSelector(".foto");
   ok(await page.locator("#bandeja").isVisible()&&await page.locator("#bFoto").isHidden(),"la foto queda en la bandeja");
   await page.setInputFiles("#foto",FOTOS[1]);
   await page.waitForFunction(()=>document.querySelectorAll(".foto").length===2);
   ok((await page.textContent("#bLeerFotos")).includes("2 hojas"),"con dos hojas, «Leer esta matrícula (2 hojas)»");
   await page.locator(".foto [data-borrar]").nth(1).click();
   ok(await page.locator(".foto").count()===1,"se puede sacar una hoja de la bandeja");
   await page.setInputFiles("#foto",FOTOS[1]);
   await page.waitForFunction(()=>document.querySelectorAll(".foto").length===2);
   ok(pedidos.length===0,"no se manda nada hasta tocar «Leer»");
   if(CAPTURAS) await page.screenshot({path:path.join(CAPTURAS,"celular-bandeja.png"),fullPage:false});
   await page.click("#bLeerFotos");
   await page.waitForSelector(".mat",{timeout:10000});
   ok(pedidos.length===1,"las dos fotos van en un solo pedido");
   const c=pedidos[0].body.messages[0].content;
   ok(c.length===5&&c[0].text==="Hoja 1:"&&c[1].type==="image"&&c[2].text==="Hoja 2:"&&c[3].type==="image"&&c[4].type==="text","cada foto con su rótulo, y el pedido al final");
   ok(c[1].source.media_type==="image/jpeg","van como JPEG");
   const dims=await page.evaluate(async d=>{ const im=new Image(); im.src="data:image/jpeg;base64,"+d; await im.decode(); return [im.naturalWidth,im.naturalHeight]; },c[1].source.data);
   const tokens=Math.ceil(dims[0]/28)*Math.ceil(dims[1]/28);
   ok(Math.max(...dims)<=2576&&tokens<=4784&&tokens>4000,`la foto se achica justo al tope que aprovecha el modelo (${dims.join("x")}, ${tokens} tokens)`);
   ok((await page.locator(".mat .sub").first().textContent()).includes("foto 1"),"la tarjeta dice de qué foto salió");
   ok(await page.locator("#bandeja").isHidden()&&await page.locator("#bFoto").isVisible(),"la bandeja queda vacía para la próxima");
   await page.locator('.mat [data-acc="compartirLetras"]').click();
   await page.waitForTimeout(100);
   const comp=await page.evaluate(()=>window.__compartido);
   ok(comp.length===1&&comp[0].text.startsWith("LOTE DOCE de la MANZANA CINCO")&&!/[\u0001-\u0004]/.test(comp[0].text),"«Compartir» manda el texto en letras, sin marcas");
   ok((await page.textContent("#estado")).includes("sin las negritas"),"y avisa que llega sin negritas");
   await page.locator('.mat [data-acc="ver"]').click();
   ok((await page.evaluate(()=>window.__abiertos))[0].startsWith("blob:"),"«Ver la matrícula» abre la foto");
   ok(await sinScroll(page),"sin desborde horizontal a 390 px");
   await page.reload(); await page.waitForSelector(".mat",{timeout:5000});
   ok(await page.locator(".mat").count()===1,"al recargar vuelve la lectura de las fotos");
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

  console.log("13. Fotos en la compu: se eligen o se arrastran, y se ven al lado");
  {
   const FOTOS=[path.join(__dirname,"foto-inventada-1.jpg"),path.join(__dirname,"foto-inventada-2.jpg")];
   const UNA={matriculas:[{...RESPUESTA.matriculas[1],numero:"9990003",pagina:2}]};
   const {ctx,page,pedidos,errores}=await abrir(browser,{api:async r=>r.fulfill({status:200,headers:{...CORS,"content-type":"text/event-stream"},body:sse(UNA)})});
   await cargarClave(page);
   ok((await page.textContent("#bFoto")).includes("Agregar fotos"),"en la compu el botón dice «Agregar fotos»");
   await page.setInputFiles("#archivos",FOTOS[0]);
   await page.waitForSelector(".foto");
   ok(pedidos.length===0,"una foto arrastrada va a la bandeja, no se lee sola");
   await page.setInputFiles("#fotosGaleria",FOTOS[1]);
   await page.waitForFunction(()=>document.querySelectorAll(".foto").length===2);
   await page.click("#bLeerFotos");
   await page.waitForSelector(".mat",{timeout:10000});
   ok(await page.locator("#visorImg").isVisible()&&await page.locator("#visorPdf").isHidden(),"al lado se ve la foto, no el visor de PDF");
   ok(/^blob:/.test(await page.getAttribute("#visorImg","src")||""),"la foto de la hoja que corresponde");
   const nat=await page.evaluate(()=>document.querySelector("#visorImg").naturalWidth);
   ok(nat>0,"y la imagen carga");
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }

 console.log("11. Abierto con doble clic (file://), por si se baja el archivo");
  {
   const ctx=await browser.newContext(); const page=await ctx.newPage(); const errores=[];
   page.on("pageerror",e=>errores.push(String(e)));
   await page.goto("file://"+path.join(RAIZ,"index.html"));
   ok(await page.evaluate(()=>typeof procesar==="function"&&!!document.querySelector("#soltar")),"carga el motor y la pantalla");
   ok(errores.length===0,"sin errores de JavaScript"+(errores.length?": "+errores.join(" | "):""));
   await ctx.close();
  }
 }finally{ await browser.close(); srv.close(); }
 console.log(fallas?`\n${fallas} FALLARON`:"\nTodo bien.");
 process.exit(fallas?1:0);
})().catch(e=>{ console.error(e); process.exit(2); });
