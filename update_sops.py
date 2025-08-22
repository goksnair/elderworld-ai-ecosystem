
import os
import re

def update_sop_cross_references(sop_dir):
    for filename in os.listdir(sop_dir):
        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(sop_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find existing "Cross-Referenced SOPs" section
        cross_ref_section_start_match = re.search(r'## Cross-Referenced SOPs\n', content)
        related_docs_section_start_match = re.search(r'### Related Documents\n', content)

        new_cross_refs = []
        # Find all markdown links in the content
        links = re.findall(r'\[(.*?)\]\((.*?)\)', content)

        for text, link_path in links:
            # Only consider links that are relative and point within the project
            # or are absolute paths within the project
            if link_path.startswith('/') or link_path.startswith('.'):
                # Normalize path to be relative to project root for consistency
                # This is a simplified check; a more robust solution would resolve absolute paths
                if 'obsidian-vault/06_SOPs/' in link_path or 'operational-procedures/' in link_path:
                    new_cross_refs.append(f"*   [{text}]({link_path})")

        cross_ref_content_str = "\n".join(sorted(list(set(new_cross_refs)))) # Remove duplicates and sort

        updated_content = content

        if cross_ref_section_start_match: # Cross-Referenced SOPs section already exists
            # Find the end of the existing cross-ref list (before next header or end of file)
            end_of_cross_ref_list_match = re.search(r'\n\n(?!#)', content[cross_ref_section_start_match.end():])
            if end_of_cross_ref_list_match:
                end_idx = cross_ref_section_start_match.end() + end_of_cross_ref_list_match.start()
            else:
                end_idx = len(content) # If no next header, go to end of file

            updated_content = content[:cross_ref_section_start_match.end()] + \
                              f"{cross_ref_content_str}\n\n" + \
                              content[end_idx:]
        elif related_docs_section_start_match: # Related Documents exists, but Cross-Referenced does not
            # Insert Cross-Referenced SOPs section before Related Documents
            insert_idx = related_docs_section_start_match.start()
            updated_content = content[:insert_idx] + \
                              f"---\n\n## Cross-Referenced SOPs\n\n{cross_ref_content_str}\n\n" + \
                              content[insert_idx:]
        else: # Neither section exists, append both
            updated_content = content + \
                              f"\n\n---\n\n## Cross-Referenced SOPs\n\n{cross_ref_content_str}\n\n---\n\n### Related Documents\n\n"

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"Updated cross-references in {filename}")

# To run this script:
# 1. Save the code above as a Python file (e.g., update_sops.py)
# 2. Open your terminal in the project's root directory.
# 3. Run: python update_sops.py
#    (You might need to adjust the sop_dir path if your script is not in the root)

# Example usage (assuming script is in project root):
if __name__ == "__main__":
    update_sop_cross_references('obsidian-vault/06_SOPs/')
