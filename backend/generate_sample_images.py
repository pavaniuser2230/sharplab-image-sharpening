from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parent
samples_dir = root / 'sample_images'
samples_dir.mkdir(exist_ok=True)


def create_city_scene(path: Path):
    width, height = 1200, 900
    img = Image.new('RGB', (width, height), '#dfeaf7')
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 500, width, height), fill='#8ea9be')
    draw.rectangle((0, 420, width, 500), fill='#baccd9')
    for x in range(80, width, 140):
        h = 230 + ((x // 140) % 3) * 70
        draw.rectangle((x, 500 - h, x + 60, 500), fill='#2f3746')
    draw.rectangle((180, 240, 360, 500), fill='#e9ecf3')
    draw.rectangle((620, 180, 820, 500), fill='#e8ebf3')
    draw.rectangle((930, 260, 1090, 500), fill='#edf2f9')
    for i in range(0, 400, 40):
        x = 120 + i
        draw.line((x, 180, x + 20, 420), fill='#3a4b5e', width=5)
    img.save(path)


def create_forest_scene(path: Path):
    width, height = 1200, 900
    img = Image.new('RGB', (width, height), '#dff4e3')
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 500, width, height), fill='#4b7b56')
    for x in range(0, width, 60):
        hill = 350 + ((x // 60) % 3) * 30
        draw.ellipse((x - 120, hill, x + 220, 620), fill='#5e8f65')
    for x in range(100, width, 90):
        draw.rectangle((x, 360, x + 18, 500), fill='#312b20')
        draw.polygon([(x - 30, 360), (x + 12, 220), (x + 54, 360)], fill='#285b3d')
        draw.polygon([(x - 18, 360), (x + 28, 260), (x + 80, 360)], fill='#2c6a45')
    img.save(path)


def create_portrait(path: Path):
    width, height = 1200, 900
    img = Image.new('RGB', (width, height), '#f3e9de')
    draw = ImageDraw.Draw(img)
    draw.ellipse((350, 150, 850, 700), fill='#d9b69a')
    draw.rectangle((420, 330, 780, 520), fill='#e8c7ae')
    draw.ellipse((440, 220, 760, 360), fill='#3a2f2a')
    draw.arc((445, 210, 760, 360), 160, 380, fill='#2e241f', width=12)
    draw.ellipse((515, 260, 575, 320), fill='#f8efe7')
    draw.ellipse((625, 260, 685, 320), fill='#f8efe7')
    draw.arc((520, 350, 680, 420), 200, 340, fill='#8a4d46', width=8)
    draw.rectangle((420, 560, 780, 710), fill='#2b3547')
    draw.rectangle((300, 700, 900, 860), fill='#4c5d7b')
    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(path)


create_city_scene(samples_dir / 'city-scene.jpg')
create_forest_scene(samples_dir / 'forest-scene.jpg')
create_portrait(samples_dir / 'portrait.jpg')
print(f'Created sample images in {samples_dir}')
