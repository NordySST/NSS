"""Gera dist/rumo-a-gloria.html: o jogo inteiro em um único arquivo."""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
index = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css/style.css').read_text(encoding='utf-8')
scripts = re.findall(r'<script src="([^"]+)"></script>', index)
js = '\n'.join((root / s).read_text(encoding='utf-8') for s in scripts)

out = f'''<title>Rumo à Glória</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
{css}
</style>
<div id="app"></div>
<script>
{js}
</script>
'''
dist = root / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'rumo-a-gloria.html').write_text(out, encoding='utf-8')
print('ok', len(out), 'bytes')
