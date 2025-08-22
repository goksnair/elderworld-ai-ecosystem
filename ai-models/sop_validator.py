import os
import re
import json

def validate_sop(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    errors = []
    warnings = []

    # 1. Check for required metadata (simplified)
    version_match = re.search(r'^\*\*Version:\*\* (\d+\.\d+)', content, re.MULTILINE)
    status_match = re.search(r'^\*\*Status:\*\* (Draft|Active|Deprecated)', content, re.MULTILINE)
    owner_match = re.search(r'^\*\*Owner:\*\* (.+)', content, re.MULTILINE)
    objective_match = re.search(r'^\*\*Objective:\*\* (.+)', content, re.MULTILINE)

    if not (version_match and status_match and owner_match and objective_match):
        errors.append("Missing or incorrectly formatted metadata (Version, Status, Owner, Objective).")

    # 2. Check for presence of sections
    if not re.search(r'## Cross-Referenced SOPs\n', content):
        warnings.append("'Cross-Referenced SOPs' section is missing.")
    if not re.search(r'### Related Documents\n', content):
        warnings.append("'Related Documents' section is missing.")

    # 3. Check for valid Markdown link syntax (basic check)
    links = re.findall(r'\[(.*?)\]\((.*?)\)', content)
    for text, url in links:
        if not url.strip():
            errors.append(f"Empty URL in link: [{text}]().")

    return {"filepath": filepath, "errors": errors, "warnings": warnings}

def run_sop_validation(sop_dir):
    validation_results = []
    for filename in os.listdir(sop_dir):
        if filename.endswith(".md"):
            filepath = os.path.join(sop_dir, filename)
            result = validate_sop(filepath)
            validation_results.append(result)
    return validation_results

if __name__ == "__main__":
    sop_directory = "/Users/gokulnair/senior-care-startup/ai-ecosystem/obsidian-vault/06_SOPs/" # Adjust if needed
    results = run_sop_validation(sop_directory)

    for result in results:
        print(f"\n--- Validation Report for {os.path.basename(result['filepath'])} ---")
        if not result["errors"] and not result["warnings"]:
            print("✅ PASSED: No issues found.")
        else:
            if result["errors"]:
                print("❌ ERRORS:")
                for error in result["errors"]:
                    print(f"  - {error}")
            if result["warnings"]:
                print("⚠️ WARNINGS:")
                for warning in result["warnings"]:
                    print(f"  - {warning}")
    print("\n--- Validation Complete ---")