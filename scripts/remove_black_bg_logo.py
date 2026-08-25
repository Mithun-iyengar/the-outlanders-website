from PIL import Image
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
logo_path = os.path.normpath(os.path.join(ROOT, 'images', 'logo', 'outlanders-logo.png'))
backup_path = logo_path + '.bak'

if not os.path.exists(logo_path):
    print('Logo not found at', logo_path)
    raise SystemExit(1)

# backup
if not os.path.exists(backup_path):
    print('Creating backup:', backup_path)
    open(backup_path, 'wb').write(open(logo_path, 'rb').read())

print('Processing:', logo_path)
img = Image.open(logo_path).convert('RGBA')
px = img.load()
w,h = img.size
threshold = 30
count = 0
for y in range(h):
    for x in range(w):
        r,g,b,a = px[x,y]
        if r < threshold and g < threshold and b < threshold:
            # make transparent
            px[x,y] = (r,g,b,0)
            count += 1

img.save(logo_path)
print(f'Done. Updated {count} pixels. Saved to', logo_path)
