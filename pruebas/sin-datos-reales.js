/* Antes de commitear, si en la sesión se trabajó con matrículas reales: busca en el
   repositorio los números de esas matrículas y corta si encuentra alguno.
   Se corre con: node pruebas/sin-datos-reales.js <archivo-con-los-datos-reales>
   El archivo vive FUERA del repositorio (el scratchpad de la sesión, o datos-reales/, que git
   ignora). Puede ser cualquier texto o JSON: se sacan de ahí los números de cuatro o más
   dígitos (con o sin decimales) y los ángulos. Nunca imprime el número encontrado, sólo
   dónde está y qué forma tiene. */
const fs=require("fs"), path=require("path"), {execFileSync}=require("child_process");
const fuente=process.argv[2];
if(!fuente||!fs.existsSync(fuente)){ console.error("Uso: node pruebas/sin-datos-reales.js <archivo-con-los-datos-reales>"); process.exit(2); }
const RAIZ=path.resolve(__dirname,"..");
const txt=fs.readFileSync(fuente,"utf8");
const buscados=new Map();
for(const m of txt.matchAll(/\d{1,3}\s*°\s*\d{1,2}\s*'\s*\d{1,2}/g)){
 const v=m[0].replace(/\s/g,"");
 if(/°00'00$/.test(v)) continue;                              /* 90°00'00": un ángulo recto no identifica nada */
 buscados.set(v,"un ángulo");
}
for(const m of txt.matchAll(/\d+(?:[.,]\d+)+|\d{4,}/g)){
 const v=m[0];
 if(/^(19|20)\d\d$/.test(v)) continue;                     /* los años solos no identifican a nadie */
 if(v.replace(/\D/g,"").length<4) continue;                  /* «2,2», «9.00»: demasiado cortos para decir algo */
 buscados.set(v,/[.,]/.test(v)?"un número con decimales o puntos":"un número de "+v.length+" dígitos");
}
const archivos=execFileSync("git",["-C",RAIZ,"ls-files","--cached","--others","--exclude-standard"],{encoding:"utf8"}).split("\n").filter(Boolean);
let hallados=0;
for(const f of archivos){
 let c; try{ c=fs.readFileSync(path.join(RAIZ,f),"utf8"); }catch(e){ continue; }
 const lineas=c.split("\n");
 lineas.forEach((l,i)=>{
  const plano=l.replace(/\s/g,"");
  for(const [v,forma] of buscados){
   const re=new RegExp("(?<![\\d.,])"+v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?![\\d])");
   if(re.test(/°/.test(v)?plano:l)){ console.log(`${f}:${i+1}: ${forma} de los datos reales`); hallados++; }
  }
 });
}
if(hallados){ console.log(`\n${hallados} coincidencias. Cambialas por datos inventados antes de commitear.`); process.exit(1); }
console.log(`Ningún número de ${path.basename(fuente)} aparece en el repositorio (${buscados.size} buscados, ${archivos.length} archivos).`);
