#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8003
DIRECTORY = "/Users/gokulnair/senior-care-startup/ai-ecosystem/ui-components/desktop"

os.chdir(DIRECTORY)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print(f"Directory: {DIRECTORY}")
    print(f"Available dashboards:")
    print(f"  - http://localhost:{PORT}/RESEARCH-ENHANCED-DASHBOARD.html")
    print(f"  - http://localhost:{PORT}/AnalyticsDashboard.html") 
    print(f"  - http://localhost:{PORT}/PremiumDashboard.html")
    httpd.serve_forever()
