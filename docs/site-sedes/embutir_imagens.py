#!/usr/bin/env python3
"""Embute as imagens de img/ no index.html como variáveis CSS (data URI).

Assim o index.html funciona sozinho (enviado por e-mail, aberto no celular,
anexado etc.), sem depender da pasta img/.

Uso:  python3 embutir_imagens.py
No HTML, use  var(--img-<nome-do-arquivo-sem-extensão>)  como background-image.
"""
import base64, pathlib, re

AQUI = pathlib.Path(__file__).resolve().parent
HTML = AQUI / "index.html"
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}

linhas = []
for f in sorted((AQUI / "img").iterdir()):
    if f.suffix.lower() not in MIME:
        continue
    b64 = base64.b64encode(f.read_bytes()).decode()
    linhas.append(f'  --img-{f.stem}:url("data:{MIME[f.suffix.lower()]};base64,{b64}");')

bloco = '<style id="imagens-embutidas">\n:root{\n' + "\n".join(linhas) + "\n}\n</style>"
html = HTML.read_text(encoding="utf-8")
html, n = re.subn(r'<style id="imagens-embutidas">.*?</style>', lambda m: bloco, html, flags=re.S)
if n != 1:
    raise SystemExit('Bloco <style id="imagens-embutidas"> não encontrado (ou duplicado) no index.html')
HTML.write_text(html, encoding="utf-8")
print(f"{len(linhas)} imagens embutidas · index.html com {len(html)/1024:.0f} KB")
