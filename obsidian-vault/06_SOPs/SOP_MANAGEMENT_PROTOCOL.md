# SOP Management Protocol

**Version:** 1.0
**Objective:** To define the standards and procedures for creating, managing, and cross-referencing Standard Operating Procedures (SOPs) within the Senior Care AI Ecosystem.

---

## 1. SOP Structure and Metadata

Every SOP document (Markdown file) must adhere to the following structure and include the specified metadata at the top:

```markdown
# SOP: [SOP Title]

**Version:** [X.Y] (e.g., 1.0)
**Status:** [Draft | Active | Deprecated]
**Owner:** [Team or Agent Responsible]
**Objective:** [Concise statement of the SOP's purpose]

---

## [Section 1 Title]

[Content of Section 1]

---

## Cross-Referenced SOPs
*   [Checklist: Hospital Onboarding](/obsidian-vault/06_SOPs/HOSPITAL_ONBOARDING_CHECKLIST.md)
*   [Hospital Partnership Agreements - Bangalore Pilot](/Users/gokulnair/senior-care-startup/ai-ecosystem/operational-procedures/hospital-partnership-agreements-bangalore.md)
*   [SOP: Hospital Onboarding](/obsidian-vault/06_SOPs/HOSPITAL_ONBOARDING_SOP.md)



---

### Related Documents

*   [Link to External Document 1]
*   [Link to External Document 2]
```

## 2. Linking Conventions

To ensure consistency and maintainability, all cross-references between SOPs and to related documents must follow these conventions:

*   **Internal SOP Links:** Use relative Markdown links to other SOPs within the `obsidian-vault/06_SOPs/` directory. The link text should be the title of the SOP.
    *   **Example:** `*   [SOP: Hospital Onboarding](/obsidian-vault/06_SOPs/HOSPITAL_ONBOARDING_SOP.md)`

*   **Checklist Links:** Checklists derived from SOPs should be linked in the `Cross-Referenced SOPs` section of the parent SOP.
    *   **Example:** `*   [Checklist: Hospital Onboarding](/obsidian-vault/06_SOPs/HOSPITAL_ONBOARDING_CHECKLIST.md)`

*   **External Document Links:** For documents outside the `06_SOPs` directory (e.g., strategic documents, agreements), use absolute paths relative to the project root, or full URLs if external to the project.
    *   **Example:** `*   [Hospital Partnership Agreements - Bangalore Pilot](/Users/gokulnair/senior-care-startup/ai-ecosystem/operational-procedures/hospital-partnership-agreements-bangalore.md)`

## 3. SOP Lifecycle

*   **Draft:** Initial creation and review phase.
*   **Active:** Approved and in use. Requires regular review.
*   **Deprecated:** No longer in use, but kept for historical reference. Should be replaced by a newer version.

## 4. Version Control

All SOPs are subject to standard Git version control. Major changes should increment the minor version (e.g., 1.0 to 1.1), and significant structural or procedural changes should increment the major version (e.g., 1.x to 2.0).

---

**Owner:** Chief Orchestrator (Gemini)
**Last Updated:** 2025-08-07
