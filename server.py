import http.server
import socketserver
import os
import urllib.parse

PORT = 8080

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve static files from 'public' directory
        path_clean = self.path.split('?')[0]
        decoded_path = urllib.parse.unquote(path_clean)
        if path_clean == '/':
            self.path = '/public/index.html'
        elif not path_clean.startswith('/public/'):
            # allow accessing files directly if they are requested relative to root, maps to public
            # But the user might be requesting /style.css which is in public/style.css
            # Let's just try to find it in public if not found
            # (must check the decoded path - filenames with spaces/special chars arrive URL-encoded)
            if os.path.exists(os.path.join("public", decoded_path.lstrip('/'))):
                self.path = "/public" + self.path
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"Server started at http://localhost:{PORT}")
print("Run 'python scripts/auto_email_rest.py' to test the emailer.")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    httpd.serve_forever()
