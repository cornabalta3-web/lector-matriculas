/* Motor del lector de matrículas. No sabe nada de la pantalla ni de la API: recibe el texto
   de la descripción, tal como lo transcribió la máquina, y devuelve las dos versiones —fiel y
   en letras—, los avisos y la comprobación geométrica.

   Los números en letras vienen de minuta-social.html (SIGEC), con dos cambios: sólo se pasa
   a letras lo que nombra el art. 54 L.O.N. —medidas, superficie, designación del lote y
   números de vértice— y entiende hectáreas, que en las matrículas rurales son lo normal.
   Todos los ejemplos de los comentarios son inventados. */

/* ════════════ números en letras ════════════ */
const U=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez",
"once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve",
"veinte","veintiuno","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis",
"veintisiete","veintiocho","veintinueve"];
const D=["","","","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
const C=["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos",
"setecientos","ochocientos","novecientos"];
function hasta999(n,fem){
 if(n===0) return "";
 if(n===100) return "cien";
 let s=""; const c=Math.floor(n/100), r=n%100;
 if(c){ s=C[c]; if(fem&&c>1) s=s.replace(/os$/,"as"); }
 if(r){
  let t;
  if(r<30){ t=U[r]; if(fem&&(r===1||r===21)) t=r===1?"una":"veintiuna"; }
  else{ const d=Math.floor(r/10), u=r%10; t=D[d]+(u?" y "+(fem&&u===1?"una":U[u]):""); }
  s+=(s?" ":"")+t;
 }
 return s;
}
const apoc=s=>s.replace(/\buno$/,"un").replace(/\bveintiuno$/,"veintiún");
/* fem: para «hectáreas», «áreas» y «centiáreas», que son femeninos: «doscientas una hectáreas».
   De mil millones para arriba no hay nada que escribir en una matrícula: si aparece, es un
   código al que se le perdió el guion, y queda en número (convertir() lo avisa). */
function letras(n,fem){
 n=Math.floor(Math.abs(Number(n)||0));
 if(!Number.isFinite(n)||n>=1e9) return String(n);
 if(n===0) return "cero";
 const mill=Math.floor(n/1000000), mil=Math.floor((n%1000000)/1000), res=n%1000, p=[];
 if(mill) p.push(mill===1?"un millón":apoc(hasta999(mill))+" millones");
 if(mil)  p.push(mil===1?"mil":apoc(hasta999(mil,fem))+" mil");
 if(res)  p.push(hasta999(res,fem));
 return p.join(" ");
}
/* desde el texto: con más de nueve cifras, queda como está */
const lx=(s,fem)=>{ const d=String(s).replace(/\./g,"").replace(/^0+(?=\d)/,""); return d.length>9?String(s):letras(+d,fem); };
const may=s=>String(s||"").toLocaleUpperCase("es-AR");
const esMayus=s=>/\p{L}/u.test(s)&&s===may(s);
/* ¿el texto que rodea está escrito todo en mayúscula? Se mira la palabra de antes */
const contextoMayus=(todo,off)=>{ const m=/([\p{L}]{2,})[^\p{L}]*$/u.exec(todo.slice(Math.max(0,off-30),off)); return !!m&&esMayus(m[1]); };

/* «482.17», «1534,26», «2.716,05», «7.00». Con coma, los puntos son de miles; sin coma, el
   punto es decimal sólo si le siguen uno o dos dígitos al final. */
function partirNum(v){
 let s=String(v).trim();
 if(s.indexOf(",")<0&&/\.\d{1,2}$/.test(s)) s=s.replace(/\.(\d{1,2})$/,",$1");
 s=s.replace(/\./g,"");
 const m=/^(\d+)(?:,(\d{1,2}))?$/.exec(s);
 if(!m||m[1].replace(/^0+(?=\d)/,"").length>9) return null;
 return {ent:parseInt(m[1],10), dec:m[2]?parseInt(m[2].padEnd(2,"0"),10):0};
}
const valorNum=v=>{ const p=partirNum(v); return p?p.ent+p.dec/100:NaN; };
function metrosTxt(p){
 let s="";
 if(p.ent>0||p.dec===0) s+=apoc(letras(p.ent))+" metro"+(p.ent===1?"":"s");
 if(p.dec>0) s+=(s?" con ":"")+apoc(letras(p.dec))+" centímetro"+(p.dec===1?"":"s");
 return s;
}
function m2Txt(p){
 return may(apoc(letras(p.ent)))+(p.ent===1?" METRO CUADRADO":" METROS CUADRADOS")
  +(p.dec?" CON "+may(apoc(letras(p.dec)))+(p.dec===1?" DECÍMETRO CUADRADO":" DECÍMETROS CUADRADOS"):"");
}

/* ════════════ la versión fiel ════════════ */
/* Lo que dice la matrícula, sin las barras de relleno y con los renglones unidos. Nada más: ni
   la ortografía ni la puntuación se corrigen, y los espacios de adentro de un renglón quedan
   como están. Cómo se unen los renglones:
   - la barra suelta al final es relleno («a partir de 6/»), salvo que la siga un número en el
     renglón de abajo (la de un expediente o una fecha: «0000-123456/» + «2019») o que sea la
     de una abreviatura de una letra («c/», «s/», «S/N», «y/o»);
   - el número cortado después de la coma o del punto se pega («482.» + «17 m») y se avisa,
     salvo que sea una lista o el fin de una oración («lotes 6,» + «7 y 8», «Lote 14.» + «25 m»);
     dos números en los bordes de dos renglones se dejan separados, y se avisa;
   - el guion pegado a una palabra o a un número une sin espacio («999001-» + «888002»); el que
     tiene un espacio adelante es un separador («UNIDAD 7 -» + «POSICIÓN») y no;
   - el «°» de un ángulo se pega a los minutos de abajo («87°» + «14'36"»), el de «N°» no. */
function limpiar(entrada,info){
 const lineas=(Array.isArray(entrada)?entrada:String(entrada||"").split(/\r?\n/))
  .map(l=>String(l).replace(/^\s+/,"")).filter(l=>l.replace(/[\s\/_]/g,""));
 const cortes=[];
 let t="";
 for(let i=0;i<lineas.length;i++){
  let l=lineas[i];
  const sig=lineas[i+1]||"";
  if(/\d\s*\/\s*$/.test(l)&&/^\d/.test(sig)&&!/\/\s*\/\s*$/.test(l)) l=l.replace(/\s*\/\s*$/,"/");
  else if(/(?:^|[\s(])\p{L}\/\s*$/u.test(l)&&!/\/\s*\/\s*$/.test(l)) l=l.replace(/\s*$/,"");
  else l=l.replace(/[\s\/_]+$/,"");
  if(!t){ t=l; continue; }
  if(/\/$/.test(t)&&/^[\p{L}\d]/u.test(l)) t+=l;
  else if(/\d[.,]$/.test(t)&&/^\d/.test(l)){
   const lista=/(?:lotes?|parcelas?|manzanas?|n[°º]\.?)\s*\d+[.,]$/i.test(t)||/\d+,\s*\d+,$/.test(t)||!/^\d{1,2}(?!\d)/.test(l);
   if(lista){ t+=" "+l; }
   else{ cortes.push((t.match(/\d+[.,]$/)||[""])[0]+l.match(/^\d+/)[0]); t+=l; }
  }
  else if(/\d$/.test(t)&&/^\d/.test(l)){ cortes.push((t.match(/\d+$/)||[""])[0]+" "+l.match(/^\d+/)[0]); t+=" "+l; }
  else if(/\p{L}-$/u.test(t)&&/^\p{Ll}/u.test(l)) t=t.slice(0,-1)+l;      /* «descrip-» + «ción» */
  else if(/[\p{L}\d]-$/u.test(t)) t+=l;                                  /* «999001-» + «888002» */
  else if(/\d\s*[°º]$/.test(t)&&/^\d/.test(l)) t+=l;
  else if(/^[,.;:]/.test(l)) t+=l;
  else t+=" "+l;
 }
 if(info) info.cortes=cortes;
 return t
  .replace(/[   ]/g," ")
  .replace(/\s*\/{2,}\s*/g," ")
  .replace(/\s*_{2,}\s*/g," ")
  .replace(/[ \t\r\n]+/g," ")
  .trim();
}

/* ════════════ la versión en letras ════════════ */
/* Marcas de formato dentro del texto: \u0001…\u0002 negrita y subrayado, \u0003…\u0004
   negrita. Son las de la EGG: la designación del lote, negrita y subrayada; la superficie,
   negrita. */
const NS="\u0001", NS_="\u0002", NG="\u0003", NG_="\u0004";
const LET="A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
/* un número de medida: no puede empezar ni terminar pegado a otro número, así «12,345» no se
   parte en dos medidas; sí puede venir después de una coma pegada a una palabra («frente,30 m») */
const NUM="(?<!\\d)(?<!\\d[.,])(\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)(?![.,]?\\d)";
const ANGULO=/\d{1,3}\s*[°º]\s*\d{1,2}\s*['’´]\s*\d{1,2}(?:[.,]\d+)?\s*(?:''|"|″|”|’’|´´)?/g;
const UNIDAD_M2="(?:(?:m|ms|mts?|mtrs?)\\.?\\s?(?:2|²)\\.?|metros\\s+cuadrados|mts?\\.?\\s*cuadrados|mts?\\.?\\s*c(?:uadra)?dos\\.?|m\\.?\\s?c\\.)";
/* el rótulo admite las faltas del Registro: «superficei», «superfice» */
const ROT_SUP="(sup(?:er[a-zñ]*|\\.)?(?:\\s+(?:total|cubierta|cub\\.|descubierta|desc\\.|semicubierta|semicub\\.|propia|com[úu]n|edificada|libre|de\\s+terreno))*)(\\s*:\\s*|\\s+de\\s+|\\s+)";
const ENTRE="\\s*(?:,|y|con|-|–)?\\s*";
const RE_SUP_HA=new RegExp(ROT_SUP+"(\\d{1,3}(?:\\.\\d{3})+|\\d+)\\s*(?:has?|hect[áa]reas?)(\\.?)(?:"+ENTRE+"(\\d+)\\s*(?:as|ar|[áa]reas?|a)\\b(\\.?))?(?:"+ENTRE+"(\\d+)\\s*(?:cas|ca|centi[áa]reas?)\\b(\\.?))?(?:"+ENTRE+NUM+"\\s*("+UNIDAD_M2+"))?","gi");
const RE_SUP_M2=new RegExp(ROT_SUP+NUM+"\\s*("+UNIDAD_M2+")","gi");

/* ¿el punto de una abreviatura también cerraba la oración? Sí, si después no hay nada, si es
   el «.-» de cierre, o si empieza una palabra que abre oración («Linda», «Superficie»). Para
   las medidas, también si empieza una palabra con mayúscula y minúsculas («m. Linda»); para
   los rumbos no, porque ahí suele seguir el nombre del lindero («al N. Lote 6»). */
const PAL_ABRE="Linda|Lindando|Linderos|Superficie|Sup\\.|Mide|Midiendo|Encerrando|Que|Y\\s+linda|El|La|Los|Las|Sus?|Dicho|Dicha|Afecta|Inscripto|Plano|Partiendo";
const ABRE=new RegExp("^\\s+(?:"+PAL_ABRE+"|"+may(PAL_ABRE).replace(/\\S/g,"\\s")+")(?![\\p{L}])","u");
const puntoFinal=resto=>/^\s*$/.test(resto)||/^\s*-/.test(resto)||ABRE.test(resto)||/^\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(resto)?".":"";
const puntoRumbo=resto=>/^\s*$/.test(resto)||/^\s*-/.test(resto)||ABRE.test(resto)?".":"";

/* La designación del inmueble: una sola, la que anuncia el texto («designado como», «se
   designa en el plano como», «identificado como», «denominado», o al principio de la
   descripción). Nunca la de un lindero: si en lo que viene antes, sin un punto o un punto y
   coma en el medio, dice «linda» o «con la fracción», se saltea. Acepta la letra del lote
   («LOTE 5A», «LOTE 5 A», «LOTE 5-A») y la manzana. */
/* sin la bandera «i»: la letra del lote tiene que ser mayúscula si va separada («LOTE 5 A»), si no
   «LOTE 5 y responde» se leería como el lote «5 Y». Las palabras admiten las dos cajas a mano. */
const ci=w=>w.replace(/[a-záéíóúñ]/g,c=>"["+c+c.toUpperCase()+"]");
const VERBO="(?:"+ci("designad")+"[oaOA][sS]?|"+ci("se")+"\\s+"+ci("designa")+"[nN]?|"+ci("identificad")+"[oaOA][sS]?|"+ci("denominad")+"[oaOA][sS]?|"+ci("individualizad")+"[oaOA][sS]?)";
const DESIG=new RegExp(
 "(^\\s*|"+VERBO+"(?:\\s+[\\p{L}]+){0,4}?\\s+"+ci("como")+"\\s+(?:"+ci("el")+"\\s+|"+ci("la")+"\\s+)?|"+VERBO+"\\s+(?:"+ci("el")+"\\s+|"+ci("la")+"\\s+)?)"+
 "("+ci("lote")+"|"+ci("lte")+"\\.?|"+ci("parcela")+"|"+ci("fracci")+"[óoÓO][nN])\\s+([nN][°ºoO]\\.?\\s*)?(\\d+)(?:(\\s*-\\s*)(\\d+))?(\\s*-\\s*[A-Z]|\\s+[A-Z]|[A-Za-z])?(?![\\p{L}\\d])"+
 "(?:(\\s*,\\s*|\\s+"+ci("de")+"\\s+"+ci("la")+"\\s+|\\s*-\\s*|\\s+)("+ci("manzana")+"|"+ci("mz")+"[aA]?\\.?)\\s+([nN][°ºoO]\\.?\\s*)?([\"“]?[A-Z]{1,2}[\"”]?(?![\\p{L}])|\\d+))?","gu");
/* ¿lo que viene antes, desde el último fin de oración, habla de un lindero? («al N.» no corta) */
const enLindero=antes=>{
 const corte=Math.max(antes.lastIndexOf(";"),...[...antes.matchAll(/\.\s+(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g)].map(m=>m.index));
 return /lind[ae]\w*|con\s+(?:(?:la|el|los|las)\s+)?(?:fracci[óo]n|parcela|lote|manzana)s?(?![\p{L}])/iu.test(antes.slice(corte+1));
};

function convertir(texto,{letrasOn=true,cortes=[]}={}){
 const avisos=[];
 const guard=[];
 const g=s=>{guard.push(s);return "\u0005"+(guard.length-1)+"\u0006";};
 let t=String(texto||"");
 const largos=(t.match(/(?<![\d.,])\d{10,}(?![\d])/g)||[]);

 /* los ángulos y rumbos quedan en números: se guardan antes que nada */
 t=t.replace(ANGULO,g);

 /* la designación */
 let hayDesig=false;
 t=t.replace(DESIG,(m0,pre,lab,nro,a,sep,b,letra,con,mz,nro2,v,off,todo)=>{
  if(hayDesig) return m0;
  if(enLindero(todo.slice(Math.max(0,off-80),off)+pre)) return m0;
  hayDesig=true;
  if(!letrasOn) return pre+g(NS+m0.slice(pre.length)+NS_);
  const L={lte:"LOTE","lte.":"LOTE"}[lab.toLowerCase()]||may(lab);
  let s=L+" "+may(lx(a))+(b?sep.trim()+may(lx(b)):"");
  if(letra) s+=/-/.test(letra)?"-"+letra.replace(/[\s-]/g,"").toUpperCase():" "+letra.trim().toUpperCase();
  if(mz){
   const conector=/de\s+la/i.test(con)?" "+con.trim().replace(/\s+/g," ")+" ":con.trim()?con.trim()+" ":" ";
   s+=conector+"MANZANA "+(/^\d+$/.test(v)?may(lx(v)):v);
  }
  return pre+g(NS+s+NS_);
 });

 /* la superficie, rural: «superficie de 92 Has 6626 m2», «92 Ha. 66 As. 26 Cas.», «92 Has. y 6626 m2» */
 t=t.replace(RE_SUP_HA,(m0,lab,con,ha,p1,as,p2,cas,p3,m2,uni,off,todo)=>{
  const resto=todo.slice(off+m0.length);
  const ultimo=m2?(/\.$/.test(uni)?".":""):(p3||(cas?"":p2)||(as||cas?"":p1));
  const fin=ultimo?puntoFinal(resto):"";
  if(!letrasOn) return g(NG+m0.slice(0,m0.length-(ultimo?1:0))+NG_)+(ultimo?".":"");
  const pm=m2?partirNum(m2):null;
  const hTxt=lx(ha,true), h=+ha.replace(/\./g,"");
  let txt=may(lab)+(con.includes(":")?": ":/de/i.test(con)?" DE ":" ")+may(hTxt)+(h===1?" HECTÁREA":" HECTÁREAS");
  if(as&&+as) txt+=" "+may(lx(as,true))+(+as===1?" ÁREA":" ÁREAS");
  if(cas&&+cas) txt+=" "+may(lx(cas,true))+(+cas===1?" CENTIÁREA":" CENTIÁREAS");
  if(pm&&(pm.ent||pm.dec)) txt+=" "+m2Txt(pm);
  return g(NG+txt+NG_)+fin;
 });
 /* la superficie urbana: «superficie de 300,48 m2», «Superficie: 525 mts. cuadrados» */
 t=t.replace(RE_SUP_M2,(m0,lab,con,n,uni,off,todo)=>{
  const conPunto=/\.$/.test(uni);
  const fin=conPunto?puntoFinal(todo.slice(off+m0.length)):"";
  const p=partirNum(n); if(!p) return m0;
  if(!letrasOn) return g(NG+(conPunto?m0.slice(0,-1):m0)+NG_)+(conPunto?".":"");
  return g(NG+may(lab)+(con.includes(":")?": ":/de/i.test(con)?" DE ":" ")+m2Txt(p)+NG_)+fin;
 });

 if(letrasOn){
  /* medidas con unidad, en cualquier caja: «627,48 m», «12 mts.», «10 MTS.», «15 m. de frente»,
     «10 mts.de fte.», «1 metro». Si después viene «2», «²», «cuadrados» o «cdos.» es una
     superficie sin rótulo: no se toca, queda en número y se avisa. */
  t=t.replace(new RegExp(NUM+"\\s*((?:metros?|mtrs?|mts?|ms|m)\\.(?![\\d²])|(?:metros?|mtrs?|mts?|ms|m)(?![\\p{L}\\d²]))(?!\\.?\\s*(?:2|²|cuad|cdos|c\\.))","giu"),(m0,n,uni,off,todo)=>{
   const p=partirNum(n); if(!p) return m0;
   const txt=metrosTxt(p);
   const resto=todo.slice(off+m0.length);
   const fin=/\.$/.test(uni)?(/^[\p{L}]/u.test(resto)?" ":puntoFinal(resto)):"";
   const mayus=esMayus(uni)&&(uni.replace(".","").length>1||contextoMayus(todo,off));
   return g(mayus?may(txt):txt)+fin;
  });
  /* medidas sin unidad, por el contexto: «una distancia de 482.17», «lado 1-2 de 7.00». Si
     después del número viene una unidad que no es el metro («5 km», «3 Has.»), no se toca:
     queda en número y se avisa. */
  let sinUnidad=0;
  t=t.replace(new RegExp("(distancia\\s+de|lado\\s+[\\w\\-\"]+\\s+de|miden?|midiendo)\\s+"+NUM+"(?!\\s*-)(?!\\s*(?:km|kms|cm|cms|mm|dm|hm|ha|has|hect|as\\b|cas\\b|ca\\b|var|leg|pie|pulg|m2|m²|mts?\\b|metros?|m\\b))","giu"),(m0,ctx,n,off,todo)=>{
   const p=partirNum(n); if(!p) return m0;
   sinUnidad++; const txt=metrosTxt(p);
   return ctx+" "+g(esMayus(ctx)?may(txt):txt);
  });
  if(sinUnidad) avisos.push(`La matrícula no dice la unidad de ${sinUnidad===1?"una medida":sinUnidad+" medidas"}: se escribió «metros».`);

  t=expandirRumbos(t);

  /* los lotes, manzanas y parcelas de los linderos urbanos, como en minuta-social: «con Lote
     13» → «con Lote trece», «Lote N° 6» → «Lote N° seis», «Lote 6b» → «Lote seis b». Los
     códigos rurales con guion (999-0001) y los que empiezan con cero (Parcela 045) no. */
  t=t.replace(new RegExp("(?<![\\p{L}])(lote|manzana|parcela)(\\s+(?:n[°ºo]\\.?\\s*)?)((?!0)\\d{1,4})([A-Za-z](?![\\p{L}])|\\s[A-Z](?![\\p{L}]))?(?![\\d\\-/]|[.,]\\d)","giu"),(m0,lab,medio,n,letra)=>{
   const w=letras(+n), M=esMayus(lab);
   return lab+medio+g((M?may(w):w)+(letra?" "+letra.trim():""));
  });

  /* números de vértice: «vertice 1», «vertice1», «vértice N° 1», «a partir de 2»; y los pares
     sólo cuando los anuncia «lado» o «línea» («linea 1-2», «Lados 1-2,2-3 y 3-4»). Los
     vértices con letra (A1, N2) quedan como están. Fechas, posiciones de una PH, rutas y
     nomenclaturas no se tocan porque no los anuncia nadie. */
  t=t.replace(/(v[ée]rtices?)(\s*(?:n[°ºo]\.?\s*)?)(\d{1,2})(?![\d\-]|[.,]\d)/gi,(m0,v,medio,n)=>v+(medio.trim()?medio:" ")+g(esMayus(v)?may(letras(+n)):letras(+n)));
  t=t.replace(/(a\s+partir\s+del?)\s+(\d{1,2})(?![\d°º\-]|[.,]\d)/gi,(m0,a,n)=>a+" "+g(esMayus(a)?may(letras(+n)):letras(+n)));
  const PAR="[A-Z]{0,2}\\d{0,2}-[A-Z]{0,2}\\d{0,2}";
  t=t.replace(new RegExp("((?<![\\p{L}])(?:lados?|l[ií]neas?|segmentos?|tramos?)\\s+)("+PAR+"(?:\\s*(?:,|y)\\s*"+PAR+")*)(?![\\p{L}\\d])","giu"),(m0,ctx,lista)=>{
   const M=esMayus(ctx);
   return ctx+lista.replace(new RegExp("(?<![\\p{L}\\d])([A-Z]{0,2}\\d{0,2})-([A-Z]{0,2}\\d{0,2})(?![\\p{L}\\d])","gu"),(p0,a,b)=>{
    if(!a||!b||!/\d/.test(a+b)) return p0;
    const f=x=>/^[1-9]\d?$/.test(x)?(M?may(letras(+x)):letras(+x)):x;
    return g(f(a)+"-"+f(b));
   });
  });
 }

 for(let k=0;k<6&&/\u0005/.test(t);k++) t=t.replace(/\u0005(\d+)\u0006/g,(_,i)=>guard[+i]);

 if(letrasOn){
  if(!hayDesig) avisos.push("No encontré la designación del inmueble (lote, parcela o fracción con su número): si la tiene, revisá que esté en letras y con negrita y subrayado.");
  for(const c of cortes) avisos.push(`Un número quedaba cortado entre dos renglones y se leyó «${c}»: revisalo contra la matrícula.`);
  for(const n of largos) avisos.push(`El número «${n}» tiene diez cifras o más: ¿le falta un guion? Quedó en número.`);
  /* lo que quedó en números y no es un ángulo, un código (999-0001, 0000-123456/2019,
     12/03/1998), un vértice con letra, ni un número de plano, matrícula, expediente o cuenta:
     se avisa, para que la revisión caiga ahí */
  const plano=t.replace(/[\u0001-\u0004]/g,"");
  const sueltos=[];
  plano.replace(/(?<![\p{L}\d°º'’\-\/])(?<!\d[.,])\d+(?:[.,]\d+)*(?![\d°º'’"\-\/]|[.,]\d)/gu,(m0,off)=>{
   const antes=plano.slice(Math.max(0,off-24),off);
   if(m0==="2"&&/m\w{0,3}\.?\s?$/i.test(antes)) return m0;   /* el «2» de «mts.2» */
   if(/(?<![\p{L}])(n[°ºo]\.?|nro\.?|n[úu]mero|expte\.?|expediente|matr[íi]cula|mat\.|plano|cuenta|folio|f[°º]\.?|tomo|t[°º]\.?|a[ñn]o|ley|decreto|resoluci[óo]n|res\.|rep\.?|ph\.?|dpto\.?|departamento\s+n[°º]?|ruta|km\.?)\s*:?\s*$/iu.test(antes)) return m0;
   sueltos.push("«…"+plano.slice(Math.max(0,off-14),off+m0.length+8).trim()+"…»");
   return m0;
  });
  if(sueltos.length) avisos.push("Quedaron en números, para mirar: "+sueltos.join(", ")+".");
 }
 if(/\[ilegible\]/i.test(t)) avisos.unshift("Hay tramos que la máquina no pudo leer: dicen [ilegible]. Completalos mirando la matrícula.");
 return {texto:t,avisos};
}

/* Los rumbos abreviados se escriben enteros fuera de los paréntesis, como en escrituras
   sociales: «al N.» → «al Norte»; adentro de un paréntesis quedan como están. Pero sólo
   cuando el texto dice que es un rumbo: después de «al», «costado», «rumbo», «hacia el», al
   principio de un lindero («; S. con calle», «, E. c/ Lote 6», «Linda: N.: Lote 4») o en una
   lista de rumbos («al Norte y S.»). En cualquier otro lado una letra con punto puede ser la
   inicial de un nombre («María E. Ejemplo»), una sociedad («S. A.»), una manzana («Manzana
   O.») o un vértice («a partir de N», «lado N-A», «hasta llegar al E»), y se deja. Si la
   descripción nombra vértices con letra, una letra sola sin punto después de «al» se toma
   como rumbo sólo si la sigue «con»: si no, es un vértice.
   Los límites de palabra se arman a mano: \b no reconoce las vocales con tilde. */
const CARD={NE:"Noreste",NO:"Noroeste",SE:"Sudeste",SO:"Suroeste",N:"Norte",S:"Sur",E:"Este",O:"Oeste"};
const AB="((?:N|S)\\.?\\s?(?:E|O)|NE|NO|SE|SO|N|S|E|O)";
function expandirRumbos(t){
 const par=[];
 let k=t.replace(/\([^)]*\)/g,m=>{par.push(m);return "\u0007"+(par.length-1)+"\u0008";});
 const rumbo=(ab,mayus)=>{ const w=CARD[ab.replace(/[.\s]/g,"")]; return mayus?may(w):w; };
 const conVertices=/lado\s+[A-Z]{1,2}\d?\s*-\s*[A-Z]|v[ée]rtice\s*"?[A-Z]{1,2}\d?"?(?![\p{L}])/u.test(t);
 /* «S. A.», «S. R. L.»: otra letra suelta con punto atrás no es rumbo */
 const sociedad=resto=>/^\s?[A-Z]\.(?:\s?[A-Z]\.)*/.test(resto);
 const CTX="(al|Al|AL|costados?|Costados?|COSTADOS?|rumbo|Rumbo|RUMBO|hacia\\s+el|Hacia\\s+el|HACIA\\s+EL)";
 /* rumbo cuadrantal: «rumbo N. 45°30'15" E.» → las dos letras, o ninguna */
 k=k.replace(new RegExp("((?:^|[^"+LET+"])(?:rumbo|Rumbo|RUMBO)\\s+)(N|S)(\\.?)(\\s*\\u0005\\d+\\u0006\\s*)(E|O)(\\.?)(?![\\d"+LET+"])","g"),(m0,pre,a,pa,ang,b,pb,off,todo)=>{
  return pre+rumbo(a,esMayus(pre.trim()))+ang+rumbo(b,esMayus(pre.trim()))+(pb&&puntoRumbo(todo.slice(off+m0.length))?".":"");
 });
 const reCtx=new RegExp("(^|[^"+LET+"])"+CTX+"\\s+"+AB+"(\\.?)(?![\\d"+LET+"\\-])","g");
 k=k.replace(reCtx,(m0,pre,w,ab,pt,off,todo)=>{
  const resto=todo.slice(off+m0.length);
  if(pt&&sociedad(resto)) return m0;
  const antes=todo.slice(Math.max(0,off-30),off+pre.length);
  if(/lleg\w*\s*$/i.test(antes)&&conVertices) return m0;
  if(!pt&&conVertices&&ab.length===1&&!/^\s*(?:con\b|c\/|:)/i.test(resto)) return m0;
  return pre+w+" "+rumbo(ab,esMayus(w))+(pt?puntoRumbo(resto):"");
 });
 /* al principio de un lindero, seguido de «con», «c/» o dos puntos */
 const reLind=new RegExp("((?:^|[:;,]|\\by\\s+|\\blinda(?:ndo)?\\s+)\\s*)"+AB+"(\\.?)(\\s*(?::|con\\b|c\\/))","gi");
 k=k.replace(reLind,(m0,pre,ab,pt,pos)=>{
  if(!/^[NSEO]/.test(ab)||ab!==ab.toUpperCase()) return m0;
  return pre+rumbo(ab,esMayus(pos.replace(/[:\s\/]/g,"")||"x")&&/[A-Z]/.test(pos))+pos;
 });
 /* listas: «al Norte y S.», «al Este, O. y N.» */
 const nombres="Noreste|Noroeste|Sudeste|Suroeste|Norte|Sur|Este|Oeste|NORESTE|NOROESTE|SUDESTE|SUROESTE|NORTE|SUR|ESTE|OESTE";
 const reLista=new RegExp("("+nombres+")(\\s*(?:,|y|e)\\s*)"+AB+"(\\.?)(?![\\d"+LET+"\\-])","g");
 for(let i=0;i<4;i++){
  const antes=k;
  k=k.replace(reLista,(m0,ant,sep,ab,pt,off,todo)=>{
   const resto=todo.slice(off+m0.length);
   if(pt&&sociedad(resto)) return m0;
   return ant+sep+rumbo(ab,esMayus(ant))+(pt?puntoRumbo(resto):"");
  });
  if(k===antes) break;
 }
 return k.replace(/\u0007(\d+)\u0008/g,(_,i)=>par[+i]);
}

/* El texto con marcas, en tramos {t, b, u}, para la pantalla, el portapapeles o Word */
function tramos(t){
 const out=[]; let b=false,u=false,buf="";
 const push=()=>{ if(buf) out.push({t:buf,b,u}); buf=""; };
 for(const ch of String(t||"")){
  if(ch===NS){push();b=true;u=true;}
  else if(ch===NS_){push();b=false;u=false;}
  else if(ch===NG){push();b=true;}
  else if(ch===NG_){push();b=false;}
  else buf+=ch;
 }
 push();
 return out;
}
const sinMarcas=t=>String(t||"").replace(/[\u0001-\u0004]/g,"");

/* ════════════ la comprobación geométrica ════════════ */
/* Con los ángulos internos y las medidas de cada lado se puede rearmar el polígono. Si los
   números están bien, cierra —el último lado termina donde empezó el primero— y da la
   superficie que dice la matrícula. Probado con siete matrículas rurales reales: las seis
   sanas cierran al centímetro; a la séptima el Registro le había comido el primer dígito de
   un ángulo de más de 200°, y esta cuenta lo encontró y propuso el correcto. Es la mejor red
   que hay para los números mal leídos o mal escritos.
   Las tolerancias salen del redondeo, no de la costumbre: los lados vienen al centímetro y los
   ángulos al segundo. La suma de n ángulos no se puede apartar más de n medios segundos; el
   cierre y el área, lo que muevan medio centímetro en cada lado y medio segundo en cada
   ángulo, sumado, con un 50 % de margen. */
function aGrados(s){
 const m=/(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['’´]\s*(\d{1,2}(?:[.,]\d+)?)/.exec(s);
 return m?{v:(+m[1])+(+m[2])/60+parseFloat(m[3].replace(",","."))/3600, mal:+m[2]>=60||parseFloat(m[3].replace(",","."))>=60}:{v:NaN,mal:false};
}
/* un ángulo bien escrito, entero: grados sin cero adelante y menores de 360, minutos y
   segundos de dos cifras y menores de 60 */
const ANG_OK=/^\s*(0|[1-9]\d{0,2})\s*[°º]\s*([0-5]\d)\s*['’´]\s*([0-5]\d)\s*(?:''|"|″|”|’’|´´)?\s*$/;
/* una medida bien escrita: sin ceros adelante, con los puntos de miles cada tres cifras */
const MED_OK=/^(?:0|[1-9]\d{0,2}(?:\.\d{3})+|[1-9]\d*)(?:[.,]\d{1,2})?$/;

/* Todas las superficies del texto, con su valor en m², sus partes y dónde están */
function superficies(texto){
 const out=[]; let m;
 const reHa=new RegExp(RE_SUP_HA.source,"gi");
 while((m=reHa.exec(texto))){
  const partes=[{q:"las hectáreas",txt:m[3],mult:10000}];
  if(m[5]) partes.push({q:"las áreas",txt:m[5],mult:100});
  if(m[7]) partes.push({q:"las centiáreas",txt:m[7],mult:1});
  if(m[9]) partes.push({q:"los metros cuadrados",txt:m[9],mult:1});
  const v=partes.reduce((s,p)=>s+(p.q==="los metros cuadrados"?valorNum(p.txt):+p.txt.replace(/\./g,""))*p.mult,0);
  out.push({pos:m.index,fin:m.index+m[0].length,valor:v,lab:m[1],partes,dec:!!(m[9]&&/[.,]\d{1,2}$/.test(m[9]))});
 }
 const reM2=new RegExp(RE_SUP_M2.source,"gi");
 while((m=reM2.exec(texto))){
  if(out.some(o=>m.index>=o.pos&&m.index<o.fin)) continue;
  out.push({pos:m.index,fin:m.index+m[0].length,valor:valorNum(m[3]),lab:m[1],partes:[{q:"la superficie",txt:m[3],mult:1}],dec:/[.,]\d{1,2}$/.test(m[3])});
 }
 return out.sort((a,b)=>a.pos-b.pos);
}
/* la superficie del terreno: si hay varias, la que no es cubierta, semicubierta ni edificada */
const elegirSup=sups=>sups.find(s=>!/cub|edific|propia|com[úu]n/i.test(s.lab))||sups[0];
function superficieDeclarada(texto){ const s=superficies(texto); return s.length?elegirSup(s).valor:NaN; }

/* El nombre del vértice, para que la sugerencia diga de cuál habla: «vértice B», «a partir
   de 3». «en dicho vértice de» no es un nombre. */
function rotuloVertice(t,pos){
 const antes=t.slice(Math.max(0,pos-90),pos);
 let m, ult=null;
 const re=/(?:[Vv][ée]rtice\s*"?|VERTICE\s*"?|VÉRTICE\s*"?|[Aa]\s+partir\s+del?\s+"?|A\s+PARTIR\s+DEL?\s+"?)([A-Z]{1,2}\d{0,3}|\d{1,3})(?![a-záéíóúñ\d])/g;
 while((m=re.exec(antes))) ult=m[1];
 return ult;
}
/* Los ángulos internos y las medidas, en el orden en que aparecen. El rumbo no es un ángulo
   interno: se usa sólo para orientar. Cada ángulo va con la medida que le sigue. Una medida
   mal escrita («1.80,68») entra igual, para poder decir cuál es. */
function poligono(texto){
 const t=String(texto||"");
 const ev=[];
 let m;
 const reA=new RegExp(ANGULO.source,"g");
 while((m=reA.exec(t))){
  const antes=t.slice(Math.max(0,m.index-40),m.index);
  const rumbo=/rumbo[^,;]*$/i.test(antes)&&!/[áa]ngulo[^,;]*$/i.test(antes.replace(/.*rumbo/i,""));
  const a=aGrados(m[0]);
  ev.push({tipo:rumbo?"rumbo":"angulo",pos:m.index,fin:m.index+m[0].length,txt:m[0].trim(),val:a.v,mal:a.mal,rot:rotuloVertice(t,m.index)});
 }
 const reL=/(distancia\s+de|lado\s+([\w\-"]+)\s+de|lado\s+de)\s+(\d[\d.,]*\d|\d)(?![\d])/gi;
 while((m=reL.exec(t))){
  let rot=m[2]&&/\d|-/.test(m[2])?m[2].replace(/"/g,""):null;
  if(!rot){ const d=/^\s*(?:mts?\.?|m\.?|metros)?\s*,?\s*l[ií]nea\s+([A-Z0-9]{1,3}-[A-Z0-9]{1,3})/i.exec(t.slice(m.index+m[0].length,m.index+m[0].length+30)); if(d) rot=d[1]; }
  const txt=m[3].replace(/[.,]$/,"");
  ev.push({tipo:"lado",pos:m.index,fin:m.index+m[0].length,txt,val:MED_OK.test(txt)?valorNum(txt):NaN,rot});
 }
 ev.sort((a,b)=>a.pos-b.pos);
 const rumbo=ev.find(e=>e.tipo==="rumbo");
 const pares=[]; let pend=null;
 for(const e of ev){
  if(e.tipo==="angulo"){ if(pend) return null; pend=e; }
  else if(e.tipo==="lado"){ if(!pend) return null; pares.push({ang:pend,lado:e}); pend=null; }
 }
 if(pend||pares.length<3) return null;
 return {rumbo:rumbo?rumbo.val:0,pares,ini:pares[0].ang.pos,fin:pares[pares.length-1].lado.fin};
}
/* signoFijo: para medir cuánto mueve el redondeo, el recorrido tiene que ir siempre para el
   mismo lado; si no, un rectángulo puede saltar a su imagen espejada y la cuenta se dispara */
function recorrer(rumbo,angs,lados,signoFijo){
 let mejor=null;
 for(const signo of signoFijo?[signoFijo]:[1,-1]){
  let h=rumbo,x=0,y=0; const pts=[[0,0]], dirs=[];
  for(let i=0;i<angs.length;i++){
   if(i>0) h+=signo*(180-angs[i]);
   const r=h*Math.PI/180; dirs.push([Math.sin(r),Math.cos(r)]);
   x+=lados[i]*Math.sin(r); y+=lados[i]*Math.cos(r); pts.push([x,y]);
  }
  let a=0; for(let i=0;i<pts.length-1;i++) a+=pts[i][0]*pts[i+1][1]-pts[i+1][0]*pts[i][1];
  const r={cierre:Math.hypot(x,y),ex:x,ey:y,area:Math.abs(a)/2,dirs,signo};
  if(!mejor||r.cierre<mejor.cierre) mejor=r;
 }
 return mejor;
}
const gms=v=>{ let s=Math.round(v*3600); const d=Math.floor(s/3600); s-=d*3600; const mi=Math.floor(s/60); s-=mi*60;
 return d+"°"+String(mi).padStart(2,"0")+"'"+String(s).padStart(2,"0")+'"'; };
const m2fmt=(v,dec)=>v.toLocaleString("es-AR",{minimumFractionDigits:dec?2:0,maximumFractionDigits:dec?2:0})+" m²";
const mfmt=v=>v.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})+" m";
/* un número propuesto, escrito como escribe la matrícula: con o sin decimales, coma o punto
   decimal, con o sin puntos de miles */
const comoLeido=(orig,v)=>{
 const miles=/\d\.\d{3}(?!\d)/.test(orig)&&(/,/.test(orig)||!/\.\d{1,2}$/.test(orig));
 const decs=(/[.,](\d{1,2})$/.exec(orig)||[])[1];
 const conDec=decs!==undefined&&!(miles&&!/,/.test(orig));
 if(!conDec&&Math.abs(v-Math.round(v))<0.005) return miles?Math.round(v).toLocaleString("es-AR"):String(Math.round(v));
 const s=v.toFixed(2);
 if(miles) return v.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2});
 return /,/.test(orig)?s.replace(".",","):s;
};

/* Los textos que salen de cambiar un solo dígito del texto leído: uno cambiado, uno de más,
   uno de menos, o dos vecinos trocados. Si el error es de lectura o de tipeo, el número bueno
   está ahí; el que se leyó no cuenta. */
function variantes(txt){
 const out=new Set(), dig="0123456789";
 for(let i=0;i<=txt.length;i++){
  for(const d of dig) out.add(txt.slice(0,i)+d+txt.slice(i));                       /* uno de más */
  if(i<txt.length&&/\d/.test(txt[i])){
   for(const d of dig) out.add(txt.slice(0,i)+d+txt.slice(i+1));                    /* cambiado */
   out.add(txt.slice(0,i)+txt.slice(i+1));                                          /* de menos */
   if(i+1<txt.length&&/\d/.test(txt[i+1])) out.add(txt.slice(0,i)+txt[i+1]+txt[i]+txt.slice(i+2));
  }
 }
 out.delete(txt);
 return [...out];
}

/* Dos fracciones en la misma descripción se comprueban cada una sola. Se parte donde empieza
   otro recorrido («partiendo», «comenzando»), pero sólo si cada pedazo trae su propio polígono:
   un «partiendo» en los linderos no parte nada. La superficie que va en el encabezado de la
   fracción siguiente («FRACCIÓN DOS, con una superficie de…») es de la siguiente. */
function geometria(texto){
 const t=String(texto||"");
 const cortes=[0]; let m; const reP=/partiendo|comenzando|(?:desde|en)\s+el\s+v[ée]rtice\s+"?[A-Z0-9]{1,3}"?\s*,?\s*con\s+(?:un\s+)?rumbo/gi;
 while((m=reP.exec(t))) if(m.index>0) cortes.push(m.index);
 let pedazos=cortes.map((c,i)=>({ini:c,fin:cortes[i+1]||t.length}));
 /* juntar los pedazos sin polígono con el anterior */
 const conPol=[];
 for(const p of pedazos){
  const pol=poligono(t.slice(p.ini,p.fin));
  if(pol||!conPol.length) conPol.push({ini:p.ini,fin:p.fin,pol});
  else conPol[conPol.length-1].fin=p.fin;
 }
 pedazos=conPol.filter(p=>p.pol||conPol.length===1);
 if(pedazos.length<=1) return geometriaUna(t);
 const sups=superficies(t);
 const partes=pedazos.map((p,i)=>{
  const absFin=p.ini+p.pol.fin;
  const sig=pedazos[i+1];
  const propias=sups.filter(s=>{
   if(s.pos<p.ini&&i>0) return false;
   if(sig&&s.pos>=sig.ini) return false;
   /* después del polígono y detrás de un encabezado de fracción: es de la siguiente */
   if(sig&&s.pos>absFin&&/fracci[óo]n|lote|parcela/i.test(t.slice(absFin,s.pos))) return false;
   return true;
  });
  const deAtras=i>0?sups.filter(s=>s.pos>=pedazos[i-1].ini+pedazos[i-1].pol.fin&&s.pos<p.ini&&/fracci[óo]n|lote|parcela/i.test(t.slice(pedazos[i-1].ini+pedazos[i-1].pol.fin,s.pos))):[];
  return geometriaUna(t.slice(p.ini,p.fin),deAtras.concat(propias));
 });
 const estado=partes.some(p=>p.estado==="mal")?"mal":partes.every(p=>p.estado==="ok")?"ok":"sin";
 return {estado,partes,avisos:[].concat(...partes.map(p=>p.avisos||[])),
  sugerencias:[].concat(...partes.map((p,i)=>p.sugerencias.map(s=>"Fracción "+(i+1)+": "+s))),
  mensaje:partes.map((p,i)=>"Fracción "+(i+1)+": "+p.mensaje).join(" ")};
}
function geometriaUna(texto,supsDadas){
 const P=poligono(texto);
 if(!P) return {estado:"sin",sugerencias:[],avisos:[],mensaje:"No se pudo comprobar la geometría: la descripción no trae los ángulos y las medidas de todos los lados."};
 const malos=P.pares.filter(p=>isNaN(p.lado.val));
 if(malos.length) return {estado:"mal",sugerencias:[],avisos:[],mensaje:"La geometría no se puede comprobar porque "+malos.map(p=>`la medida ${p.lado.rot?"del lado "+p.lado.rot+" ":""}«${p.lado.txt}» no está bien escrita`).join(" y ")+": revisala contra la matrícula."};
 if(P.pares.some(p=>isNaN(p.ang.val))) return {estado:"sin",sugerencias:[],avisos:[],mensaje:"No se pudo comprobar la geometría: hay un ángulo que no se entiende."};
 const angs=P.pares.map(p=>p.ang.val), lados=P.pares.map(p=>p.lado.val);
 const n=angs.length;
 const suma=angs.reduce((a,b)=>a+b,0), esperada=(n-2)*180;
 const tolSuma=(n*0.5+1)/3600;
 const r=recorrer(P.rumbo,angs,lados);
 /* cuánto pueden moverse el cierre y el área por el redondeo */
 let sensA=0, sensC=0;
 for(let i=0;i<n;i++){
  const l2=lados.slice(); l2[i]+=0.005; const rl=recorrer(P.rumbo,angs,l2,r.signo);
  sensA+=Math.abs(rl.area-r.area); sensC+=Math.hypot(rl.ex-r.ex,rl.ey-r.ey);
  if(i>0){ const a2=angs.slice(); a2[i]+=0.5/3600; const ra=recorrer(P.rumbo,a2,lados,r.signo);
   sensA+=Math.abs(ra.area-r.area); sensC+=Math.hypot(ra.ex-r.ex,ra.ey-r.ey); }
 }
 const tolCierre=1.5*sensC+0.005;
 const sups=supsDadas||superficies(texto), sup=sups.length?elegirSup(sups):null;
 const decl=sup?sup.valor:NaN;
 const tolArea=1.5*(sensA+(sup&&sup.dec?0.005:0.5))+0.01;
 const areaOk=v=>isNaN(decl)||Math.abs(v-decl)<=tolArea;
 const res={n,suma,esperada,cierre:r.cierre,area:r.area,declarada:decl,tolArea,tolCierre,sugerencias:[],avisos:[]};
 for(const p of P.pares) if(p.ang.mal) res.avisos.push(`El ángulo ${p.ang.txt} tiene minutos o segundos de 60 o más.`);
 const sumaOk=Math.abs(suma-esperada)<=tolSuma, cierraOk=r.cierre<=tolCierre;
 const dec=sup&&(sup.dec||decl<10000);
 if(sumaOk&&cierraOk&&areaOk(r.area)&&!res.avisos.length){
  res.estado="ok";
  res.mensaje=`La geometría cierra: ${n} lados, el polígono cierra${r.cierre<0.005?" exacto":" a "+Math.round(r.cierre*100)+" cm"}`
   +(isNaN(decl)?". No encontré la superficie en la descripción, así que no la pude comparar."
    :` y da ${m2fmt(r.area,dec)}, que es la superficie que dice la matrícula (${m2fmt(decl,dec)}).`);
  return res;
 }
 res.estado="mal";
 const partes=[];
 if(!sumaOk) partes.push(`los ${n} ángulos suman ${gms(suma)} y tendrían que sumar ${esperada}°`);
 if(!cierraOk) partes.push(`el polígono no cierra: el último lado termina a ${mfmt(r.cierre)} de donde empezó el primero`);
 if(sumaOk&&cierraOk&&!areaOk(r.area)) res.mensaje=`La superficie no coincide: el polígono cierra, pero da ${m2fmt(r.area,dec)} y la matrícula dice ${m2fmt(decl,dec)}.`;
 else if(partes.length) res.mensaje="La geometría no cierra: "+partes.join("; ")+".";
 else res.mensaje="Revisá los ángulos: "+res.avisos.join(" ");
 /* ¿hay un solo número que lo arregle? Se prueban las variantes de un dígito de cada número
    leído —ángulos, medidas y superficie—, escritas como se escribe un número de verdad, y
    sólo vale la que, puesta tal cual, cierra y da la superficie. Se cuentan por valor: «15,0»
    y «15,00» son el mismo candidato. */
 /* un candidato por número: si el mismo lado admite «10,00» y «10,01», queda el que mejor
    cierra */
 const cand=new Map();
 const poner=(clave,err,txt)=>{ const v=cand.get(clave); if(!v||err<v.err) cand.set(clave,{err,txt}); };
 const rotA=(p,i)=>p.ang.rot?`del vértice ${p.ang.rot}`:`n.º ${i+1}`;
 const rotL=(p,i)=>p.lado.rot?`del lado ${p.lado.rot}`:`n.º ${i+1}`;
 const cierraCon=(a2,l2,d2)=>{ const r2=recorrer(P.rumbo,a2,l2); const s2=a2.reduce((x,y)=>x+y,0);
  if(!(Math.abs(s2-esperada)<=tolSuma&&r2.cierre<=tolCierre&&(isNaN(d2)||Math.abs(r2.area-d2)<=tolArea))) return -1;
  return r2.cierre/tolCierre+(isNaN(d2)?0:Math.abs(r2.area-d2)/tolArea); };
 for(let i=0;i<n;i++){
  if(i>0||!sumaOk){
   for(const v of variantes(P.pares[i].ang.txt)){
    if(!ANG_OK.test(v)) continue;
    const a=aGrados(v); if(a.v<=0||a.v>=360) continue;
    const a2=angs.slice(); a2[i]=a.v;
    const e=cierraCon(a2,lados,decl);
    if(e>=0) poner("a"+i,e,`el ángulo ${rotA(P.pares[i],i)}, que dice ${P.pares[i].ang.txt}, sería ${gms(a.v)}`);
   }
  }
  for(const v of variantes(P.pares[i].lado.txt)){
   if(!MED_OK.test(v)) continue;
   const L=valorNum(v); if(isNaN(L)||L<=0) continue;
   const l2=lados.slice(); l2[i]=L;
   const e=cierraCon(angs,l2,decl);
   if(e>=0) poner("l"+i,e,`la medida ${rotL(P.pares[i],i)}, que dice ${P.pares[i].lado.txt}, sería ${comoLeido(P.pares[i].lado.txt,L)}`);
  }
 }
 if(sup&&sumaOk&&cierraOk){
  for(const parte of sup.partes){
   for(const v of variantes(parte.txt)){
    if(!(parte.q==="los metros cuadrados"||parte.q==="la superficie"?MED_OK:/^(?:0|[1-9]\d*)$/).test(v)) continue;
    const nuevo=parte.q==="los metros cuadrados"||parte.q==="la superficie"?valorNum(v):+v;
    if(isNaN(nuevo)) continue;
    const viejo=parte.q==="los metros cuadrados"||parte.q==="la superficie"?valorNum(parte.txt):+parte.txt.replace(/\./g,"");
    /* con hectáreas, los metros cuadrados no llegan a 10.000 ni las áreas o centiáreas a 100 */
    if(parte.q==="los metros cuadrados"&&nuevo>=10000) continue;
    if((parte.q==="las áreas"||parte.q==="las centiáreas")&&nuevo>=100) continue;
    const d2=decl+(nuevo-viejo)*parte.mult;
    if(Math.abs(r.area-d2)<=tolArea) poner("s"+parte.q,Math.abs(r.area-d2)/tolArea,`${parte.q==="la superficie"?"la superficie":parte.q+" de la superficie"}, que ${parte.q==="la superficie"?"dice":"dicen"} ${parte.txt}, ${parte.q==="la superficie"?"sería":"serían"} ${parte.q==="la superficie"||parte.q==="los metros cuadrados"?comoLeido(parte.txt,nuevo):v}`);
   }
  }
 }
 const unicos=[...cand.values()].sort((a,b)=>a.err-b.err).map(c=>c.txt);
 /* la geometría no distingue dos números que cierran igual: se propone, no se afirma */
 if(unicos.length===1) res.sugerencias.push("Si es un solo número mal leído, es éste: "+unicos[0]+". Confirmalo en la matrícula.");
 else if(unicos.length>1&&unicos.length<=4) res.sugerencias.push("Un solo número no alcanza para saber cuál está mal. Puede ser "+unicos.join("; o ")+". Confirmalo en la matrícula.");
 return res;
}

/* ════════════ todo junto ════════════ */
/* cortes: los números que limpiar() encontró partidos entre renglones en la lectura original.
   La pantalla guarda la fiel ya limpia y los pasa mientras no se la corrija. */
function procesar(descripcion,{cortes=[]}={}){
 const info={};
 const fiel=limpiar(descripcion,info);
 const f=convertir(fiel,{letrasOn:false});
 const l=convertir(fiel,{letrasOn:true,cortes:(info.cortes||[]).concat(cortes)});
 const geo=geometria(fiel);
 return {fiel, fielMarcado:f.texto, letras:l.texto, avisos:l.avisos.concat(geo.avisos||[]), geometria:geo};
}

if(typeof module!=="undefined") module.exports={letras,partirNum,metrosTxt,limpiar,convertir,expandirRumbos,tramos,sinMarcas,geometria,poligono,superficies,superficieDeclarada,variantes,procesar};
