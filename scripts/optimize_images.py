import os
import shutil
from PIL import Image

backup_dir = 'public/originals_backup'
os.makedirs(backup_dir, exist_ok=True)

targets = ['favicon.png', 'logo-book.png', 'apple-icon.png', 'pairfect-portrait.png']
for t in targets:
    src = os.path.join('public', t)
    dst = os.path.join(backup_dir, t)
    if os.path.exists(src) and not os.path.exists(dst):
        shutil.copyfile(src, dst)
        print(f"Backed up {src} -> {dst}")

# 1. Favicon: 48x48 high quality RGBA PNG
fav = Image.open(os.path.join(backup_dir, 'favicon.png'))
fav_48 = fav.resize((48, 48), Image.Resampling.LANCZOS)
fav_48.save('public/favicon.png', 'PNG', optimize=True)
fav_48.save('public/favicon.ico', format='ICO', sizes=[(48, 48)])
print(f"Optimized favicon.png: {os.path.getsize('public/favicon.png')} bytes")

# 2. Apple Touch Icon: 180x180 RGBA PNG
apple = Image.open(os.path.join(backup_dir, 'apple-icon.png'))
apple_180 = apple.resize((180, 180), Image.Resampling.LANCZOS)
apple_180.save('public/apple-icon.png', 'PNG', optimize=True)
print(f"Optimized apple-icon.png: {os.path.getsize('public/apple-icon.png')} bytes")

# 3. Logo book: 128x128 RGBA PNG (renders razor sharp up to 64x64 on 2x retina)
logo = Image.open(os.path.join(backup_dir, 'logo-book.png'))
logo_128 = logo.resize((128, 128), Image.Resampling.LANCZOS)
logo_128.save('public/logo-book.png', 'PNG', optimize=True)
print(f"Optimized logo-book.png: {os.path.getsize('public/logo-book.png')} bytes")

# 4. Pairfect portrait: compress PNG
port = Image.open(os.path.join(backup_dir, 'pairfect-portrait.png'))
port.save('public/pairfect-portrait.png', 'PNG', optimize=True)
print(f"Optimized pairfect-portrait.png: {os.path.getsize('public/pairfect-portrait.png')} bytes")
