import os
import subprocess

# Optimized Queen's University / Engineering SVG Favicon
# Built with pure scalable vector geometry for ultra-crisp display at 16px, 32px, 64px, and retina sizes.
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <defs>
    <!-- Queen's Official Palette Gradients -->
    <linearGradient id="qGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE680"/>
      <stop offset="40%" stop-color="#FABD0F"/>
      <stop offset="100%" stop-color="#E09E00"/>
    </linearGradient>
    
    <linearGradient id="qRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D92644"/>
      <stop offset="100%" stop-color="#9D102D"/>
    </linearGradient>
    
    <linearGradient id="qNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002D69"/>
      <stop offset="100%" stop-color="#001633"/>
    </linearGradient>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#000" flood-opacity="0.6"/>
    </filter>

    <clipPath id="badgeBorder">
      <rect x="2" y="2" width="60" height="60" rx="14"/>
    </clipPath>
  </defs>

  <!-- Deep Navy Base with Gold Border -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#qNavyGrad)" stroke="url(#qGoldGrad)" stroke-width="2"/>

  <!-- Queen's Tricolour Accent Ribbons (Bottom-Right Corner) -->
  <g clip-path="url(#badgeBorder)">
    <!-- Red Stripe -->
    <polygon points="36,64 45,64 64,45 64,36" fill="url(#qRedGrad)"/>
    <!-- Gold Stripe -->
    <polygon points="46,64 54,64 64,54 64,46" fill="url(#qGoldGrad)"/>
    <!-- Royal Blue Stripe -->
    <polygon points="55,64 64,64 64,55" fill="#003B82"/>
  </g>

  <!-- Crown and Q Group with subtle shadow for crisp contrast -->
  <g filter="url(#softGlow)">
    <!-- ================= ROYAL CROWN ================= -->
    <!-- Red velvet cap interior -->
    <path d="M 21.5 19 C 21.5 13.5 42.5 13.5 42.5 19 Z" fill="url(#qRedGrad)"/>
    
    <!-- Golden Headband Base -->
    <path d="M 19 19.5 L 45 19.5 C 45 22 19 22 19 19.5 Z" fill="url(#qGoldGrad)"/>
    
    <!-- Headband Gems -->
    <circle cx="22" cy="20.8" r="0.8" fill="url(#qRedGrad)"/>
    <circle cx="26" cy="20.8" r="0.8" fill="#002D69"/>
    <circle cx="32" cy="20.8" r="1.0" fill="url(#qRedGrad)"/>
    <circle cx="38" cy="20.8" r="0.8" fill="#002D69"/>
    <circle cx="42" cy="20.8" r="0.8" fill="url(#qRedGrad)"/>

    <!-- Crown Peaks / Arches -->
    <!-- Left outer peak -->
    <polygon points="19,19.5 22,14.5 25,19.5" fill="url(#qGoldGrad)"/>
    <circle cx="22" cy="14" r="1" fill="#FFFFFF"/>

    <!-- Left inner arch -->
    <path d="M 24 19.5 C 25 15.5 29 13 32 12.5 C 29 15 26 17 25 19.5 Z" fill="url(#qGoldGrad)"/>

    <!-- Center peak -->
    <polygon points="29.5,19.5 32,12.5 34.5,19.5" fill="url(#qGoldGrad)"/>

    <!-- Right inner arch -->
    <path d="M 40 19.5 C 39 15.5 35 13 32 12.5 C 35 15 38 17 39 19.5 Z" fill="url(#qGoldGrad)"/>

    <!-- Right outer peak -->
    <polygon points="39,19.5 42,14.5 45,19.5" fill="url(#qGoldGrad)"/>
    <circle cx="42" cy="14" r="1" fill="#FFFFFF"/>

    <!-- Cross Pattée at the summit -->
    <path d="M 31 11 L 33 11 L 33 9.8 L 34.2 9.8 L 34.2 8.2 L 32.8 8.2 L 32.8 6.5 L 31.2 6.5 L 31.2 8.2 L 29.8 8.2 L 29.8 9.8 L 31 9.8 Z" fill="url(#qGoldGrad)"/>
    <circle cx="32" cy="11.5" r="0.9" fill="url(#qGoldGrad)"/>

    <!-- ================= QUEEN'S "Q" MONOGRAM ================= -->
    <!-- Outer oval of Q -->
    <path d="M 32 23.5
             C 20.5 23.5, 13 30.5, 13 41
             C 13 51, 20.5 57.5, 32 57.5
             C 43.5 57.5, 51 51, 51 41
             C 51 30.5, 43.5 23.5, 32 23.5 Z
             M 32 29.5
             C 38.5 29.5, 43.5 34.5, 43.5 41
             C 43.5 47.5, 38.5 51.5, 32 51.5
             C 25.5 51.5, 20.5 47.5, 20.5 41
             C 20.5 34.5, 25.5 29.5, 32 29.5 Z"
          fill="url(#qGoldGrad)"/>
          
    <!-- Dynamic Queen's Q Tail -->
    <path d="M 36 47
             C 39.5 47.5, 43 49, 46.5 52.5
             C 49.5 55.5, 53.5 57.5, 56.5 57.5
             C 57.2 57.5, 57.6 56.5, 56.5 55
             C 53.5 51, 48 46.5, 42.5 44
             C 40 43, 37.5 44.5, 36 47 Z"
          fill="url(#qGoldGrad)"/>
  </g>
</svg>"""

out_svg = os.path.abspath("public/assets/queens_favicon.svg")
with open(out_svg, "w", encoding="utf-8") as f:
    f.write(svg_content)

print(f"Written: {out_svg}")

# Render to 256x256 PNG preview using Chrome
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out_png = os.path.abspath("public/assets/preview_queens_favicon.png")
url = "http://localhost:4321/assets/queens_favicon.svg"
subprocess.run([chrome, "--headless", "--disable-gpu", f"--screenshot={out_png}", "--window-size=256,256", url], check=True)
print(f"Rendered preview: {out_png}")
