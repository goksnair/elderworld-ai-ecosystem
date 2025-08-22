import datetime
import zipfile
import os

project_root = "/Users/gokulnair/senior-care-startup/ai-ecosystem"
backup_filename = os.path.join(project_root, f"project_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.zip")

def zip_directory(path, zip_file):
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, os.path.dirname(project_root))
            zip_file.write(file_path, arcname)

with zipfile.ZipFile(backup_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zip_directory(project_root, zipf)

print(f"Project backup created at: {backup_filename}")