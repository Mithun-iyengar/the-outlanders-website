from PIL import Image
import shutil
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
p = os.path.join(ROOT, 'images', 'intro', 'intro.jpg')
if not os.path.exists(p):
    print('File not found:', p)
    raise SystemExit(1)

bak = p + '.bak'
shutil.copy2(p, bak)
print('Backup created:', bak)

img = Image.open(p)
w, h = img.size
print('Original size:', w, 'x', h)
if w > 1200:
    neww = 1200
    newh = int(h * neww / w)
    img = img.resize((neww, newh), Image.LANCZOS)
    print('Resized to:', neww, 'x', newh)
else:
    print('No resize needed; width <= 1200')

img.save(p, quality=78, optimize=True)
print('Saved optimized image:', p)
