"""Gera dist/rumo-a-gloria.html: o jogo inteiro em um único arquivo (para publicar como página).
A versão PWA (offline/instalável) usa index.html + manifest.webmanifest + sw.js."""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
index = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'src/ui/style.css').read_text(encoding='utf-8')
scripts = re.findall(r'<script src="([^"]+)"></script>', index)
js = '\n'.join((root / s).read_text(encoding='utf-8') for s in scripts)

out = f'''<title>Rumo à Glória</title>
<meta name="theme-color" content="#0b1420">
<style>
{css}
</style>
<div id="stage"></div>
<div id="rotate" hidden><span>📱</span><span class="rot">↻</span></div>
<script>window.__noSW = true;</script>
<script>
{js}
</script>
'''
dist = root / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'rumo-a-gloria.html').write_text(out, encoding='utf-8')
print('ok', len(out), 'bytes')
