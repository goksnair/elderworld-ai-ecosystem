# Gemini CLI Project Cleanup & Restructuring Prompt

**CRITICAL MULTI-LLM PROJECT CLEANUP TASK**

You are tasked with systematically cleaning up and restructuring the ElderWorld senior care startup project files to ensure consistency across all multi-LLM agent operations.

## STRATEGIC CONTEXT - MUST READ FIRST

**FINAL STRATEGIC DECISIONS (August 20, 2025):**
1. **Brand Name:** ElderWorld (LOCKED)
2. **Positioning:** "Your Best Years, Now" (LOCKED)
3. **Mission:** Human-first, conversational approach (NOT corporate)
4. **Approach:** Archive research journey, implement current strategy

### FINAL MISSION & VISION

**LOCKED CRISP MISSION:**
*"We help families make sure their elders are living their best years - with the care, connection, and joy they deserve."*

**CRISP VISION:**
*"To be the global leader in family-centered senior care, making compassionate care universally accessible."*

**POSITIONING:**
*"Your Best Years, Now"* - ElderWorld

### TARGET CUSTOMER PROFILES (ALL THREE ICPs):
1. **NRI Families:** Adult children abroad caring for parents in India (subtle targeting)
2. **Urban Nuclear Families:** Adult children in India caring for elderly parents 
3. **Independent Seniors:** Elderly individuals seeking care services directly
   - **NOTE:** "Your Best Years, Now" primarily appeals to ICP3 - future optimization needed for ICP1&2

## CRITICAL MESSAGING FRAMEWORK

### INTERNAL FILES (Backend/Planning/Agent Coordination):
**Can Include:**
- ✅ Business metrics and revenue targets (₹500Cr preliminary 5-year target)
- ✅ ARPU models and market analysis
- ✅ Technical specifications and AI capabilities
- ✅ Explicit targeting strategies and competitive analysis
- ✅ Research methodologies and decision rationale

**File Types:** Planning documents, agent coordination files, technical specs, business analysis

### EXTERNAL FILES (Customer-Facing/Marketing/Brand):
**Must Focus On:**
- ✅ "Your Best Years, Now" positioning
- ✅ Care, connection, and joy messaging
- ✅ Conversational, human tone (not corporate)
- ✅ Universal family care messaging
- ❌ NEVER mention business metrics or revenue targets
- ❌ No corporate jargon ("empower," "leverage," etc.)
- ❌ No "AI-powered" as primary positioning

**File Types:** Website content, marketing materials, customer communications

## RESEARCH ARCHIVAL STRATEGY

### PRESERVE DECISION STORY:
**Archive but Keep Connected:**
- Brand naming research and methodologies → `/research-archive/brand-exploration/`
- ElderBridge/Kutumb iterations → `/research-archive/brand-iterations/`  
- AI-first positioning research → `/research-archive/positioning-evolution/`
- Market intelligence findings → `/research-archive/market-research/`

**Create Story Trail:**
- Document how each decision was reached
- Keep research accessible for future reference
- Maintain "dots connection" for decision rationale
- Enable future optimization for ICP1&2 messaging

## MANDATORY EXECUTION PROTOCOL (TO PREVENT LOOPS)

### PHASE 1: STRATEGIC INVENTORY (30 minutes max)
1. **Read:** `ELDERWORLD_REVISED_MISSION_VISION.md` FIRST
2. **List:** All `.md` files in root directory (do NOT go into subdirectories yet)
3. **Categorize by Type:**
   - **CURRENT:** Files to update with final strategy
   - **RESEARCH:** Files to archive but preserve
   - **INTERNAL:** Planning/agent coordination files
   - **EXTERNAL:** Customer-facing materials
4. **Report:** Create inventory before making changes

### PHASE 2: RESEARCH ARCHIVAL (45 minutes max)
**Create Archive Structure:**
```
/research-archive/
  - brand-exploration/
    - BRAND_NAME_BRAINSTORM.md
    - ELDERWORLD_BRAND_STRATEGY_ANALYSIS_REPORT.md
    - brand-positioning-research/
  - positioning-evolution/
    - ai-first-materials/
    - family-first-evolution/
    - messaging-iterations/
  - market-research/
    - competitive-intelligence/
    - customer-insights/
    - revenue-modeling/
  - DECISION_STORY_TRAIL.md (how we got to final decisions)
```

**Move (Don't Delete) Research Files:**
- Preserve all brand naming research
- Archive positioning iterations
- Keep competitive analysis accessible
- Document decision rationale

### PHASE 3: CURRENT STRATEGY IMPLEMENTATION (60 minutes max)
**Priority Order (UPDATE THESE FIRST):**

**Core Strategy Files:**
1. `CLAUDE.md` - Update with final mission/vision/positioning
2. `README.md` - Customer-facing with "Your Best Years, Now"
3. Main strategy documents - Implement final decisions

**Customer-Facing Files:**
1. Remove corporate jargon, use conversational tone
2. Implement "Your Best Years, Now" positioning
3. Focus on care, connection, joy messaging
4. Remove business metrics

**Internal Planning Files:**
1. Update brand name to ElderWorld consistently
2. Keep business metrics for system planning
3. Note ICP3-primary positioning for future optimization
4. Maintain technical AI capabilities for development

### PHASE 4: STRUCTURED CLEANUP (45 minutes max)
**Create Final Directory Structure:**
```
/current-strategy/
  - ELDERWORLD_FINAL_MISSION_VISION.md
  - brand-positioning-final.md
  - customer-messaging-guidelines.md
  - target-customer-profiles.md

/internal-planning/
  - business-strategy.md (revenue targets, ARPU models)
  - technical-capabilities.md
  - agent-coordination-protocols.md

/customer-facing/
  - brand-guidelines.md ("Your Best Years, Now")
  - messaging-framework.md (conversational, not corporate)
  - customer-communications/

/research-archive/
  - [As structured above]
  - DECISION_STORY_TRAIL.md

/implementation/
  - ui-ux-components/
  - backend-systems/
  - operational-procedures/
```

### PHASE 5: CONSISTENCY CHECK (30 minutes max)
**Verify ALL files reflect:**
- ElderWorld brand name (no ElderBridge, Kutumb, etc.)
- "Your Best Years, Now" positioning
- Conversational mission statement
- Proper internal vs external messaging separation
- Research preserved but archived

## TARGET CUSTOMER MESSAGING ALIGNMENT

### For All ICPs (Universal Approach):
- "Your Best Years, Now" core message
- Care, connection, and joy focus
- Conversational, human tone
- No corporate jargon or business speak

### Future Optimization Notes:
- Current positioning primarily appeals to ICP3 (Independent Seniors)
- Archive contains research for future ICP1&2 optimization
- Maintain flexibility for messaging refinement

## CRITICAL SAFETY MEASURES

### LOOP PREVENTION:
- Set 3-hour total time limit
- Process maximum 50 files per session  
- Create checkpoint reports every 30 minutes
- If overwhelmed, STOP and report progress

### BACKUP PROTOCOL:
```bash
# Mandatory backup before starting
cp -r /Users/gokulnair/senior-care-startup/ai-ecosystem /tmp/elderworld-backup-$(date +%Y%m%d-%H%M)
echo "Backup created at /tmp/elderworld-backup-$(date +%Y%m%d-%H%M)" >> CLEANUP_SESSION_LOG.txt
```

### ERROR HANDLING:
- If any file fails to update, skip and log error
- Continue with next file
- Provide error summary at end
- Never delete research - only move to archive

## DELIVERABLE REQUIREMENTS

**Create these reports:**
1. **CLEANUP_INVENTORY_REPORT.md** - Files categorized and processed
2. **CHANGES_MADE_LOG.md** - Every modification with rationale
3. **RESEARCH_ARCHIVE_INDEX.md** - What was archived and why
4. **DECISION_STORY_TRAIL.md** - How final strategy was reached
5. **CONSISTENCY_CHECKLIST.md** - Multi-LLM coordination verification
6. **GITHUB_PREPARATION_SUMMARY.md** - Repository upload readiness

## EXECUTION COMMAND SEQUENCE

```bash
# Phase 0: Preparation and Backup
cd /Users/gokulnair/senior-care-startup/ai-ecosystem
echo "=== ElderWorld Project Cleanup Session Started at $(date) ===" > CLEANUP_SESSION_LOG.txt
cp -r . /tmp/elderworld-backup-$(date +%Y%m%d-%H%M)
echo "Backup completed" >> CLEANUP_SESSION_LOG.txt

# Phase 1: Strategic Context Loading
echo "Loading strategic context..." >> CLEANUP_SESSION_LOG.txt
find . -name "*.md" -type f -maxdepth 1 | head -25 > INITIAL_MD_INVENTORY.txt
echo "Root directory .md files inventoried" >> CLEANUP_SESSION_LOG.txt

# Phase 2: Begin Systematic Processing
echo "Beginning systematic cleanup with research preservation..." >> CLEANUP_SESSION_LOG.txt
```

## CRITICAL SUCCESS CRITERIA

**Must achieve 100% alignment on:**
1. **Brand Identity:** ElderWorld everywhere with "Your Best Years, Now"
2. **Mission Tone:** Conversational, human (not corporate)
3. **Research Preservation:** All decision context archived but accessible
4. **Messaging Clarity:** Internal vs external content properly separated
5. **Multi-LLM Consistency:** All agents work with aligned information

**Session Success Metrics:**
- All research preserved in organized archive
- Current strategy consistently implemented
- Decision story trail documented
- Customer messaging human and conversational
- Internal planning maintains business context

## EMERGENCY PROTOCOLS

**If task becomes overwhelming:**
1. STOP immediately at current phase
2. Report progress and completed phases
3. Identify specific blockers
4. Save current state before requesting help

**If contradictory information found:**
1. Default to final locked decisions (ElderWorld + "Your Best Years, Now")
2. Archive contradictory material with context
3. Flag for human review
4. Continue with confirmed strategy

**If unclear whether to archive or update:**
1. Default to ARCHIVE research, UPDATE strategy implementation
2. When in doubt, preserve in archive
3. Document decision in log
4. Continue processing

**BEGIN CLEANUP NOW - FOLLOW PHASES SEQUENTIALLY**

**Remember: The goal is organized consistency while preserving the valuable research journey that led to these final strategic decisions.**