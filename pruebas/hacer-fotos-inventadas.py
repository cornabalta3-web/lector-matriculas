"""Arma pruebas/foto-inventada-1.jpg y -2.jpg: dos «fotos de celular» de una matrícula de
mentira (3000 x 2250 px), para probar la cámara de la pantalla. Todo es inventado.
Se corre con: python3 pruebas/hacer-fotos-inventadas.py"""
from PIL import Image, ImageDraw
import os
aqui = os.path.dirname(os.path.abspath(__file__))
for n, lineas in [(1, ["EJEMPLO INVENTADO - NO ES UNA MATRICULA REAL", "1-MATRICULA: 9990003",
                       "5-DESCRIPCION DEL INMUEBLE: LOTE 12 de la MANZANA 5, ubicado en Barrio Ejemplo,",
                       "que mide 10,00 m de frente por 30,00 m de fondo ////////////"]),
                  (2, ["EJEMPLO INVENTADO - ANEXO", "con una superficie de 300,00 m2. ///////////////"])]:
    im = Image.new("RGB", (3000, 2250), (236, 232, 222))
    d = ImageDraw.Draw(im)
    d.rectangle([150, 150, 2850, 2100], outline=(40, 40, 40), width=6)
    y = 300
    for l in lineas:
        d.text((250, y), l, fill=(20, 20, 20)); y += 120
    im.rotate(1.5, fillcolor=(200, 196, 188)).save(os.path.join(aqui, f"foto-inventada-{n}.jpg"), quality=85)
    print(os.path.join(aqui, f"foto-inventada-{n}.jpg"))
