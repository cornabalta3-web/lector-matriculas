# Lector de matrículas

Lee matrículas del Registro General de la Provincia de Córdoba en PDF y devuelve la descripción
del inmueble en dos versiones, lista para pegar en Word:

- **Fiel**: lo que dice la matrícula, sin las barras de relleno.
- **En letras**: medidas, superficie, designación del lote y números de vértice escritos en letras,
  como pide el art. 54 de la ley notarial. Ángulos, rumbos y códigos de linderos quedan en número.

Además comprueba la geometría: con los ángulos y las medidas rearma el polígono, y avisa si no
cierra o si no da la superficie declarada. Si un solo número lo arregla, lo propone.

**Página:** https://cornabalta3-web.github.io/lector-matriculas/

## Cómo se usa

1. La primera vez, cargar la clave de la API de Anthropic en «Clave de la API». Queda guardada
   sólo en ese navegador.
2. Arrastrar uno o varios PDF —un PDF puede traer varias matrículas— o, desde el celular, tocar
   «Sacar foto», sacar una foto por hoja y tocar «Leer esta matrícula». Desde el celular, el texto
   se manda a la compu con «Compartir».
3. Comparar lo leído con la matrícula, que se ve al lado. Si algo está mal leído, se corrige en la
   versión fiel y la versión en letras se rehace sola.
4. «Copiar» y pegar en Word.

Las fotos y los PDF se mandan a Anthropic para leerlos, y cada lectura cuesta unos centavos de dólar por
matrícula. Lo que sale lo escribió una máquina: se compara con la matrícula antes de usarlo.

## Pruebas

```
node --test pruebas/motor.test.js
node pruebas/pantalla.js
```

Todos los datos de las pruebas son inventados.
