"""Arma pruebas/matriculas-inventadas.pdf: dos matrículas de mentira, para probar la pantalla.
Todo es inventado. Se corre con: python3 pruebas/hacer-pdf-inventado.py"""
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
import os
destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), "matriculas-inventadas.pdf")
c = canvas.Canvas(destino, pagesize=landscape(A4))
def hoja(num, lineas):
    c.setFont("Helvetica-Bold", 14); c.drawString(40, 550, "EJEMPLO INVENTADO - NO ES UNA MATRICULA REAL")
    c.setFont("Helvetica-Bold", 11); c.drawString(40, 520, f"1-MATRICULA: {num}")
    c.drawString(40, 504, "3-CUENTA: 99-99-9999999-9"); c.drawString(40, 488, "4-NOMENCLATURA: RU D:99 Ped:99 Hoja:999001 P:888002")
    c.drawString(40, 460, "5-DESCRIPCION DEL INMUEBLE:")
    c.setFont("Courier", 8)
    y = 444
    for l in lineas:
        c.drawString(40, y, l); y -= 12
    c.showPage()
hoja("9990001", ["Parcela ubicada en Departamento Ejemplo, Pedania Prueba, designado como LOTE 999001-888002 ////",
                 "superficie de 92 Has 6626 m2 y linda con camino publico. ////////////////"])
hoja("9990002", ["LOTE 12 de la MANZANA 5, ubicado en Barrio Ejemplo, con una superficie de 300,48 m2. ////"])
c.save()
print(destino)
