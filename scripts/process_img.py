import sys
from PIL import Image

def process_image(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # If the pixel is very dark (close to black), make it transparent
            if item[0] < 30 and item[1] < 30 and item[2] < 30:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # Crop the transparent borders
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(output_path, "PNG")
        print("Successfully processed and saved image to", output_path)
    except Exception as e:
        print("Error processing image:", e)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_img.py <input> <output>")
        sys.exit(1)
    process_image(sys.argv[1], sys.argv[2])
