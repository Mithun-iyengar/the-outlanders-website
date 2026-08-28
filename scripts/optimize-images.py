import os
import sys
from PIL import Image

IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'images')

def optimize_image(filepath):
    try:
        rel_path = os.path.relpath(filepath, IMAGES_DIR)
        original_size = os.path.getsize(filepath)
        
        with Image.open(filepath) as img:
            width, height = img.size
            max_dim = 1600

            # Resize if overly large (> 1600px)
            if width > max_dim or height > max_dim:
                if width > height:
                    new_height = int((height * max_dim) / width)
                    new_width = max_dim
                else:
                    new_width = int((width * max_dim) / height)
                    new_height = max_dim
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Generate .webp version
            webp_path = os.path.splitext(filepath)[0] + '.webp'
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img.save(webp_path, 'WEBP', quality=80, method=6)
            else:
                rgb_img = img.convert('RGB')
                rgb_img.save(webp_path, 'WEBP', quality=80, method=6)

            # Also optimize the existing file in-place if JPEG/PNG
            ext = os.path.splitext(filepath)[1].lower()
            if ext in ('.jpg', '.jpeg'):
                rgb_img = img.convert('RGB')
                rgb_img.save(filepath, 'JPEG', quality=80, optimize=True)
            elif ext == '.png':
                if img.mode != 'RGB' and img.mode != 'RGBA':
                    img = img.convert('RGBA')
                img.save(filepath, 'PNG', optimize=True)

        new_size = os.path.getsize(filepath)
        webp_size = os.path.getsize(webp_path) if os.path.exists(webp_path) else 0
        print(f"Compressed: {rel_path} (Raw: {original_size/1024:.1f}KB -> Opt: {new_size/1024:.1f}KB, WebP: {webp_size/1024:.1f}KB)")
    except Exception as e:
        print(f"Error optimizing {filepath}: {e}")

def main():
    print("Optimizing images in repository...")
    for root, dirs, files in os.walk(IMAGES_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ('.jpg', '.jpeg', '.png'):
                full_path = os.path.join(root, f)
                optimize_image(full_path)
    print("Image optimization complete!")

if __name__ == '__main__':
    main()
