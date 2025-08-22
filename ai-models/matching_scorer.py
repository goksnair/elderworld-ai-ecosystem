import json

class MatchingScorer:
    def __init__(self):
        pass

    def score_skill_alignment(self, required_skills, agent_skills):
        if not required_skills:
            return 1.0 # Perfect score if no specific skills are required

        matched_skills = 0
        for skill in required_skills:
            if agent_skills.get(skill, False):
                matched_skills += 1
        
        return matched_skills / len(required_skills)

    def score_workload_balance(self, current_workload, max_workload=10):
        # Assuming max_workload is a predefined limit for an agent
        if current_workload >= max_workload:
            return 0.0 # Agent is overloaded
        
        return 1.0 - (current_workload / max_workload)

    def calculate_overall_score(self, skill_alignment_score, workload_balance_score, priority_factor=1.0):
        # Simple weighted average for now. Can be expanded with more factors.
        # Priority factor can be used to boost scores for high-priority tasks.
        return (skill_alignment_score * 0.6) + (workload_balance_score * 0.4) * priority_factor

if __name__ == '__main__':
    scorer = MatchingScorer()

    # Example 1: High skill match, low workload
    required_skills_1 = ['machine_learning', 'python']
    agent_skills_1 = {'python': True, 'machine_learning': True, 'data_analysis': True}
    agent_workload_1 = 2

    skill_score_1 = scorer.score_skill_alignment(required_skills_1, agent_skills_1)
    workload_score_1 = scorer.score_workload_balance(agent_workload_1)
    overall_score_1 = scorer.calculate_overall_score(skill_score_1, workload_score_1)
    print(f"\nExample 1 (High Match):\n  Skill Score: {skill_score_1:.2f}\n  Workload Score: {workload_score_1:.2f}\n  Overall Score: {overall_score_1:.2f}")

    # Example 2: Low skill match, high workload
    required_skills_2 = ['mobile_development', 'ui_ux']
    agent_skills_2 = {'python': True, 'machine_learning': True}
    agent_workload_2 = 8

    skill_score_2 = scorer.score_skill_alignment(required_skills_2, agent_skills_2)
    workload_score_2 = scorer.score_workload_balance(agent_workload_2)
    overall_score_2 = scorer.calculate_overall_score(skill_score_2, workload_score_2)
    print(f"\nExample 2 (Low Match):\n  Skill Score: {skill_score_2:.2f}\n  Workload Score: {workload_score_2:.2f}\n  Overall Score: {overall_score_2:.2f}")

    # Example 3: High priority task
    required_skills_3 = ['geriatric_care']
    agent_skills_3 = {'geriatric_care': True}
    agent_workload_3 = 1
    priority_factor = 1.5 # Boost for high priority

    skill_score_3 = scorer.score_skill_alignment(required_skills_3, agent_skills_3)
    workload_score_3 = scorer.score_workload_balance(agent_workload_3)
    overall_score_3 = scorer.calculate_overall_score(skill_score_3, workload_score_3, priority_factor)
    print(f"\nExample 3 (High Priority):\n  Skill Score: {skill_score_3:.2f}\n  Workload Score: {workload_score_3:.2f}\n  Overall Score: {overall_score_3:.2f}")
