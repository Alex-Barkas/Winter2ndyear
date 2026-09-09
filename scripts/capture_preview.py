import os
import subprocess

html_content = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Favicon Preview</title>
</head>
<body style="margin:0; background:#09090b; display:flex; flex-direction:column; gap:24px; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
  <div style="display:flex; gap:36px; align-items:center;">
    <div style="text-align:center;">
      <div style="color:#a1a1aa; font-size:12px; margin-bottom:8px;">Detailed (160px)</div>
      <img src="/assets/queens_favicon.svg" style="width:160px; height:160px;">
    </div>
    <div style="display:flex; flex-direction:column; gap:16px;">
      <!-- Dark Tab -->
      <div>
        <div style="color:#a1a1aa; font-size:12px; margin-bottom:6px;">Dark Tab (24px)</div>
        <div style="background:#202124; padding:8px 14px; border-radius:8px 8px 0 0; display:inline-flex; align-items:center; gap:10px; width:220px;">
          <img src="/assets/queens_favicon.svg" style="width:20px; height:20px;">
          <span style="color:#e8eaed; font-size:12px; font-weight:400; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Fall 2026 - Alex's Dashboard</span>
        </div>
      </div>
      <!-- Light Tab -->
      <div>
        <div style="color:#a1a1aa; font-size:12px; margin-bottom:6px;">Light Tab (24px)</div>
        <div style="background:#dee1e6; padding:8px 14px; border-radius:8px 8px 0 0; display:inline-flex; align-items:center; gap:10px; width:220px;">
          <img src="/assets/queens_favicon.svg" style="width:20px; height:20px;">
          <span style="color:#3c4043; font-size:12px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Fall 2026 - Alex's Dashboard</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

preview_html_path = os.path.abspath("public/assets/test_preview.html")
with open(preview_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out_png = os.path.abspath("public/assets/preview_queens_favicon.png")
url = "http://localhost:4321/assets/test_preview.html"
subprocess.run([chrome, "--headless", "--disable-gpu", f"--screenshot={out_png}", "--window-size=650,300", url], check=True)
print("Updated preview screenshot captured.")
