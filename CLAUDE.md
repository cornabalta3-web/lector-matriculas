# Lector de matrículas

Una página web para una escribana con registro de la Provincia de Córdoba: arrastra el PDF de una
o varias matrículas del Registro General y sale la descripción del inmueble —fiel y en letras—
lista para pegar en la escritura, en Word. La pidió Baltasar, el dueño del repositorio, el
20/10/2026, después de un interrogatorio que está resumido abajo.

**Quién es la escribana no va en el código ni en este documento**: ni su nombre ni ningún dato que
la identifique. El repositorio es público.

Es un repositorio **público** y se publica con GitHub Pages:
`https://cornabalta3-web.github.io/lector-matriculas/`. **Nunca entra un dato real**: ni
matrículas, ni nombres, ni DNI, ni cuentas, ni nomenclaturas, ni medidas copiadas de una
matrícula verdadera. Los ejemplos y las pruebas son inventados. Las matrículas reales se
trabajan en el scratchpad de la sesión y se devuelven por el chat.

## Cómo está armado

```
index.html     La pantalla, la llamada a la API, lo que se guarda en el navegador y el portapapeles
motor.js       El texto: la versión fiel, el pase a letras, los avisos y la comprobación geométrica.
               No sabe nada de la pantalla ni de la API, y se prueba solo con node
pruebas/
  motor.test.js               node --test pruebas/motor.test.js
  pantalla.js                 node pruebas/pantalla.js [carpeta-de-capturas] — Chromium con la API simulada
  sin-datos-reales.js         node pruebas/sin-datos-reales.js <archivo> — que no se cuele ningún número real
  hacer-pdf-inventado.py      arma matriculas-inventadas.pdf, el PDF de mentira para la pantalla
  matriculas-inventadas.pdf
  hacer-fotos-inventadas.py   arma foto-inventada-1.jpg y -2.jpg, dos «fotos de celular» de mentira
```

Sin librerías, sin compilar, sin servidor. La API de Anthropic se llama con `fetch` desde el
navegador, igual que en el DDJJ, el rogador y minuta-social del SIGEC.

## Lo que se decidió (interrogatorio del 20/10/2026)

- **Ella es escribana con registro**, la descripción va a una escritura que arma en Word, y las
  matrículas le llegan en PDF (le gusta imprimirlas, pero siempre está el PDF). Usa Windows y se
  maneja bien.
- **Lo principal es la descripción.** Los otros datos —cuenta, nomenclatura, antecedente, plano,
  titulares, gravámenes— salen en la misma lectura, abajo y más chicos, cada uno con su botón.
- **Fiel o en letras «depende del trámite»**: salen las dos, cada una con su botón de copiar.
  - **Fiel**: lo que dice la matrícula. Sólo se sacan las barras de relleno y se unen los renglones.
    No se corrige nada, ni las faltas de ortografía del Registro.
  - **En letras**: «de la forma que está establecido para escrituras sociales, no se toca nada del
    contenido, sólo se pasa a letras lo que se debe pasar a letras» (Baltasar). O sea, el art. 54
    L.O.N.: medidas lineales, superficie (en mayúscula), designación del lote y manzana —en los
    rurales, el código Hoja-Parcela— y números de vértice. Ángulos, rumbos, vértices con letra,
    códigos de los linderos, expedientes y planos quedan en número.
  - Los rumbos abreviados se escriben enteros fuera de paréntesis, como en escrituras sociales,
    pero nunca cuando son nombres de vértice («a partir de N», «lado N-A»), que en las rurales
    son lo común.
- **Formato**: negrita y subrayado en la designación, negrita en la superficie. Se copia **sin
  fuente**, para que Word, con «Combinar formato», tome la letra del documento y conserve las
  negritas. Hay que probarlo en su Word.
- **Lectura con la API** (`claude-opus-5-5`), no con OCR: los PDF que trajo son escaneos de una
  fotocopiadora, sin capa de texto. Cuesta unos centavos de dólar por matrícula.
- **La clave es de Baltasar, pero una aparte para ella**, con su propio nombre y límite de gasto, cargada
  una vez en su navegador. Nunca en el código: el repositorio es público.
- **Página web aparte**, sin el logo de la EGG: no es una herramienta de la Escribanía.
- **Varias matrículas juntas**: varios PDF a la vez, y un PDF puede traer varias matrículas (el
  primero que trajo traía siete).
- **Fotos con el celular** (pedido del 20/10, después de la primera versión): abre la página en el
  celular, toca «Sacar foto», saca una foto por hoja —si la matrícula sigue en un anexo, también—
  y toca «Leer esta matrícula»: todas las fotos van en un solo pedido, cada una rotulada («Hoja
  1:»), y la descripción sale entera. Ella toca el botón; la cámara no dispara sola. El texto le
  llega a la compu con «Compartir» (WhatsApp o mail), sin las negritas, y la pantalla lo avisa.
  En la compu el mismo botón dice «Agregar fotos», y una foto arrastrada va a la bandeja.
  La foto se achica justo al tope que aprovecha el modelo (2576 px de lado largo, 4784 tokens)
  y no se comprime de más: la documentación avisa que la compresión fuerte arruina el texto.
- **El PDF al lado** del texto para comparar, en pantallas anchas.
- **Se guarda sólo la última tanda**, en el navegador, con los PDF: si cierra sin querer, vuelve.
- **Tipos de inmueble**: lotes urbanos, propiedad horizontal y rurales.

## La comprobación geométrica

Salió de transcribir las primeras siete matrículas: con los ángulos internos y las medidas se
rearma el polígono, y si los números están bien, cierra y da la superficie declarada. Con las
siete reales cerraron seis al centímetro; la séptima tenía un ángulo al que el Registro le había
comido un dígito, y la cuenta lo encontró y propuso el correcto. También confirmó los números que
tapaban las marcas de lapicera. **Es la mejor red contra un número mal leído o mal escrito**:
Baltasar dijo «dale» cuando se la propuso. Si un solo número arregla el polígono —un ángulo, o
una medida con un dígito cambiado—, la pantalla lo propone.

## Reglas

- **Probar antes de entregar**: `node --test pruebas/motor.test.js` y `node pruebas/pantalla.js`.
- **Antes de commitear, si en la sesión se trabajó con matrículas reales**:
  `node pruebas/sin-datos-reales.js <archivo-con-los-datos-reales>`. Busca en el repositorio los
  números de esas matrículas sin mostrarlos. El 20/10 se habían colado medidas, códigos y un
  ángulo reales en comentarios y pruebas; los encontró la revisión antes del primer commit.
  La pantalla se prueba servida por http (como en Pages), en ancho y a 390 px, en claro y oscuro.
- **Un cambio en el motor que mejora un caso y rompe otro no es una mejora.** Las siete
  matrículas reales del 20/10 están en el scratchpad de esa sesión, no acá; si hace falta volver
  a probar con reales, se piden de nuevo.
- **Lo que vuelve de la API se marca como leído por una máquina** y se avisa todo lo dudoso: las
  dudas del modelo, los `[ilegible]`, los números que quedaron sin clasificar y la geometría.
- **No romper el foco al escribir**: corregir la fiel rehace la versión en letras en su lugar,
  sin redibujar la tarjeta.
- **La fecha de versión al pie** («Versión del dd/mm/aaaa») se cambia a mano en `index.html`.
- **Ramas**: `main` es lo que ve ella en la página. El trabajo va en una rama y se pasa a `main`
  cuando Baltasar dice «pasalo», como en el SIGEC.

## Pendiente

1. **La primera lectura de verdad**, con la clave, en la máquina de Baltasar y después en la de
   ella. Desde la sesión no hay clave: la llamada se probó simulada (cuerpo, cabeceras, streaming,
   errores) pero nunca contra la API.
2. **Las fotos de verdad**: sacarle fotos a una matrícula impresa con el celular de ella y ver
   cómo lee —con buena luz, con sombra, torcida—. La clave tiene que estar cargada también en el
   celular.
3. **Las hojas giradas.** Las matrículas escaneadas vienen apaisadas y giradas. El modelo lee el
   PDF tal cual; si la lectura sale mal, el paso siguiente es girar las hojas en el navegador
   antes de mandarlas (hace falta pdf.js).
4. **El estilo de ella**, que sale de una escritura suya con una descripción ya pasada: si pone
   la cifra entre paréntesis después de las letras, si los códigos de doce dígitos van en letras,
   cómo escribe los vértices mixtos (hoy «lado A-uno») y si une hectáreas y metros con «con».
5. **Propiedad horizontal**: qué va en letras (unidad funcional, posiciones, porcentual). Hoy lo
   que no es medida ni superficie queda en número y se avisa.
6. **Que Word conserve las negritas al pegar** en su computadora.
