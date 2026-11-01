"""Arma icono-180.png, el ícono de la pantalla de inicio del celular: una hoja con renglones sobre
el azul pizarra de la página, cuadrado y con fondo opaco (el iPhone redondea las esquinas solo).
Se corre con: python3 pruebas/hacer-icono.py"""
from pathlib import Path
from PIL import Image, ImageDraw

K = 4                       # se dibuja a 4x y se achica, para que los bordes queden suaves
L = 180 * K
img = Image.new("RGB", (L, L), (0x2f, 0x4f, 0x6f))
d = ImageDraw.Draw(img)
# la hoja
x0, y0, x1, y1 = 46 * K, 28 * K, 134 * K, 152 * K
d.rounded_rectangle((x0, y0, x1, y1), radius=10 * K, fill=(0xf6, 0xf5, 0xf2))
# el renglón del título, más grueso, y los renglones del texto
d.rounded_rectangle((60 * K, 46 * K, 104 * K, 56 * K), radius=5 * K, fill=(0x2f, 0x4f, 0x6f))
for i, largo in enumerate([60, 60, 52, 60, 40]):
    y = (72 + i * 15) * K
    d.rounded_rectangle((60 * K, y, (60 + largo) * K, y + 6 * K), radius=3 * K, fill=(0x8a, 0x97, 0xa5))
img = img.resize((180, 180), Image.LANCZOS)
destino = Path(__file__).resolve().parent.parent / "icono-180.png"
img.save(destino, optimize=True)
print(destino, destino.stat().st_size, "bytes")
