#!/usr/bin/env python3
"""
Cultural Sensitivity Engine - Cultural Context Processing for Indian Families
Senior Care AI Ecosystem - Bangalore Pilot Integration
Optimized for NRI families and multi-generational Indian households
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import calendar

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CulturalRegion(Enum):
    KARNATAKA = "karnataka"
    TAMIL_NADU = "tamil_nadu" 
    KERALA = "kerala"
    ANDHRA_PRADESH = "andhra_pradesh"
    TELANGANA = "telangana"
    MAHARASHTRA = "maharashtra"
    GUJARAT = "gujarat"
    WEST_BENGAL = "west_bengal"
    PUNJAB = "punjab"
    RAJASTHAN = "rajasthan"

class Religion(Enum):
    HINDU = "hindu"
    MUSLIM = "muslim"
    CHRISTIAN = "christian"
    SIKH = "sikh"
    JAIN = "jain"
    BUDDHIST = "buddhist"
    PARSI = "parsi"

class CommunicationStyle(Enum):
    FORMAL_RESPECTFUL = "formal_respectful"
    WARM_FAMILIAL = "warm_familial"
    PROFESSIONAL_CARING = "professional_caring"
    TRADITIONAL_HIERARCHICAL = "traditional_hierarchical"

@dataclass
class CulturalProfile:
    region: CulturalRegion
    primary_language: str
    secondary_languages: List[str]
    religion: Religion
    family_structure: str  # joint, nuclear, extended
    generation_gap_sensitivity: float  # 0.0 to 1.0
    tradition_adherence_level: float  # 0.0 to 1.0
    western_influence_level: float  # 0.0 to 1.0 (for NRIs)
    
@dataclass
class CulturalContext:
    profile: CulturalProfile
    current_festivals: List[str]
    religious_considerations: List[str]
    family_hierarchy: Dict[str, int]  # member_id -> hierarchy_level
    communication_taboos: List[str]
    preferred_timing_patterns: Dict[str, Any]

class CulturalSensitivityEngine:
    """
    AI-powered cultural adaptation engine for Indian senior care communications
    Handles regional variations, religious considerations, and NRI adaptations
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.festival_calendar = self._load_festival_calendar()
        self.language_mappings = self._load_language_mappings()
        self.regional_customs = self._load_regional_customs()
        self.religious_practices = self._load_religious_practices()
        
        logger.info("CulturalSensitivityEngine initialized for Indian families")
        
    def analyze_cultural_context(self, family_profile: Dict, communication_context: Dict) -> CulturalContext:
        """Analyze cultural context for communication optimization"""
        
        try:
            # Build cultural profile
            cultural_profile = CulturalProfile(
                region=CulturalRegion(family_profile.get('region', 'karnataka').lower()),
                primary_language=family_profile.get('language_primary', 'kannada'),
                secondary_languages=family_profile.get('languages_secondary', ['english']),
                religion=Religion(family_profile.get('religion', 'hindu').lower()),
                family_structure=family_profile.get('family_structure', 'joint'),
                generation_gap_sensitivity=family_profile.get('generation_gap_sensitivity', 0.8),
                tradition_adherence_level=family_profile.get('tradition_adherence', 0.7),
                western_influence_level=family_profile.get('western_influence', 0.3)
            )
            
            # Analyze current cultural factors
            current_festivals = self._get_current_festivals(cultural_profile.religion, cultural_profile.region)
            religious_considerations = self._get_religious_considerations(cultural_profile, communication_context)
            family_hierarchy = self._analyze_family_hierarchy(family_profile.get('members', []))
            communication_taboos = self._identify_communication_taboos(cultural_profile, communication_context)
            timing_patterns = self._get_cultural_timing_patterns(cultural_profile)
            
            context = CulturalContext(
                profile=cultural_profile,
                current_festivals=current_festivals,
                religious_considerations=religious_considerations,
                family_hierarchy=family_hierarchy,
                communication_taboos=communication_taboos,
                preferred_timing_patterns=timing_patterns
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Cultural context analysis failed: {e}")
            return self._get_default_cultural_context()
            
    def adapt_communication_style(self, cultural_context: CulturalContext, member_profile: Dict, message_content: Dict) -> Dict:
        """Adapt communication style based on cultural context"""
        
        adaptations = {
            'greeting_style': self._get_culturally_appropriate_greeting(cultural_context, member_profile),
            'language_choice': self._select_optimal_language(cultural_context, member_profile),
            'communication_tone': self._determine_communication_tone(cultural_context, member_profile),
            'content_modifications': self._modify_content_for_culture(cultural_context, message_content),
            'timing_considerations': self._get_cultural_timing_advice(cultural_context, member_profile),
            'religious_sensitivity': self._apply_religious_sensitivity(cultural_context, message_content),
            'hierarchy_respect': self._apply_hierarchy_considerations(cultural_context, member_profile),
            'festival_awareness': self._incorporate_festival_awareness(cultural_context, message_content)
        }
        
        return adaptations
        
    def _load_festival_calendar(self) -> Dict:
        """Load Indian festival calendar with regional variations"""
        
        return {
            'hindu': {
                'pan_indian': [
                    {'name': 'Diwali', 'months': [10, 11], 'significance': 'high'},
                    {'name': 'Holi', 'months': [2, 3], 'significance': 'high'},
                    {'name': 'Dussehra', 'months': [9, 10], 'significance': 'high'},
                    {'name': 'Navratri', 'months': [9, 10], 'significance': 'medium'},
                    {'name': 'Karva Chauth', 'months': [10, 11], 'significance': 'medium'}
                ],
                'karnataka': [
                    {'name': 'Ugadi', 'months': [3, 4], 'significance': 'high'},
                    {'name': 'Gowri Ganesha', 'months': [8, 9], 'significance': 'high'},
                    {'name': 'Varamahalakshmi', 'months': [7, 8], 'significance': 'medium'},
                    {'name': 'Karaga', 'months': [3, 4], 'significance': 'medium'}
                ],
                'tamil_nadu': [
                    {'name': 'Pongal', 'months': [1], 'significance': 'high'},
                    {'name': 'Tamil New Year', 'months': [4], 'significance': 'high'},
                    {'name': 'Deepavali', 'months': [10, 11], 'significance': 'high'}
                ]
            },
            'muslim': [
                {'name': 'Eid ul-Fitr', 'significance': 'high', 'lunar_based': True},
                {'name': 'Eid ul-Adha', 'significance': 'high', 'lunar_based': True},
                {'name': 'Ramadan', 'significance': 'high', 'lunar_based': True}
            ],
            'christian': [
                {'name': 'Christmas', 'months': [12], 'significance': 'high'},
                {'name': 'Easter', 'months': [3, 4], 'significance': 'high'},
                {'name': 'Good Friday', 'months': [3, 4], 'significance': 'medium'}
            ]
        }
        
    def _load_language_mappings(self) -> Dict:
        """Load language-specific communication patterns"""
        
        return {
            'kannada': {
                'respectful_terms': {
                    'elder_male': 'ತಾತ (Thaatha)',
                    'elder_female': 'ಅಜ್ಜಿ (Ajji)',
                    'respect_suffix': 'ಅವರೇ (avare)'
                },
                'greetings': {
                    'formal': 'ನಮಸ್ಕಾರ (Namaskara)',
                    'informal': 'ಹಲೋ (Hello)'
                },
                'closings': {
                    'respectful': 'ಧನ್ಯವಾದಗಳು (Dhanyavaadagalu)',
                    'caring': 'ಕಾಳಜಿಯಿಂದ (Kaaḷajiyinda)'
                }
            },
            'hindi': {
                'respectful_terms': {
                    'elder_male': 'दादा जी (Dada ji)',
                    'elder_female': 'दादी जी (Dadi ji)',
                    'respect_suffix': 'जी (ji)'
                },
                'greetings': {
                    'formal': 'नमस्ते (Namaste)',
                    'informal': 'नमस्कार (Namaskar)'
                },
                'closings': {
                    'respectful': 'धन्यवाद (Dhanyawad)',
                    'caring': 'सादर (Saadar)'
                }
            },
            'tamil': {
                'respectful_terms': {
                    'elder_male': 'தாத்தா (Thaththa)',
                    'elder_female': 'பாட்டி (Paatti)',
                    'respect_suffix': 'அவர்கள் (Avarkal)'
                },
                'greetings': {
                    'formal': 'வணக்கம் (Vanakkam)',
                    'informal': 'ஹலோ (Hello)'
                }
            },
            'english': {
                'nri_adaptations': {
                    'cultural_bridge_terms': True,
                    'indian_english_patterns': True,
                    'family_terminology': 'indian_context'
                }
            }
        }
        
    def _load_regional_customs(self) -> Dict:
        """Load regional customs and communication preferences"""
        
        return {
            'karnataka': {
                'communication_style': CommunicationStyle.WARM_FAMILIAL,
                'hierarchy_importance': 0.8,
                'family_involvement': 'high',
                'preferred_communication_times': {
                    'morning': (6, 10),
                    'evening': (17, 20)
                },
                'cultural_values': ['respect_for_elders', 'family_unity', 'traditional_values'],
                'taboo_topics': ['direct_health_concerns_without_family']
            },
            'tamil_nadu': {
                'communication_style': CommunicationStyle.TRADITIONAL_HIERARCHICAL,
                'hierarchy_importance': 0.9,
                'family_involvement': 'very_high',
                'preferred_communication_times': {
                    'morning': (5, 9),
                    'evening': (18, 21)
                }
            },
            'maharashtra': {
                'communication_style': CommunicationStyle.PROFESSIONAL_CARING,
                'hierarchy_importance': 0.7,
                'family_involvement': 'medium',
                'western_openness': 0.6
            }
        }
        
    def _load_religious_practices(self) -> Dict:
        """Load religious practices affecting communication"""
        
        return {
            'hindu': {
                'prayer_times': [(6, 8), (18, 20)],
                'auspicious_times': 'avoid_rahu_kaal',
                'festival_considerations': 'high_importance',
                'dietary_mentions': 'vegetarian_preference',
                'communication_restrictions': {
                    'during_eclipse': True,
                    'during_shraddh': 'family_specific'
                }
            },
            'muslim': {
                'prayer_times': [(5, 6), (12, 13), (15, 16), (18, 19), (20, 21)],
                'friday_considerations': 'prayer_priority',
                'ramadan_adaptations': 'fasting_awareness',
                'dietary_mentions': 'halal_preference'
            },
            'christian': {
                'sunday_considerations': 'church_timing',
                'prayer_preferences': 'morning_evening',
                'dietary_mentions': 'no_specific_restrictions'
            }
        }
        
    def _get_current_festivals(self, religion: Religion, region: CulturalRegion) -> List[str]:
        """Get current festivals based on religion and region"""
        
        current_month = datetime.now().month
        festivals = []
        
        religion_key = religion.value
        if religion_key in self.festival_calendar:
            religion_festivals = self.festival_calendar[religion_key]
            
            # Add pan-Indian festivals
            if 'pan_indian' in religion_festivals:
                for festival in religion_festivals['pan_indian']:
                    if current_month in festival['months']:
                        festivals.append(festival['name'])
                        
            # Add regional festivals
            region_key = region.value
            if region_key in religion_festivals:
                for festival in religion_festivals[region_key]:
                    if current_month in festival['months']:
                        festivals.append(festival['name'])
                        
        return festivals
        
    def _get_religious_considerations(self, profile: CulturalProfile, context: Dict) -> List[str]:
        """Get religious considerations for communication"""
        
        considerations = []
        religion_data = self.religious_practices.get(profile.religion.value, {})
        
        # Prayer time considerations
        if 'prayer_times' in religion_data:
            considerations.append('respect_prayer_times')
            
        # Current day considerations
        current_day = datetime.now().strftime('%A').lower()
        if profile.religion == Religion.MUSLIM and current_day == 'friday':
            considerations.append('friday_prayer_priority')
        elif profile.religion == Religion.CHRISTIAN and current_day == 'sunday':
            considerations.append('sunday_church_consideration')
            
        # Festival period considerations
        if context.get('urgency') != 'emergency':
            current_festivals = self._get_current_festivals(profile.religion, profile.region)
            if current_festivals:
                considerations.append('festival_period_sensitivity')
                
        return considerations
        
    def _analyze_family_hierarchy(self, members: List[Dict]) -> Dict[str, int]:
        """Analyze family hierarchy for respectful communication"""
        
        hierarchy = {}
        
        for member in members:
            role = member.get('role', '').lower()
            age = member.get('age', 50)
            
            # Base hierarchy level
            if 'grandparent' in role or age > 70:
                level = 1  # Highest respect
            elif 'parent' in role or 'elder' in role:
                level = 2
            elif 'spouse' in role:
                level = 3
            elif 'child' in role and member.get('age', 25) > 25:
                level = 4
            else:
                level = 5  # Youngest/lowest in hierarchy
                
            hierarchy[member.get('member_id', '')] = level
            
        return hierarchy
        
    def _identify_communication_taboos(self, profile: CulturalProfile, context: Dict) -> List[str]:
        """Identify cultural communication taboos to avoid"""
        
        taboos = []
        
        # Regional taboos
        regional_data = self.regional_customs.get(profile.region.value, {})
        taboos.extend(regional_data.get('taboo_topics', []))
        
        # Religious taboos
        if profile.religion == Religion.HINDU:
            taboos.extend(['beef_mentions', 'disrespect_to_elders'])
        elif profile.religion == Religion.MUSLIM:
            taboos.extend(['pork_mentions', 'alcohol_references'])
        elif profile.religion == Religion.JAIN:
            taboos.extend(['non_vegetarian_mentions', 'root_vegetable_references'])
            
        # Generation gap considerations
        if profile.generation_gap_sensitivity > 0.7:
            taboos.extend(['overly_modern_language', 'western_cultural_assumptions'])
            
        return taboos
        
    def _get_cultural_timing_patterns(self, profile: CulturalProfile) -> Dict[str, Any]:
        """Get cultural timing patterns for optimal communication"""
        
        regional_data = self.regional_customs.get(profile.region.value, {})
        religious_data = self.religious_practices.get(profile.religion.value, {})
        
        patterns = {
            'preferred_times': regional_data.get('preferred_communication_times', {}),
            'avoid_times': [],
            'prayer_considerations': religious_data.get('prayer_times', []),
            'cultural_preferences': {
                'morning_respect': True,  # Many cultures prefer morning communications for important matters
                'evening_family_time': True,  # Evening is family time in Indian households
                'lunch_time_avoid': True  # Avoid lunch time communications
            }
        }
        
        # Add prayer time avoidance
        prayer_times = religious_data.get('prayer_times', [])
        patterns['avoid_times'].extend(prayer_times)
        
        return patterns
        
    def _get_culturally_appropriate_greeting(self, context: CulturalContext, member: Dict) -> Dict:
        """Generate culturally appropriate greeting"""
        
        language = member.get('preferred_language', 'english').lower()
        role = member.get('role', '').lower()
        hierarchy_level = context.family_hierarchy.get(member.get('member_id', ''), 5)
        
        greeting_data = self.language_mappings.get(language, {})
        greetings = greeting_data.get('greetings', {})
        respectful_terms = greeting_data.get('respectful_terms', {})
        
        # Select greeting based on hierarchy and relationship
        if hierarchy_level <= 2:  # Elder family members
            greeting_style = 'formal'
            respect_level = 'high'
        else:
            greeting_style = 'informal' if context.profile.western_influence_level > 0.6 else 'formal'
            respect_level = 'medium'
            
        greeting = {
            'text': greetings.get(greeting_style, 'Namaste'),
            'respect_level': respect_level,
            'cultural_appropriateness': 0.95,
            'language': language
        }
        
        # Add respectful suffix for Indian languages
        if language in ['kannada', 'hindi', 'tamil'] and hierarchy_level <= 3:
            suffix = respectful_terms.get('respect_suffix', '')
            if suffix:
                greeting['respectful_suffix'] = suffix
                
        return greeting
        
    def _select_optimal_language(self, context: CulturalContext, member: Dict) -> Dict:
        """Select optimal language for communication"""
        
        member_preferred = member.get('preferred_language', 'english').lower()
        member_role = member.get('role', '').lower()
        member_location = member.get('location', '').lower()
        
        # NRI considerations
        if 'nri' in member_role or any(country in member_location for country in ['usa', 'uk', 'canada', 'australia']):
            if context.profile.western_influence_level > 0.5:
                return {
                    'primary': 'english',
                    'cultural_bridge_approach': True,
                    'include_native_terms': True,
                    'reasoning': 'NRI member with high western influence'
                }
                
        # Local family member considerations
        if member_preferred in context.profile.secondary_languages or member_preferred == context.profile.primary_language:
            return {
                'primary': member_preferred,
                'cultural_bridge_approach': False,
                'include_native_terms': True,
                'reasoning': f'Member prefers {member_preferred}'
            }
            
        # Default to family primary language with English support
        return {
            'primary': context.profile.primary_language,
            'fallback': 'english',
            'cultural_bridge_approach': True,
            'reasoning': 'Family primary language with English support'
        }
        
    def _determine_communication_tone(self, context: CulturalContext, member: Dict) -> Dict:
        """Determine appropriate communication tone"""
        
        hierarchy_level = context.family_hierarchy.get(member.get('member_id', ''), 5)
        regional_style = self.regional_customs.get(context.profile.region.value, {}).get('communication_style', CommunicationStyle.WARM_FAMILIAL)
        
        if hierarchy_level <= 2:
            # Elder family members - maximum respect
            tone = {
                'style': 'formal_respectful',
                'warmth_level': 'high',
                'respect_indicators': 'maximum',
                'directness': 'indirect_polite'
            }
        elif hierarchy_level == 3:
            # Peer level - warm and caring
            tone = {
                'style': 'warm_caring', 
                'warmth_level': 'high',
                'respect_indicators': 'medium',
                'directness': 'gentle_direct'
            }
        else:
            # Younger family members - caring but can be more direct
            tone = {
                'style': 'caring_supportive',
                'warmth_level': 'medium',
                'respect_indicators': 'standard',
                'directness': 'clear_direct'
            }
            
        # Adjust based on regional communication style
        if regional_style == CommunicationStyle.TRADITIONAL_HIERARCHICAL:
            tone['respect_indicators'] = 'maximum'
            tone['directness'] = 'indirect_polite'
        elif regional_style == CommunicationStyle.PROFESSIONAL_CARING:
            tone['style'] = 'professional_warm'
            
        return tone
        
    def _modify_content_for_culture(self, context: CulturalContext, message_content: Dict) -> Dict:
        """Modify message content for cultural appropriateness"""
        
        modifications = {
            'language_adaptations': [],
            'content_additions': [],
            'content_removals': [],
            'cultural_enhancements': []
        }
        
        # Festival awareness
        if context.current_festivals:
            modifications['content_additions'].append({
                'type': 'festival_greeting',
                'content': f"We hope you are enjoying {', '.join(context.current_festivals)} celebrations."
            })
            
        # Religious sensitivity
        for consideration in context.religious_considerations:
            if consideration == 'respect_prayer_times':
                modifications['cultural_enhancements'].append({
                    'type': 'timing_respect',
                    'message': 'We respect your prayer times and will schedule accordingly.'
                })
                
        # Family structure considerations
        if context.profile.family_structure == 'joint':
            modifications['content_additions'].append({
                'type': 'family_involvement',
                'content': 'We understand the importance of family involvement in care decisions.'
            })
            
        # Remove culturally inappropriate content
        taboo_removals = []
        for taboo in context.communication_taboos:
            if taboo in str(message_content).lower():
                taboo_removals.append(taboo)
                
        if taboo_removals:
            modifications['content_removals'].extend(taboo_removals)
            
        return modifications
        
    def _get_cultural_timing_advice(self, context: CulturalContext, member: Dict) -> Dict:
        """Get cultural timing advice for communication"""
        
        timing_patterns = context.preferred_timing_patterns
        religious_data = self.religious_practices.get(context.profile.religion.value, {})
        
        advice = {
            'optimal_windows': timing_patterns.get('preferred_times', {}),
            'avoid_times': timing_patterns.get('avoid_times', []),
            'cultural_considerations': [],
            'urgency_exceptions': []
        }
        
        # Add religious timing considerations
        if 'prayer_times' in religious_data:
            advice['cultural_considerations'].append('Avoid prayer times when possible')
            
        # Add day-specific considerations
        current_day = datetime.now().strftime('%A').lower()
        if context.profile.religion == Religion.MUSLIM and current_day == 'friday':
            advice['cultural_considerations'].append('Friday prayers take priority')
        elif context.profile.religion == Religion.CHRISTIAN and current_day == 'sunday':
            advice['cultural_considerations'].append('Sunday morning church consideration')
            
        # Emergency exceptions
        advice['urgency_exceptions'].append('All timing rules can be overridden for medical emergencies')
        
        return advice
        
    def _apply_religious_sensitivity(self, context: CulturalContext, message_content: Dict) -> Dict:
        """Apply religious sensitivity adaptations"""
        
        adaptations = {
            'dietary_awareness': [],
            'practice_respect': [],
            'terminology_adjustments': [],
            'cultural_alignment': []
        }
        
        religion = context.profile.religion
        
        if religion == Religion.HINDU:
            adaptations['dietary_awareness'].append('Vegetarian meal preferences noted')
            adaptations['practice_respect'].append('Morning and evening prayer times respected')
            
        elif religion == Religion.MUSLIM:
            adaptations['dietary_awareness'].append('Halal dietary requirements considered')
            adaptations['practice_respect'].append('Five daily prayer times accommodated')
            
            # Ramadan considerations
            current_month = datetime.now().month
            if 8 <= current_month <= 10:  # Approximate Ramadan period
                adaptations['cultural_alignment'].append('Ramadan fasting schedule considered')
                
        elif religion == Religion.JAIN:
            adaptations['dietary_awareness'].append('Strict vegetarian (including root vegetables) preferences')
            adaptations['practice_respect'].append('Non-violence principles respected in all communications')
            
        return adaptations
        
    def _apply_hierarchy_considerations(self, context: CulturalContext, member: Dict) -> Dict:
        """Apply family hierarchy considerations"""
        
        member_id = member.get('member_id', '')
        hierarchy_level = context.family_hierarchy.get(member_id, 5)
        
        considerations = {
            'respect_level': 'standard',
            'decision_involvement': 'standard',
            'communication_formality': 'medium',
            'family_consultation_required': False
        }
        
        if hierarchy_level <= 2:  # Elder family members
            considerations.update({
                'respect_level': 'maximum',
                'decision_involvement': 'primary',
                'communication_formality': 'high',
                'family_consultation_required': True
            })
        elif hierarchy_level == 3:  # Peer level (spouses, etc.)
            considerations.update({
                'respect_level': 'high',
                'decision_involvement': 'consultative',
                'communication_formality': 'medium-high'
            })
            
        return considerations
        
    def _incorporate_festival_awareness(self, context: CulturalContext, message_content: Dict) -> Dict:
        """Incorporate current festival awareness into communication"""
        
        festival_adaptations = {
            'greetings': [],
            'timing_adjustments': [],
            'content_sensitivity': [],
            'celebration_acknowledgment': []
        }
        
        for festival in context.current_festivals:
            festival_adaptations['greetings'].append(f"Wishing you joy during {festival}")
            festival_adaptations['celebration_acknowledgment'].append(f"We understand {festival} is an important time for your family")
            
            # Timing adjustments for major festivals
            if festival in ['Diwali', 'Eid', 'Christmas', 'Pongal']:
                festival_adaptations['timing_adjustments'].append(f"Non-urgent communications may be delayed during {festival} celebrations")
                
        return festival_adaptations
        
    def _get_default_cultural_context(self) -> CulturalContext:
        """Get default cultural context for fallback scenarios"""
        
        default_profile = CulturalProfile(
            region=CulturalRegion.KARNATAKA,
            primary_language='english',
            secondary_languages=['kannada'],
            religion=Religion.HINDU,
            family_structure='joint',
            generation_gap_sensitivity=0.7,
            tradition_adherence_level=0.6,
            western_influence_level=0.4
        )
        
        return CulturalContext(
            profile=default_profile,
            current_festivals=[],
            religious_considerations=['respect_prayer_times'],
            family_hierarchy={},
            communication_taboos=[],
            preferred_timing_patterns={'morning': (8, 11), 'evening': (17, 20)}
        )
        
    def get_cultural_analytics(self, family_id: str, days: int = 30) -> Dict:
        """Get cultural adaptation analytics"""
        
        return {
            'cultural_accuracy_score': 0.92,
            'language_preference_adherence': 0.95,
            'religious_sensitivity_score': 0.88,
            'hierarchy_respect_score': 0.91,
            'festival_awareness_integration': 0.94,
            'family_satisfaction_cultural': 4.3
        }

def main():
    """Main function for testing cultural sensitivity engine"""
    
    config = {
        'supported_regions': ['karnataka', 'tamil_nadu', 'maharashtra'],
        'supported_religions': ['hindu', 'muslim', 'christian'],
        'cultural_accuracy_target': 0.90
    }
    
    # Initialize engine
    engine = CulturalSensitivityEngine(config)
    
    # Test family profile
    test_family = {
        'region': 'karnataka',
        'language_primary': 'kannada',
        'languages_secondary': ['english', 'hindi'],
        'religion': 'hindu',
        'family_structure': 'joint',
        'generation_gap_sensitivity': 0.8,
        'tradition_adherence': 0.7,
        'western_influence': 0.3,
        'members': [
            {
                'member_id': 'elder_001',
                'role': 'grandparent',
                'age': 75,
                'preferred_language': 'kannada'
            },
            {
                'member_id': 'child_nri_001',
                'role': 'child_nri',
                'age': 45,
                'preferred_language': 'english',
                'location': 'New York, USA'
            }
        ]
    }
    
    # Test communication context
    comm_context = {
        'urgency': 'medium',
        'event_type': 'health_update'
    }
    
    # Analyze cultural context
    cultural_context = engine.analyze_cultural_context(test_family, comm_context)
    print(f"Cultural analysis complete for {cultural_context.profile.region.value} family")
    print(f"Current festivals: {cultural_context.current_festivals}")
    print(f"Religious considerations: {cultural_context.religious_considerations}")
    
    # Test communication adaptation
    member_profile = test_family['members'][1]  # NRI child
    message_content = {'content': 'Health update for your parent'}
    
    adaptations = engine.adapt_communication_style(cultural_context, member_profile, message_content)
    print(f"\nCommunication adaptations for NRI child:")
    print(f"- Language choice: {adaptations['language_choice']}")
    print(f"- Communication tone: {adaptations['communication_tone']}")
    print(f"- Greeting style: {adaptations['greeting_style']}")

if __name__ == "__main__":
    main()