import http.server
import socketserver
import json
import os
import mimetypes

PORT = 8000
DB_FILE = os.path.join("public", "db.json")

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API Endpoint: Get Database
        if self.path == '/api/db':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            try:
                with open(DB_FILE, 'r') as f:
                    self.wfile.write(f.read().encode())
            except FileNotFoundError:
                self.wfile.write(b'{"assignments": [], "todos": []}')
            return
        
        # Serve static files from 'public' directory
        if self.path == '/':
            self.path = '/public/index.html'
        elif not self.path.startswith('/public/'):
            # allow accessing files directly if they are requested relative to root, maps to public
            # But the user might be requesting /style.css which is in public/style.css
            # Let's just try to find it in public if not found
            if os.path.exists(os.path.join("public", self.path.lstrip('/'))):
                self.path = "/public" + self.path
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        # API Endpoint: Update Database
        if self.path == '/api/db':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                new_data = json.loads(post_data.decode())
                
                # Validation (basic)
                if 'assignments' not in new_data or 'todos' not in new_data:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'Invalid data structure')
                    return

                # Write to file
                with open(DB_FILE, 'w') as f:
                    json.dump(new_data, f, indent=4)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return

        self.send_response(404)
        self.end_headers()

print(f"Server started at http://localhost:{PORT}")
print("Run 'python auto_email.py' to test the emailer.")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    httpd.serve_forever()
