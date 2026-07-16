import sys
from PIL import Image, ImageDraw, ImageFont

def process_image(input_path, output_path):
    try:
        # Open the image and convert to RGBA
        img = Image.open(input_path).convert("RGBA")
        
        # Make white background transparent
        datas = img.getdata()
        newData = []
        for item in datas:
            # If the pixel is very bright (close to white), make it transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        
        # Crop the transparent borders (zooms in a bit)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        # Draw "AB" in the center
        draw = ImageDraw.Draw(img)
        width, height = img.size
        
        # Try to use a standard font, fallback to default if not available
        try:
            # In Windows, Arial is usually available
            font = ImageFont.truetype("arialbd.ttf", int(height * 0.35))
        except:
            font = ImageFont.load_default()
            
        # Get text size to center it
        text = "AB"
        try:
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
        except AttributeError:
            text_width, text_height = draw.textsize(text, font=font)
            
        x = (width - text_width) / 2
        y = (height - text_height) / 2 - (height * 0.05) # slight vertical offset for optical centering
        
        # Draw text with white color
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
        
        img.save(output_path, "PNG")
        print("Successfully processed and saved image to", output_path)
    except Exception as e:
        print("Error processing image:", e)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_img.py <input> <output>")
        sys.exit(1)
    process_image(sys.argv[1], sys.argv[2])
