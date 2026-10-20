/* Pruebas del motor. Se corren con: node --test pruebas/motor.test.js
   TODOS LOS DATOS SON INVENTADOS: nombres, números de lote, parcelas, medidas, ángulos y
   superficies. Los polígonos se armaron con coordenadas inventadas para que cierren de verdad;
   las matrículas reales no entran a este repositorio. */
const test=require("node:test");
const assert=require("node:assert/strict");
const M=require("../motor.js");

const RURAL_A=[
 "Parcela ubicada en Departamento Ejemplo, Pedania Prueba , lugar el establecimiento \"El Ejemplo\" designado como LOTE 999001-/",
 "888002 y responde a la siguiente descripcion:Partiendo del vertice A con un rumbo de 1°56'29'' y un angulo en dicho vertice de 89°50'54'' y una distancia de 1180.68////",
 "linea A-B llegamos al vertice B, a partir de B con un angulo en dicho vertice de 93°36'45'' y una distancia de 865.87 linea B-1 llegamos al vertice 1, a partir de 1 con//",
 "un angulo en dicho vertice de 90°22'36'' y una distancia de 685.69 linea 1-2 llegamos al vertice 2, a partir de 2 con un angulo en dicho vertice de 90°38'10'' y una/",
 "distancia de 320.35 linea 2-3 llegamos al vertice 3, a partir de 3 con un angulo en dicho vertice de 270°35'12'' y una distancia de 525.86 linea 3-C llegamos al vertice/",
 "C, a partir de C con un angulo en dicho vertice de 84°56'23'' y una distancia de 640.31 linea C-A, encerrando una superficie de 92 Has 6626 m2 y linda con: Lado A-B con/",
 "camino publico, lado B-1 con parcela 999-0001, lados 1-2,2-3 con lote 999003-888004, lados 3-C,C-A con parcela 999-0002.//////"
].join("\n");

const RURAL_B=[
 "Inmueble ubicado en Departamento Ejemplo, Pedanía Prueba, designado como Lote 999001-888002, que responde a la siguiente descripción:",
 "Partiendo del vértice \"A\" con un rumbo de 1°56'29\", y un ángulo en dicho vértice de 89°50'54\" y una distancia de 1180,68 m llegamos al vértice \"B\"; a partir de B, con un///",
 "ángulo interno de 93°36'45\", lado B-1 de 865,87 m; a partir de 1, con un ángulo interno de 90°22'36\", lado 1-2 de 685,69 m; a partir de 2, con un ángulo interno de 90°///",
 "38'10\", lado 2-3 de 320,35 m; a partir de 3, con un ángulo interno de 270°35'12\", lado 3-C de 525,86 m; a partir de C, con un ángulo interno de 84°56'23\", lado C-A de/",
 "640,31 m; encerrando una superficie de 92 Ha 6626 m². Y linda con: lado A-B con camino publico, lado B-1 con parcela 999-0001.////"
].join("\n");

const URBANO="LOTE 12 de la MANZANA 5, ubicado en Barrio Ejemplo, que mide y linda: partiendo del vértice 1 con rumbo de 0°45'50\" y ángulo interno de 89°14'10\", lado 1-2 de 30,00 m, lindando con Lote 13; desde el vértice 2 con ángulo interno de 91°20'13\", lado 2-3 de 10,00 m, lindando con calle Pública; desde el vértice 3 con ángulo interno de 88°39'57\", lado 3-4 de 30,10 m, lindando con Lote 11; desde el vértice 4 con ángulo interno de 90°45'41\", lado 4-1 de 10,00 m, lindando con Lote 20; con una superficie de 300,48 m2.";

const plano=t=>M.sinMarcas(t);
const L=t=>plano(M.procesar(t).letras);

test("números en letras",()=>{
 assert.equal(M.letras(1),"uno");
 assert.equal(M.letras(21),"veintiuno");
 assert.equal(M.letras(100),"cien");
 assert.equal(M.letras(102),"ciento dos");
 assert.equal(M.letras(1001),"mil uno");
 assert.equal(M.letras(21000),"veintiún mil");
 assert.equal(M.letras(1000000),"un millón");
 assert.equal(M.letras(999001),"novecientos noventa y nueve mil uno");
 assert.equal(M.letras(251,true),"doscientas cincuenta y una");
 assert.equal(M.letras(21,true),"veintiuna");
 assert.equal(M.letras(1,true),"una");
});

test("los números de las medidas, con punto o con coma",()=>{
 assert.deepEqual(M.partirNum("482.17"),{ent:482,dec:17});
 assert.deepEqual(M.partirNum("1534,26"),{ent:1534,dec:26});
 assert.deepEqual(M.partirNum("2.716,05"),{ent:2716,dec:5});
 assert.deepEqual(M.partirNum("7.00"),{ent:7,dec:0});
 assert.deepEqual(M.partirNum("1.221"),{ent:1221,dec:0});
 assert.deepEqual(M.partirNum("12,5"),{ent:12,dec:50});
 assert.equal(M.metrosTxt({ent:1001,dec:70}),"mil un metros con setenta centímetros");
 assert.equal(M.metrosTxt({ent:1,dec:0}),"un metro");
 assert.equal(M.metrosTxt({ent:0,dec:50}),"cincuenta centímetros");
 assert.equal(M.metrosTxt({ent:21,dec:1}),"veintiún metros con un centímetro");
});

test("fiel: saca el relleno y une los renglones, sin tocar nada más",()=>{
 assert.equal(M.limpiar("designado como LOTE 999001-/\n888002 y responde"),"designado como LOTE 999001-888002 y responde");
 assert.equal(M.limpiar("ángulo interno de 87°////\n14'36\", lado"),"ángulo interno de 87°14'36\", lado");
 assert.equal(M.limpiar("lado P-Q de 612\n,48 m;"),"lado P-Q de 612,48 m;");
 assert.equal(M.limpiar("a partir de 6/\ncon un angulo"),"a partir de 6 con un angulo");
 assert.equal(M.limpiar("expte. 0000-123456/2019 y //////// sigue"),"expte. 0000-123456/2019 y sigue");
 assert.equal(M.limpiar("encerrando unna superficei"),"encerrando unna superficei","las faltas no se corrigen");
 assert.equal(M.limpiar("Pedania Prueba , lugar"),"Pedania Prueba , lugar","los espacios de adentro del renglón quedan");
});

test("fiel: los cortes de renglón que no son relleno",()=>{
 assert.equal(M.limpiar("según plano Expte. 0000-123456/\n2019 de Catastro"),"según plano Expte. 0000-123456/2019 de Catastro");
 assert.equal(M.limpiar("inscripto con fecha 12/03/\n1998 en el Registro"),"inscripto con fecha 12/03/1998 en el Registro");
 assert.equal(M.limpiar("UNIDAD FUNCIONAL 7 -\nPOSICION 00-07"),"UNIDAD FUNCIONAL 7 - POSICION 00-07");
 assert.equal(M.limpiar("formando un ángulo de 90°\ny luego mide 20 m"),"formando un ángulo de 90° y luego mide 20 m");
 assert.equal(M.limpiar("la siguiente descrip-\nción del lote"),"la siguiente descripción del lote");
 const info={};
 assert.equal(M.limpiar("que mide 10,\n50 m de frente",info),"que mide 10,50 m de frente");
 assert.deepEqual(info.cortes,["10,50"]);
 const r=M.procesar("que mide 10,\n50 m de frente por 3\n1,50 m de fondo");
 assert.ok(plano(r.letras).includes("diez metros con cincuenta centímetros de frente"));
 assert.ok(r.avisos.some(a=>a.includes("«10,50»")),r.avisos.join(" | "));
 assert.ok(r.avisos.some(a=>a.includes("«3 1»")),r.avisos.join(" | "));
});

test("rural, formato viejo: en letras lo que pide el art. 54 y nada más",()=>{
 const r=M.procesar(RURAL_A);
 const l=r.letras, p=plano(l);
 assert.ok(l.includes("\u0001LOTE NOVECIENTOS NOVENTA Y NUEVE MIL UNO-OCHOCIENTOS OCHENTA Y OCHO MIL DOS\u0002"),"designación en mayúscula, negrita y subrayado");
 assert.ok(l.includes("\u0003SUPERFICIE DE NOVENTA Y DOS HECTÁREAS SEIS MIL SEISCIENTOS VEINTISÉIS METROS CUADRADOS\u0004"),"superficie en mayúscula y negrita");
 assert.ok(p.includes("una distancia de mil ciento ochenta metros con sesenta y ocho centímetros linea A-B"));
 assert.ok(p.includes("a partir de tres con un angulo en dicho vertice de 270°35'12''"),"los ángulos quedan en números");
 assert.ok(p.includes("llegamos al vertice uno, a partir de uno"),"vértices que son número, en letras");
 assert.ok(p.includes("linea B-uno"),"el vértice con letra queda");
 assert.ok(p.includes("con parcela 999-0001") && p.includes("con lote 999003-888004"),"los códigos de los linderos quedan en número");
 assert.ok(p.includes("lados uno-dos,dos-tres"));
 assert.ok(p.includes("Pedania Prueba , lugar"),"las palabras no se corrigen");
 assert.ok(r.avisos.some(a=>/no dice la unidad de 6 medidas/.test(a)));
 assert.ok(!r.avisos.some(a=>/Quedaron en números|designación/.test(a)),"sin avisos de más: "+r.avisos.join(" | "));
});

test("rural, formato nuevo",()=>{
 const r=M.procesar(RURAL_B);
 const p=plano(r.letras);
 assert.ok(r.letras.includes("\u0001LOTE NOVECIENTOS NOVENTA Y NUEVE MIL UNO-OCHOCIENTOS OCHENTA Y OCHO MIL DOS\u0002"));
 assert.ok(p.includes("lado B-uno de ochocientos sesenta y cinco metros con ochenta y siete centímetros;"));
 assert.ok(p.includes("de 90°38'10\""),"el ángulo partido en dos renglones se une");
 assert.ok(p.includes("SUPERFICIE DE NOVENTA Y DOS HECTÁREAS SEIS MIL SEISCIENTOS VEINTISÉIS METROS CUADRADOS."));
 assert.ok(!r.avisos.some(a=>/unidad/.test(a)),"acá las medidas traen la «m»");
});

test("fiel con formato: los números y el texto quedan como están",()=>{
 const r=M.procesar(RURAL_B);
 assert.ok(r.fielMarcado.includes("\u0001Lote 999001-888002\u0002"));
 assert.ok(r.fielMarcado.includes("\u0003superficie de 92 Ha 6626 m²\u0004"));
 assert.equal(plano(r.fielMarcado),r.fiel);
 const g=M.procesar("designado como LOTE 2614 - 1234, con superficie de 20 Has.");
 assert.equal(plano(g.fielMarcado),g.fiel,"no reescribe «2614 - 1234»");
});

test("urbano: lote y manzana, linderos y superficie con decímetros",()=>{
 const r=M.procesar(URBANO);
 const p=plano(r.letras);
 assert.ok(r.letras.startsWith("\u0001LOTE DOCE de la MANZANA CINCO\u0002"));
 assert.ok(p.includes("lado uno-dos de treinta metros, lindando con Lote trece;"));
 assert.ok(p.includes("con Lote veinte;"));
 assert.ok(p.includes("SUPERFICIE DE TRESCIENTOS METROS CUADRADOS CON CUARENTA Y OCHO DECÍMETROS CUADRADOS."));
 assert.ok(p.includes("desde el vértice dos con ángulo interno de 91°20'13\""));
});

test("la designación, con cualquier redacción, y una sola",()=>{
 const d=t=>M.procesar(t).letras;
 assert.ok(d("Fracción de campo que se designa como LOTE 251-4567, y linda con parcela 251-4568.").includes("\u0001LOTE DOSCIENTOS CINCUENTA Y UNO-CUATRO MIL QUINIENTOS SESENTA Y SIETE\u0002"));
 assert.ok(d("Inmueble identificado como Lote N° 2614-1235, linda con camino.").includes("\u0001LOTE DOS MIL SEISCIENTOS CATORCE-MIL DOSCIENTOS TREINTA Y CINCO\u0002"));
 const lind=d("Fracción de terreno designada como Lote 5 de la Manzana 12, mide 10 m, linda al E. con Lote 6 de la Manzana 12.");
 assert.ok(lind.includes("\u0001LOTE CINCO de la MANZANA DOCE\u0002"),lind);
 assert.ok(plano(lind).includes("al Este con Lote seis de la Manzana doce."),"el lindero no se marca ni se pasa a mayúscula");
 assert.equal((lind.match(/\u0001/g)||[]).length,1,"una sola designación");
 assert.ok(d("LOTE 5 MANZANA 12, mide 10 m.").includes("\u0001LOTE CINCO MANZANA DOCE\u0002"));
 assert.ok(d("Lote 5, Manzana 12, mide 10 m.").includes("\u0001LOTE CINCO, MANZANA DOCE\u0002"));
 assert.ok(d("LOTE 5 de la MANZANA \"B\", mide 10 m.").includes("\u0001LOTE CINCO de la MANZANA \"B\"\u0002"));
 assert.ok(d("Lte. 5 Mz. 12, mide 10 m.").includes("\u0001LOTE CINCO MANZANA DOCE\u0002"));
 const sin=M.procesar("Una fracción de terreno ubicada en el lugar Ejemplo, que mide 10 m de frente.");
 assert.ok(sin.avisos.some(a=>/No encontré la designación/.test(a)));
});

test("unidades: en cualquier caja, y las que no son metros no se tocan",()=>{
 assert.ok(L("QUE MIDE 10,00 MTS. DE FRENTE").includes("QUE MIDE DIEZ METROS DE FRENTE"));
 assert.ok(L("LADO 1-2 DE 30,00 M, sigue").includes("LADO UNO-DOS DE TREINTA METROS, sigue"),"en un texto en mayúscula, lo convertido también");
 assert.ok(L("mide 15 m. de frente por 35 m. de fondo.").includes("mide quince metros de frente por treinta y cinco metros de fondo."));
 assert.ok(L("mide 9,95 ms. de frente").includes("mide nueve metros con noventa y cinco centímetros de frente"));
 const km=M.procesar("ubicada a una distancia de 5 km de la ruta");
 assert.ok(plano(km.letras).includes("distancia de 5 km de la ruta"),"5 km queda");
 assert.ok(!km.avisos.some(a=>/unidad/.test(a)),"y no dice que falta la unidad");
 assert.ok(km.avisos.some(a=>/Quedaron en números/.test(a)),"pero lo avisa");
 assert.ok(L("lado 1-2 de 12,345 m").includes("lado uno-dos de 12,345 m"),"tres decimales: queda en número");
 assert.ok(M.procesar("lado 1-2 de 12,345 m").avisos.some(a=>a.includes("12,345")));
});

test("superficies escritas de otras maneras",()=>{
 assert.ok(L("con superficie de 525 mts. cuadrados.").includes("SUPERFICIE DE QUINIENTOS VEINTICINCO METROS CUADRADOS."));
 assert.ok(L("con superficie de 525 mts.cdos. y linda").includes("SUPERFICIE DE QUINIENTOS VEINTICINCO METROS CUADRADOS y linda"));
 assert.ok(L("UNIDAD FUNCIONAL 3, sup. cub. propia de 62,45 mts.2, porcentual").includes("SUP. CUB. PROPIA DE SESENTA Y DOS METROS CUADRADOS CON CUARENTA Y CINCO DECÍMETROS CUADRADOS, porcentual"));
 assert.ok(L("Superficie: 300 m2.").includes("SUPERFICIE: TRESCIENTOS METROS CUADRADOS."));
 assert.ok(L("con una superficie de 1 Ha 1 m2.").includes("SUPERFICIE DE UNA HECTÁREA UN METRO CUADRADO"));
 assert.ok(L("con una superficie de 21 Has 0 m2.").includes("SUPERFICIE DE VEINTIUNA HECTÁREAS."));
 assert.ok(L("con una superficie de 201 Has.").includes("SUPERFICIE DE DOSCIENTAS UNA HECTÁREAS."));
 assert.ok(L("con superficie de 15 Has. 25 as. 30 cas. y linda").includes("SUPERFICIE DE QUINCE HECTÁREAS VEINTICINCO ÁREAS TREINTA CENTIÁREAS y linda"));
 assert.ok(L("encerrando una SUPERFICIE DE 1.250 HAS. 3.218,50 M2.").includes("SUPERFICIE DE MIL DOSCIENTAS CINCUENTA HECTÁREAS TRES MIL DOSCIENTOS DIECIOCHO METROS CUADRADOS CON CINCUENTA DECÍMETROS CUADRADOS."));
});

test("los pares con guion sólo se pasan a letras si son lados",()=>{
 const p=L("UNIDAD FUNCIONAL 5: Posiciones: 00-05 y 01-12; nomenclatura catastral 11-01-01-04-05-123-045; lindando con Ruta Provincial E-53, fecha 12-03-1998.");
 assert.ok(p.includes("Posiciones: 00-05 y 01-12"),p);
 assert.ok(p.includes("11-01-01-04-05-123-045"),p);
 assert.ok(p.includes("Ruta Provincial E-53"),p);
 assert.ok(p.includes("fecha 12-03-1998"),p);
});

test("rumbos: enteros fuera de paréntesis, pero no los vértices ni las iniciales",()=>{
 assert.ok(L("mide 10 m al N. con Lote 5, y 30 m al S.O. con calle Ejemplo (N.).").includes("diez metros al Norte con Lote cinco, y treinta metros al Suroeste con calle Ejemplo (N.)."));
 assert.ok(L("lindando al NE con Lote 4 y al costado O con calle.").includes("lindando al Noreste con Lote cuatro y al costado Oeste con calle."));
 assert.ok(L("linda al N.E. con el Lote 7.").includes("linda al Noreste con el Lote siete."));
 assert.ok(L("mide 10 m al N. y S. por 30 m al E. y O.").includes("al Norte y Sur por treinta metros al Este y Oeste."));
 assert.ok(L("LINDANDO AL N. CON CALLE PUBLICA, AL S. CON LOTE 14.").includes("LINDANDO AL NORTE CON CALLE PUBLICA, AL SUR CON LOTE CATORCE."));
 assert.ok(L("linda al N. Lote 6 de Juan Ejemplo y al S. Calle Pública.").includes("linda al Norte Lote seis de Juan Ejemplo y al Sur Calle Pública."));
 assert.ok(L("Linda: N. con Lote 4; S. con calle Ejemplo.").includes("Linda: Norte con Lote cuatro; Sur con calle Ejemplo."));
 const nombres=L("lindando al N. con de María E. Ejemplo, al S. con de Pedro N. Prueba, al E. con Agropecuaria Inventada S. A. y al O. con Lote 4 de la Manzana O.");
 assert.ok(nombres.includes("con de María E. Ejemplo"),nombres);
 assert.ok(nombres.includes("con de Pedro N. Prueba"),nombres);
 assert.ok(nombres.includes("Agropecuaria Inventada S. A."),nombres);
 assert.ok(nombres.includes("Manzana O."),nombres);
 const rural=L("a partir de N, con un ángulo interno de 87°14'36\", lado N-A de 2716,05 m; lado N1-N con parcela 999-0003, llegamos al vértice E. A partir de S, con un ángulo");
 assert.ok(rural.includes("a partir de N, con"),rural);
 assert.ok(rural.includes("lado N-A de"),rural);
 assert.ok(rural.includes("lado N1-N con"),rural);
 assert.ok(rural.includes("al vértice E. A partir de S,"),rural);
 assert.ok(L("FRACCIÓN al N. del lote").includes("FRACCIÓN al Norte del lote"),"no pega la N a la palabra con tilde");
 assert.equal(M.procesar("al N. con Lote 5").fiel,"al N. con Lote 5","la fiel no se toca");
});

test("la geometría cierra con los tres inventados",()=>{
 for(const [nombre,t] of [["rural A",RURAL_A],["rural B",RURAL_B],["urbano",URBANO]]){
  const g=M.geometria(M.limpiar(t));
  assert.equal(g.estado,"ok",nombre+": "+g.mensaje);
 }
 const g=M.geometria(M.limpiar(RURAL_A));
 assert.equal(g.n,6);
 assert.ok(Math.abs(g.area-926626)<20,"área "+g.area);
 assert.match(M.geometria(M.limpiar(URBANO)).mensaje,/300,4\d m², que es la superficie que dice la matrícula \(300,48 m²\)/);
});

test("un ángulo con un dígito de menos: lo encuentra, dice cuál es y propone el correcto",()=>{
 const g=M.geometria(M.limpiar(RURAL_B.replace("270°35'12\"","70°35'12\"")));
 assert.equal(g.estado,"mal");
 assert.match(g.mensaje,/suman/);
 assert.equal(g.sugerencias.length,1,g.sugerencias.join(" | "));
 assert.match(g.sugerencias[0],/el ángulo del vértice 3, que dice 70°35'12", sería 270°35'12"/);
});

test("un ángulo con los minutos mal leídos: propone el exacto, no uno corrido un segundo",()=>{
 const g=M.geometria(M.limpiar(URBANO.replace("91°20'13\"","91°50'13\"")));
 assert.equal(g.estado,"mal");
 assert.ok(g.sugerencias.join(" ").includes("sería 91°20'13\""),g.sugerencias.join(" | "));
});

test("una medida con dos cifras cambiadas de lugar: la encuentra y nombra el lado",()=>{
 const g=M.geometria(M.limpiar(RURAL_B.replace("865,87","856,87")));
 assert.equal(g.estado,"mal");
 assert.match(g.mensaje,/no cierra/);
 assert.ok(g.sugerencias.some(s=>/la medida del lado B-1, que dice 856,87, sería 865,87/.test(s)),g.sugerencias.join(" | "));
});

test("la superficie mal leída en un lote urbano no sale en verde",()=>{
 for(const mal of ["301,48","298,50","300,84"]){
  const g=M.geometria(M.limpiar(URBANO.replace("300,48",mal)));
  assert.equal(g.estado,"mal",mal+": "+g.mensaje);
  assert.match(g.mensaje,/La superficie no coincide/);
 }
 /* la superficie leída con un dígito cambiado aparece entre los candidatos */
 assert.ok(M.geometria(M.limpiar(URBANO.replace("300,48","301,48"))).sugerencias.join(" ").includes("sería 300,48"));
 /* con 300,84 también cerraría corrigiendo un lado: lo dice, en vez de culpar a la superficie */
 assert.match(M.geometria(M.limpiar(URBANO.replace("300,48","300,84"))).sugerencias.join(" "),/no alcanza.*la superficie, que dice 300,84/);
});

test("la superficie rural que no coincide",()=>{
 const g=M.geometria(M.limpiar(RURAL_B.replace("92 Ha 6626 m²","92 Ha 6926 m²")));
 assert.equal(g.estado,"mal");
 assert.match(g.mensaje,/la matrícula dice 926\.926 m²/);
});

test("un ángulo corrido unos segundos no pasa en verde",()=>{
 const g=M.geometria(M.limpiar(RURAL_B.replace("89°50'54\"","89°50'59\"")));
 assert.equal(g.estado,"mal",g.mensaje);
});

test("sin superficie, lo dice",()=>{
 const g=M.geometria(M.limpiar(URBANO.replace("con una superficie de 300,48 m2.","que es todo.")));
 assert.equal(g.estado,"ok");
 assert.match(g.mensaje,/No encontré la superficie/);
});

test("sin ángulos no se puede comprobar, y lo dice",()=>{
 const g=M.geometria("LOTE 3 de la MANZANA 8, que mide 10 m de frente por 30 m de fondo, con una superficie de 300 m2.");
 assert.equal(g.estado,"sin");
 assert.ok(L("LOTE 3 de la MANZANA 8, que mide 10 m de frente por 30 m de fondo, con una superficie de 300 m2.").includes("que mide diez metros de frente por treinta metros de fondo"));
});

test("dos fracciones: cada una se comprueba con su superficie",()=>{
 const dos=URBANO+" FRACCIÓN 2: "+URBANO.replace("LOTE 12 de la MANZANA 5,","").replace("partiendo","Partiendo");
 const g=M.geometria(M.limpiar(dos));
 assert.equal(g.estado,"ok",g.mensaje);
 assert.ok(g.partes&&g.partes.length===2);
});

test("[ilegible] y números sueltos se avisan",()=>{
 const r=M.procesar("designado como Lote 5, que mide [ilegible] de frente, de a 7 a partir de A.");
 assert.ok(r.avisos[0].includes("[ilegible]"));
 assert.ok(r.avisos.some(a=>a.includes("de a 7")));
});

test("tramos: el formato se convierte en pedazos con negrita y subrayado",()=>{
 assert.deepEqual(M.tramos("a \u0001B\u0002 c \u0003D\u0004"),[
  {t:"a ",b:false,u:false},{t:"B",b:true,u:true},{t:" c ",b:false,u:false},{t:"D",b:true,u:false}]);
});

test("las sugerencias: un candidato por número, escrito como un número de verdad",()=>{
 const g=M.geometria(M.limpiar(URBANO.replace("lado 2-3 de 10,00","lado 2-3 de 10,04")));
 const t=g.sugerencias.join(" ");
 assert.ok(t.includes("la medida del lado 2-3, que dice 10,04, sería 10,00"),t);
 assert.ok(!/10,01|10,0[^0-9]/.test(t.replace("10,04","")),"no repite el mismo lado con otro valor: "+t);
 for(const raro of ["92°07'306\"","0135°","1270°","0.1"]) assert.ok(!t.includes(raro));
 const rur=M.geometria("Partiendo del vértice A con rumbo de 0°00'00\" y un ángulo interno de 90°00'00\", lado A-B de 200,00 m; a partir de B, con un ángulo interno de 90°00'00\", lado B-C de 223,38 m; a partir de C, con un ángulo interno de 90°00'00\", lado C-D de 200,00 m; a partir de D, con un ángulo interno de 90°00'00\", lado D-A de 223,38 m; encerrando una superficie de 1 Has 4676 m2.");
 assert.match(rur.sugerencias.join(" "),/las hectáreas de la superficie, que dicen 1, serían 4\./);
});

test("la tolerancia de cierre sale del redondeo: un campo con un lado 10 cm corrido no sale en verde",()=>{
 const R=l=>`Partiendo del vértice "A" con un rumbo de 90°00'00", y un ángulo en dicho vértice de 90°00'00" y una distancia de 3000,00 m llegamos al vértice "B"; a partir de B, con un ángulo interno de 90°00'00", lado B-C de 1700,00 m; a partir de C, con un ángulo interno de 90°00'00", lado C-D de 3000,00 m; a partir de D, con un ángulo interno de 90°00'00", lado D-A de ${l} m; encerrando una superficie de 510 Has 0 m2.`;
 assert.equal(M.geometria(R("1700,00")).estado,"ok");
 assert.equal(M.geometria(R("1700,10")).estado,"mal");
});

test("números de diez cifras o más quedan en número y se avisan",()=>{
 const r=M.procesar("designado como LOTE 999001888002, que mide 10 m.");
 assert.ok(!/undefined/i.test(r.letras),r.letras);
 assert.ok(r.avisos.some(a=>/diez cifras/.test(a)));
 assert.doesNotThrow(()=>M.procesar("superficie de "+"9".repeat(5000)+" m2"));
});

test("lotes con letra, «1 metro», «N°» y linderos con ceros adelante",()=>{
 const d=M.procesar("Lote de terreno designado como LOTE 5A de la MANZANA 12, mide 1 metro, linda al N. con Lote 6b, con el vértice N° 1 y con Parcela 045.");
 assert.ok(d.letras.includes("\u0001LOTE CINCO A de la MANZANA DOCE\u0002"),d.letras);
 const p=plano(d.letras);
 assert.ok(p.includes("mide un metro,"),p);
 assert.ok(p.includes("con Lote seis b"),p);
 assert.ok(p.includes("vértice N° uno"),p);
 assert.ok(p.includes("Parcela 045"),p);
 assert.ok(!d.avisos.some(a=>/unidad/.test(a)));
});

test("la fiel conserva las barras de las abreviaturas y los espacios del renglón",()=>{
 assert.equal(M.limpiar("linda al N. c/\ncalle Ejemplo; calle S/\nN; y/\no sus sucesores"),"linda al N. c/calle Ejemplo; calle S/N; y/o sus sucesores");
 assert.equal(M.limpiar("designado como Lote N°\n5 de la Manzana 12 ;"),"designado como Lote N° 5 de la Manzana 12 ;");
 assert.equal(M.limpiar("con los lotes 6,\n7 y 8. Al S. con Lote 14.\n25 m de frente"),"con los lotes 6, 7 y 8. Al S. con Lote 14. 25 m de frente");
});

