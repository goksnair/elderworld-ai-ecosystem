"""
FAMILY-FRIENDLY AI EXPLANATIONS SYSTEM
Built by: ai-ml-chief agent
Bangalore Pilot - Senior Care AI System
Multi-language support: English, Hindi, Kannada
Focus: Making AI health insights accessible to Indian families
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Language(Enum):
    """Supported languages"""
    ENGLISH = "en"
    HINDI = "hi" 
    KANNADA = "kn"

class HealthStatus(Enum):
    """Health status levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    CONCERNING = "concerning"
    CRITICAL = "critical"

@dataclass
class ExplanationContext:
    """Context for generating explanations"""
    senior_name: str
    senior_age: int
    family_member_name: str
    relationship: str  # daughter, son, spouse, etc.
    preferred_language: Language
    technical_level: str  # basic, intermediate, advanced
    cultural_context: Dict[str, Any]

@dataclass
class HealthExplanation:
    """Complete health explanation for families"""
    senior_id: str
    explanation_id: str
    language: Language
    summary: str
    detailed_explanation: str
    key_insights: List[str]
    recommendations: List[Dict[str, str]]
    risk_factors: List[Dict[str, str]]
    protective_factors: List[str]
    visual_indicators: Dict[str, Any]
    cultural_notes: List[str]
    medical_disclaimer: str
    generated_at: str

class FamilyFriendlyExplanations:
    """
    AI explanation system designed for Indian families
    Converts complex medical AI insights into understandable, culturally-appropriate language
    """
    
    def __init__(self):
        self.translation_templates = {}
        self.cultural_adaptations = {}
        self.medical_terminology = {}
        self.visual_icons = {}
        
        # Initialize language templates
        self._initialize_translation_templates()
        
        # Initialize cultural adaptations
        self._initialize_cultural_adaptations()
        
        # Initialize medical terminology translations
        self._initialize_medical_terminology()
        
        # Initialize visual indicators
        self._initialize_visual_indicators()
        
        logger.info("🗣️ Family-Friendly Explanations System initialized")
    
    def _initialize_translation_templates(self):
        """Initialize templates for different languages"""
        
        self.translation_templates = {
            Language.ENGLISH: {
                "health_status": {
                    HealthStatus.EXCELLENT: "Your loved one's health is excellent",
                    HealthStatus.GOOD: "Your loved one's health is good", 
                    HealthStatus.FAIR: "Your loved one's health needs some attention",
                    HealthStatus.CONCERNING: "Your loved one's health requires careful monitoring",
                    HealthStatus.CRITICAL: "Your loved one needs immediate medical attention"
                },
                "summary_templates": {
                    "normal": "Based on today's health monitoring, {name} is doing well. All vital signs are within normal ranges.",
                    "attention_needed": "Our AI system has noticed some changes in {name}'s health that need attention.",
                    "concerning": "We are concerned about some changes in {name}'s health patterns and recommend consulting a doctor.",
                    "emergency": "This is urgent: {name} needs immediate medical attention."
                },
                "recommendations": {
                    "medication": "Please ensure {name} takes prescribed medications on time",
                    "activity": "Encourage gentle physical activity like walking or light exercises",
                    "hydration": "Make sure {name} drinks enough water throughout the day",
                    "rest": "Ensure {name} gets adequate rest and sleep",
                    "doctor": "Schedule an appointment with the family doctor",
                    "emergency": "Call emergency services or go to the nearest hospital immediately"
                }
            },
            
            Language.HINDI: {
                "health_status": {
                    HealthStatus.EXCELLENT: "आपके प्रियजन का स्वास्थ्य बहुत अच्छा है",
                    HealthStatus.GOOD: "आपके प्रियजन का स्वास्थ्य अच्छा है",
                    HealthStatus.FAIR: "आपके प्रियजन के स्वास्थ्य पर ध्यान देने की जरूरत है",
                    HealthStatus.CONCERNING: "आपके प्रियजन के स्वास्थ्य की सावधानीपूर्वक निगरानी की आवश्यकता है",
                    HealthStatus.CRITICAL: "आपके प्रियजन को तत्काल चिकित्सा सहायता की आवश्यकता है"
                },
                "summary_templates": {
                    "normal": "आज की स्वास्थ्य निगरानी के आधार पर, {name} ठीक हैं। सभी महत्वपूर्ण संकेतक सामान्य सीमा में हैं।",
                    "attention_needed": "हमारे AI सिस्टम ने {name} के स्वास्थ्य में कुछ बदलाव देखे हैं जिन पर ध्यान देने की जरूरत है।",
                    "concerning": "हम {name} के स्वास्थ्य के बारे में चिंतित हैं और डॉक्टर से सलाह लेने की सलाह देते हैं।",
                    "emergency": "यह जरूरी है: {name} को तत्काल चिकित्सा सहायता की आवश्यकता है।"
                },
                "recommendations": {
                    "medication": "कृपया सुनिश्चित करें कि {name} समय पर दवाएं लें",
                    "activity": "हल्की शारीरिक गतिविधि जैसे टहलना या हल्के व्यायाम को प्रोत्साहित करें",
                    "hydration": "सुनिश्चित करें कि {name} दिन भर पर्याप्त पानी पिएं",
                    "rest": "सुनिश्चित करें कि {name} को पर्याप्त आराम और नींद मिले",
                    "doctor": "पारिवारिक डॉक्टर के साथ अपॉइंटमेंट लें",
                    "emergency": "तुरंत आपातकालीन सेवाओं को कॉल करें या निकटतम अस्पताल जाएं"
                }
            },
            
            Language.KANNADA: {
                "health_status": {
                    HealthStatus.EXCELLENT: "ನಿಮ್ಮ ಪ್ರಿಯರ ಆರೋಗ್ಯ ಅತ್ಯುತ್ತಮವಾಗಿದೆ",
                    HealthStatus.GOOD: "ನಿಮ್ಮ ಪ್ರಿಯರ ಆರೋಗ್ಯ ಉತ್ತಮವಾಗಿದೆ",
                    HealthStatus.FAIR: "ನಿಮ್ಮ ಪ್ರಿಯರ ಆರೋಗ್ಯಕ್ಕೆ ಸ್ವಲ್ಪ ಗಮನ ಬೇಕು",
                    HealthStatus.CONCERNING: "ನಿಮ್ಮ ಪ್ರಿಯರ ಆರೋಗ್ಯವನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಗಮನಿಸಬೇಕು",
                    HealthStatus.CRITICAL: "ನಿಮ್ಮ ಪ್ರಿಯರಿಗೆ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಬೇಕು"
                },
                "summary_templates": {
                    "normal": "ಇಂದಿನ ಆರೋಗ್ಯ ಮೇಲ್ವಿಚಾರಣೆಯ ಆಧಾರದ ಮೇಲೆ, {name} ಚೆನ್ನಾಗಿದ್ದಾರೆ। ಎಲ್ಲಾ ಪ್ರಮುಖ ಸೂಚಕಗಳು ಸಾಮಾನ್ಯ ಮಿತಿಯಲ್ಲಿವೆ।",
                    "attention_needed": "ನಮ್ಮ AI ವ್ಯವಸ್ಥೆ {name} ರ ಆರೋಗ್ಯದಲ್ಲಿ ಕೆಲವು ಬದಲಾವಣೆಗಳನ್ನು ಗಮನಿಸಿದೆ.",
                    "concerning": "ನಾವು {name} ರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಚಿಂತಿತರಾಗಿದ್ದೇವೆ ಮತ್ತು ವೈದ್ಯರ ಸಲಹೆ ಪಡೆಯಲು ಸೂಚಿಸುತ್ತೇವೆ।",
                    "emergency": "ಇದು ತುರ್ತು: {name} ಗೆ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಬೇಕು।"
                },
                "recommendations": {
                    "medication": "ದಯವಿಟ್ಟು {name} ಸಮಯಕ್ಕೆ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದನ್ನು ಖಚಿತಪಡಿಸಿ",
                    "activity": "ನಡಿಗೆ ಅಥವಾ ಹಗುರ ವ್ಯಾಯಾಮದಂತಹ ಸೌಮ್ಯ ದೈಹಿಕ ಚಟುವಟಿಕೆಯನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿ",
                    "hydration": "{name} ದಿನವಿಡೀ ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯುವುದನ್ನು ಖಚಿತಪಡಿಸಿ",
                    "rest": "{name} ಗೆ ಸಾಕಷ್ಟು ವಿಶ್ರಾಂತಿ ಮತ್ತು ನಿದ್ರೆ ಸಿಗುವುದನ್ನು ಖಚಿತಪಡಿಸಿ",
                    "doctor": "ಕುಟುಂಬ ವೈದ್ಯರೊಂದಿಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಮಾಡಿ",
                    "emergency": "ತಕ್ಷಣ ತುರ್ತು ಸೇವೆಗಳಿಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ"
                }
            }
        }
        
        logger.info("✅ Translation templates initialized for 3 languages")
    
    def _initialize_cultural_adaptations(self):
        """Initialize cultural adaptations for Indian families"""
        
        self.cultural_adaptations = {
            "family_structure": {
                "joint_family": {
                    "address_style": "respectful_plural",
                    "decision_makers": ["eldest_son", "eldest_daughter_in_law", "spouse"],
                    "communication_style": "family_inclusive"
                },
                "nuclear_family": {
                    "address_style": "direct_personal",
                    "decision_makers": ["spouse", "children"],
                    "communication_style": "individual_focused"
                }
            },
            
            "religious_considerations": {
                "dietary_recommendations": {
                    "vegetarian": "सब्जी आधारित आहार / ತರಕಾರಿ ಆಧಾರಿತ ಆಹಾರ",
                    "non_vegetarian": "संतुलित आहार / ಸಮತೋಲಿತ ಆಹಾರ",
                    "jain": "जैन आहार सिद्धांत / ಜೈನ ಆಹಾರ ತತ್ವ",
                    "fasting_considerations": "व्रत के दौरान सावधानी / ಉಪವಾಸದ ಸಮಯದಲ್ಲಿ ಎಚ್ಚರಿಕೆ"
                },
                
                "prayer_timing_considerations": {
                    "morning_prayer": "सुबह की प्रार्थना के बाद दवा / ಬೆಳಗಿನ ಪ್ರಾರ್ಥನೆಯ ನಂತರ ಔಷಧಿ",
                    "evening_prayer": "शाम की प्रार्थना से पहले दवा / ಸಂಜೆಯ ಪ್ರಾರ್ಥನೆಯ ಮೊದಲು ಔಷಧಿ"
                }
            },
            
            "traditional_medicine": {
                "ayurveda_integration": "आयुर्वेदिक उपचार के साथ संयोजन / ಆಯುರ್ವೇದ ಚಿಕಿತ್ಸೆಯೊಂದಿಗೆ ಸಂಯೋಜನೆ",
                "home_remedies": "घरेलू उपचार / ಮನೆಯ ಚಿಕಿತ್ಸೆ",
                "herbs_spices": "जड़ी-बूटी और मसाले / ಗಿಡಮೂಲಿಕೆಗಳು ಮತ್ತು ಮಸಾಲೆಗಳು"
            },
            
            "communication_preferences": {
                "respectful_titles": {
                    "english": ["Uncle", "Aunty", "Grandpa", "Grandma"],
                    "hindi": ["अंकल", "आंटी", "दादाजी", "दादीजी", "नानाजी", "नानीजी"],
                    "kannada": ["ಅಜ್ಜ", "ಅಜ್ಜಿ", "ತಾತ", "ಅಜ್ಜಿ"]
                },
                
                "family_hierarchy": {
                    "eldest_first": "पहले बड़े सदस्यों को सूचित करें / ಮೊದಲು ಹಿರಿಯ ಸದಸ್ಯರಿಗೆ ತಿಳಿಸಿ",
                    "gender_considerations": "महिला सदस्यों की राय / ಮಹಿಳಾ ಸದಸ್ಯರ ಅಭಿಪ್ರಾಯ"
                }
            }
        }
        
        logger.info("✅ Cultural adaptations configured")
    
    def _initialize_medical_terminology(self):
        """Initialize medical terminology in local languages"""
        
        self.medical_terminology = {
            Language.ENGLISH: {
                "blood_pressure": "blood pressure",
                "heart_rate": "heart rate",
                "oxygen_levels": "oxygen levels",
                "blood_sugar": "blood sugar",
                "medication": "medication",
                "exercise": "exercise",
                "diet": "diet",
                "sleep": "sleep",
                "stress": "stress"
            },
            
            Language.HINDI: {
                "blood_pressure": "रक्तचाप / खून का दबाव",
                "heart_rate": "हृदय गति / दिल की धड़कन",
                "oxygen_levels": "ऑक्सीजन का स्तर / सांस में ऑक्सीजन",
                "blood_sugar": "रक्त शर्करा / खून में चीनी",
                "medication": "दवाई / औषधि",
                "exercise": "व्यायाम / कसरत",
                "diet": "आहार / खाना",
                "sleep": "नींद / आराम",
                "stress": "तनाव / चिंता"
            },
            
            Language.KANNADA: {
                "blood_pressure": "ರಕ್ತದ ಒತ್ತಡ",
                "heart_rate": "ಹೃದಯ ಬಡಿತ",
                "oxygen_levels": "ಆಮ್ಲಜನಕದ ಮಟ್ಟ",
                "blood_sugar": "ರಕ್ತದಲ್ಲಿನ ಸಕ್ಕರೆ",
                "medication": "ಔಷಧಿ",
                "exercise": "ವ್ಯಾಯಾಮ",
                "diet": "ಆಹಾರ",
                "sleep": "ನಿದ್ರೆ",
                "stress": "ಒತ್ತಡ"
            }
        }
        
        logger.info("✅ Medical terminology initialized")
    
    def _initialize_visual_indicators(self):
        """Initialize visual indicators and icons"""
        
        self.visual_indicators = {
            "health_status_colors": {
                HealthStatus.EXCELLENT: {"color": "#2E8B57", "icon": "🟢", "emoji": "😊"},
                HealthStatus.GOOD: {"color": "#32CD32", "icon": "🟢", "emoji": "🙂"},
                HealthStatus.FAIR: {"color": "#FFD700", "icon": "🟡", "emoji": "😐"},
                HealthStatus.CONCERNING: {"color": "#FF8C00", "icon": "🟠", "emoji": "😟"},
                HealthStatus.CRITICAL: {"color": "#DC143C", "icon": "🔴", "emoji": "😰"}
            },
            
            "vital_signs_icons": {
                "heart_rate": "💓",
                "blood_pressure": "🩸", 
                "oxygen_levels": "🫁",
                "temperature": "🌡️",
                "activity": "🚶‍♂️",
                "sleep": "😴",
                "medication": "💊"
            },
            
            "recommendation_icons": {
                "doctor": "👩‍⚕️",
                "medication": "💊",
                "exercise": "🚶‍♂️",
                "diet": "🥗",
                "hydration": "💧",
                "rest": "😴",
                "emergency": "🚨"
            },
            
            "trend_indicators": {
                "improving": "📈",
                "stable": "➡️",
                "declining": "📉",
                "fluctuating": "〰️"
            }
        }
        
        logger.info("✅ Visual indicators configured")
    
    def generate_explanation(self, 
                           health_data: Dict[str, Any], 
                           ml_prediction: Dict[str, Any], 
                           context: ExplanationContext) -> HealthExplanation:
        """
        Generate comprehensive, family-friendly health explanation
        """
        logger.info(f"🗣️ Generating explanation for {context.senior_name} in {context.preferred_language.value}")
        
        try:
            # Determine overall health status
            health_status = self._determine_health_status(health_data, ml_prediction)
            
            # Generate language-appropriate summary
            summary = self._generate_summary(health_data, health_status, context)
            
            # Generate detailed explanation
            detailed_explanation = self._generate_detailed_explanation(health_data, ml_prediction, context)
            
            # Extract key insights
            key_insights = self._extract_key_insights(health_data, ml_prediction, context)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(health_data, ml_prediction, context)
            
            # Identify risk factors
            risk_factors = self._identify_risk_factors(health_data, ml_prediction, context)
            
            # Identify protective factors
            protective_factors = self._identify_protective_factors(health_data, context)
            
            # Generate visual indicators
            visual_indicators = self._generate_visual_indicators(health_status, health_data)
            
            # Add cultural notes
            cultural_notes = self._generate_cultural_notes(health_data, context)
            
            # Generate medical disclaimer
            medical_disclaimer = self._generate_medical_disclaimer(context.preferred_language)
            
            explanation = HealthExplanation(
                senior_id=health_data.get('senior_id', 'unknown'),
                explanation_id=f"exp_{context.senior_name}_{int(datetime.now().timestamp())}",
                language=context.preferred_language,
                summary=summary,
                detailed_explanation=detailed_explanation,
                key_insights=key_insights,
                recommendations=recommendations,
                risk_factors=risk_factors,
                protective_factors=protective_factors,
                visual_indicators=visual_indicators,
                cultural_notes=cultural_notes,
                medical_disclaimer=medical_disclaimer,
                generated_at=datetime.now().isoformat()
            )
            
            logger.info(f"✅ Explanation generated successfully in {context.preferred_language.value}")
            return explanation
            
        except Exception as e:
            logger.error(f"❌ Explanation generation failed: {str(e)}")
            raise
    
    def _determine_health_status(self, health_data: Dict, ml_prediction: Dict) -> HealthStatus:
        """Determine overall health status from data and ML prediction"""
        
        # Check for critical indicators
        emergency_indicators = health_data.get('emergency_indicators', {})
        if any(emergency_indicators.values()):
            return HealthStatus.CRITICAL
        
        # Check ML prediction risk
        risk_score = ml_prediction.get('risk_score', 0)
        deterioration_prob = ml_prediction.get('deterioration_probability', 0)
        
        if risk_score >= 75 or deterioration_prob >= 0.8:
            return HealthStatus.CRITICAL
        elif risk_score >= 60 or deterioration_prob >= 0.6:
            return HealthStatus.CONCERNING
        elif risk_score >= 40 or deterioration_prob >= 0.4:
            return HealthStatus.FAIR
        elif risk_score >= 20 or deterioration_prob >= 0.2:
            return HealthStatus.GOOD
        else:
            return HealthStatus.EXCELLENT
    
    def _generate_summary(self, health_data: Dict, health_status: HealthStatus, context: ExplanationContext) -> str:
        """Generate language-appropriate summary"""
        
        templates = self.translation_templates[context.preferred_language]["summary_templates"]
        status_text = self.translation_templates[context.preferred_language]["health_status"][health_status]
        
        # Choose appropriate template based on health status
        if health_status == HealthStatus.CRITICAL:
            template_key = "emergency"
        elif health_status == HealthStatus.CONCERNING:
            template_key = "concerning"
        elif health_status in [HealthStatus.FAIR]:
            template_key = "attention_needed"
        else:
            template_key = "normal"
        
        # Format with senior's name
        senior_name = self._get_respectful_name(context.senior_name, context)
        summary = templates[template_key].format(name=senior_name)
        
        return f"{status_text}. {summary}"
    
    def _generate_detailed_explanation(self, health_data: Dict, ml_prediction: Dict, context: ExplanationContext) -> str:
        """Generate detailed explanation of health status"""
        
        lang = context.preferred_language
        explanations = []
        
        # Vital signs explanation
        vital_signs = health_data.get('vital_signs', {})
        if vital_signs:
            vital_explanation = self._explain_vital_signs(vital_signs, lang)
            explanations.append(vital_explanation)
        
        # Activity explanation
        activity_metrics = health_data.get('activity_metrics', {})
        if activity_metrics:
            activity_explanation = self._explain_activity_metrics(activity_metrics, lang)
            explanations.append(activity_explanation)
        
        # Medication compliance
        medication_compliance = health_data.get('medication_compliance', {})
        if medication_compliance:
            med_explanation = self._explain_medication_compliance(medication_compliance, lang)
            explanations.append(med_explanation)
        
        # ML prediction explanation
        if ml_prediction:
            ml_explanation = self._explain_ml_prediction(ml_prediction, lang, context)
            explanations.append(ml_explanation)
        
        return "\n\n".join(explanations)
    
    def _explain_vital_signs(self, vital_signs: Dict, language: Language) -> str:
        """Explain vital signs in chosen language"""
        
        explanations = []
        terminology = self.medical_terminology[language]
        
        if language == Language.ENGLISH:
            if 'heart_rate' in vital_signs:
                hr = vital_signs['heart_rate']
                if 60 <= hr <= 100:
                    explanations.append(f"💓 Heart rate is {hr} beats per minute - this is normal.")
                elif hr < 60:
                    explanations.append(f"💓 Heart rate is {hr} beats per minute - this is slower than normal.")
                else:
                    explanations.append(f"💓 Heart rate is {hr} beats per minute - this is faster than normal.")
            
            if 'systolic_bp' in vital_signs and 'diastolic_bp' in vital_signs:
                sys_bp = vital_signs['systolic_bp']
                dia_bp = vital_signs['diastolic_bp']
                if sys_bp < 120 and dia_bp < 80:
                    explanations.append(f"🩸 Blood pressure is {sys_bp}/{dia_bp} - this is excellent.")
                elif sys_bp < 140 and dia_bp < 90:
                    explanations.append(f"🩸 Blood pressure is {sys_bp}/{dia_bp} - this is in the normal range.")
                else:
                    explanations.append(f"🩸 Blood pressure is {sys_bp}/{dia_bp} - this is higher than ideal.")
            
            if 'oxygen_saturation' in vital_signs:
                spo2 = vital_signs['oxygen_saturation']
                if spo2 >= 95:
                    explanations.append(f"🫁 Oxygen levels are {spo2}% - this is good.")
                else:
                    explanations.append(f"🫁 Oxygen levels are {spo2}% - this needs attention.")
        
        elif language == Language.HINDI:
            if 'heart_rate' in vital_signs:
                hr = vital_signs['heart_rate']
                if 60 <= hr <= 100:
                    explanations.append(f"💓 दिल की धड़कन {hr} प्रति मिनट है - यह सामान्य है।")
                elif hr < 60:
                    explanations.append(f"💓 दिल की धड़कन {hr} प्रति मिनट है - यह सामान्य से धीमी है।")
                else:
                    explanations.append(f"💓 दिल की धड़कन {hr} प्रति मिनट है - यह सामान्य से तेज है।")
            
            if 'systolic_bp' in vital_signs and 'diastolic_bp' in vital_signs:
                sys_bp = vital_signs['systolic_bp']
                dia_bp = vital_signs['diastolic_bp']
                if sys_bp < 120 and dia_bp < 80:
                    explanations.append(f"🩸 रक्तचाप {sys_bp}/{dia_bp} है - यह बहुत अच्छा है।")
                elif sys_bp < 140 and dia_bp < 90:
                    explanations.append(f"🩸 रक्तचाप {sys_bp}/{dia_bp} है - यह सामान्य सीमा में है।")
                else:
                    explanations.append(f"🩸 रक्तचाप {sys_bp}/{dia_bp} है - यह आदर्श से अधिक है।")
        
        elif language == Language.KANNADA:
            if 'heart_rate' in vital_signs:
                hr = vital_signs['heart_rate']
                if 60 <= hr <= 100:
                    explanations.append(f"💓 ಹೃದಯ ಬಡಿತ {hr} ಪ್ರತಿ ನಿಮಿಷಕ್ಕೆ - ಇದು ಸಾಮಾನ್ಯವಾಗಿದೆ।")
                elif hr < 60:
                    explanations.append(f"💓 ಹೃದಯ ಬಡಿತ {hr} ಪ್ರತಿ ನಿಮಿಷಕ್ಕೆ - ಇದು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ನಿಧಾನವಾಗಿದೆ।")
                else:
                    explanations.append(f"💓 ಹೃದಯ ಬಡಿತ {hr} ಪ್ರತಿ ನಿಮಿಷಕ್ಕೆ - ಇದು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ವೇಗವಾಗಿದೆ।")
        
        return " ".join(explanations)
    
    def _explain_activity_metrics(self, activity_metrics: Dict, language: Language) -> str:
        """Explain activity metrics"""
        
        if language == Language.ENGLISH:
            explanations = []
            if 'daily_steps' in activity_metrics:
                steps = activity_metrics['daily_steps']
                if steps >= 3000:
                    explanations.append(f"🚶‍♂️ Daily steps: {steps} - Great activity level!")
                elif steps >= 1500:
                    explanations.append(f"🚶‍♂️ Daily steps: {steps} - Moderate activity.")
                else:
                    explanations.append(f"🚶‍♂️ Daily steps: {steps} - Consider more walking.")
            
            if 'sleep_hours' in activity_metrics:
                sleep = activity_metrics['sleep_hours']
                if 6 <= sleep <= 9:
                    explanations.append(f"😴 Sleep: {sleep} hours - Good rest.")
                else:
                    explanations.append(f"😴 Sleep: {sleep} hours - Could be improved.")
            
            return " ".join(explanations)
        
        elif language == Language.HINDI:
            explanations = []
            if 'daily_steps' in activity_metrics:
                steps = activity_metrics['daily_steps']
                if steps >= 3000:
                    explanations.append(f"🚶‍♂️ दैनिक कदम: {steps} - बहुत अच्छी गतिविधि!")
                elif steps >= 1500:
                    explanations.append(f"🚶‍♂️ दैनिक कदम: {steps} - मध्यम गतिविधि।")
                else:
                    explanations.append(f"🚶‍♂️ दैनिक कदम: {steps} - अधिक चलने पर विचार करें।")
            
            return " ".join(explanations)
        
        elif language == Language.KANNADA:
            explanations = []
            if 'daily_steps' in activity_metrics:
                steps = activity_metrics['daily_steps']
                if steps >= 3000:
                    explanations.append(f"🚶‍♂️ ದೈನಂದಿನ ಹೆಜ್ಜೆಗಳು: {steps} - ಉತ್ತಮ ಚಟುವಟಿಕೆ ಮಟ್ಟ!")
                elif steps >= 1500:
                    explanations.append(f"🚶‍♂️ ದೈನಂದಿನ ಹೆಜ್ಜೆಗಳು: {steps} - ಮಧ್ಯಮ ಚಟುವಟಿಕೆ।")
                else:
                    explanations.append(f"🚶‍♂️ ದೈನಂದಿನ ಹೆಜ್ಜೆಗಳು: {steps} - ಹೆಚ್ಚು ನಡೆಯುವುದನ್ನು ಪರಿಗಣಿಸಿ।")
            
            return " ".join(explanations)
        
        return ""
    
    def _explain_medication_compliance(self, medication_compliance: Dict, language: Language) -> str:
        """Explain medication compliance"""
        
        adherence = medication_compliance.get('overall_adherence', 1.0)
        
        if language == Language.ENGLISH:
            if adherence >= 0.9:
                return f"💊 Medication adherence: Excellent ({adherence:.0%})"
            elif adherence >= 0.8:
                return f"💊 Medication adherence: Good ({adherence:.0%})"
            else:
                return f"💊 Medication adherence: Needs improvement ({adherence:.0%})"
        
        elif language == Language.HINDI:
            if adherence >= 0.9:
                return f"💊 दवा का पालन: उत्कृष्ट ({adherence:.0%})"
            elif adherence >= 0.8:
                return f"💊 दवा का पालन: अच्छा ({adherence:.0%})"
            else:
                return f"💊 दवा का पालन: सुधार की आवश्यकता ({adherence:.0%})"
        
        elif language == Language.KANNADA:
            if adherence >= 0.9:
                return f"💊 ಔಷಧಿ ಪಾಲನೆ: ಅತ್ಯುತ್ತಮ ({adherence:.0%})"
            elif adherence >= 0.8:
                return f"💊 ಔಷಧಿ ಪಾಲನೆ: ಒಳ್ಳೆಯದು ({adherence:.0%})"
            else:
                return f"💊 ಔಷಧಿ ಪಾಲನೆ: ಸುಧಾರಣೆ ಅಗತ್ಯ ({adherence:.0%})"
        
        return ""
    
    def _explain_ml_prediction(self, ml_prediction: Dict, language: Language, context: ExplanationContext) -> str:
        """Explain ML prediction in simple terms"""
        
        risk_score = ml_prediction.get('risk_score', 0)
        confidence = ml_prediction.get('confidence', 0) * 100
        
        if language == Language.ENGLISH:
            if risk_score < 25:
                return f"🤖 Our AI analysis shows low health risk with {confidence:.0f}% confidence. Continue current care routine."
            elif risk_score < 50:
                return f"🤖 Our AI analysis shows moderate health risk with {confidence:.0f}% confidence. Consider increased monitoring."
            else:
                return f"🤖 Our AI analysis shows elevated health risk with {confidence:.0f}% confidence. Medical consultation recommended."
        
        elif language == Language.HINDI:
            if risk_score < 25:
                return f"🤖 हमारा AI विश्लेषण {confidence:.0f}% विश्वास के साथ कम स्वास्थ्य जोखिम दिखाता है। वर्तमान देखभाल जारी रखें।"
            elif risk_score < 50:
                return f"🤖 हमारा AI विश्लेषण {confidence:.0f}% विश्वास के साथ मध्यम स्वास्थ्य जोखिम दिखाता है। बढ़ी हुई निगरानी पर विचार करें।"
            else:
                return f"🤖 हमारा AI विश्लेषण {confidence:.0f}% विश्वास के साथ उच्च स्वास्थ्य जोखिम दिखाता है। चिकित्सा सलाह की सिफारिश की जाती है।"
        
        elif language == Language.KANNADA:
            if risk_score < 25:
                return f"🤖 ನಮ್ಮ AI ವಿಶ್ಲೇಷಣೆ {confidence:.0f}% ವಿಶ್ವಾಸದೊಂದಿಗೆ ಕಡಿಮೆ ಆರೋಗ್ಯ ಅಪಾಯವನ್ನು ತೋರಿಸುತ್ತದೆ। ಪ್ರಸ್ತುತ ಆರೈಕೆ ಮುಂದುವರಿಸಿ।"
            elif risk_score < 50:
                return f"🤖 ನಮ್ಮ AI ವಿಶ್ಲೇಷಣೆ {confidence:.0f}% ವಿಶ್ವಾಸದೊಂದಿಗೆ ಮಧ್ಯಮ ಆರೋಗ್ಯ ಅಪಾಯವನ್ನು ತೋರಿಸುತ್ತದೆ। ಹೆಚ್ಚಿನ ಮೇಲ್ವಿಚಾರಣೆಯನ್ನು ಪರಿಗಣಿಸಿ।"
            else:
                return f"🤖 ನಮ್ಮ AI ವಿಶ್ಲೇಷಣೆ {confidence:.0f}% ವಿಶ್ವಾಸದೊಂದಿಗೆ ಹೆಚ್ಚಿನ ಆರೋಗ್ಯ ಅಪಾಯವನ್ನು ತೋರಿಸುತ್ತದೆ। ವೈದ್ಯಕೀಯ ಸಲಹೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ।"
        
        return ""
    
    def _extract_key_insights(self, health_data: Dict, ml_prediction: Dict, context: ExplanationContext) -> List[str]:
        """Extract key insights for families"""
        
        insights = []
        lang = context.preferred_language
        
        # Vital signs insights
        vital_signs = health_data.get('vital_signs', {})
        if 'heart_rate' in vital_signs:
            hr = vital_signs['heart_rate']
            if lang == Language.ENGLISH:
                if hr < 60:
                    insights.append("Heart rate is slower than normal - may need monitoring")
                elif hr > 100:
                    insights.append("Heart rate is faster than normal - check for causes")
            elif lang == Language.HINDI:
                if hr < 60:
                    insights.append("दिल की धड़कन सामान्य से धीमी है - निगरानी की आवश्यकता हो सकती है")
                elif hr > 100:
                    insights.append("दिल की धड़कन सामान्य से तेज है - कारणों की जांच करें")
        
        # Activity insights
        activity_metrics = health_data.get('activity_metrics', {})
        if 'daily_steps' in activity_metrics:
            steps = activity_metrics['daily_steps']
            if steps < 1500:
                if lang == Language.ENGLISH:
                    insights.append("Low daily activity - encourage gentle movement")
                elif lang == Language.HINDI:
                    insights.append("दैनिक गतिविधि कम है - हल्की गतिविधि को प्रोत्साहित करें")
                elif lang == Language.KANNADA:
                    insights.append("ದೈನಂದಿನ ಚಟುವಟಿಕೆ ಕಡಿಮೆ - ಸೌಮ್ಯ ಚಲನೆಯನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿ")
        
        # Medication insights
        medication_compliance = health_data.get('medication_compliance', {})
        if medication_compliance.get('overall_adherence', 1.0) < 0.8:
            if lang == Language.ENGLISH:
                insights.append("Medication adherence could be improved")
            elif lang == Language.HINDI:
                insights.append("दवा का पालन बेहतर हो सकता है")
            elif lang == Language.KANNADA:
                insights.append("ಔಷಧಿ ಪಾಲನೆ ಸುಧಾರಿಸಬಹುದು")
        
        return insights
    
    def _generate_recommendations(self, health_data: Dict, ml_prediction: Dict, context: ExplanationContext) -> List[Dict[str, str]]:
        """Generate actionable recommendations"""
        
        recommendations = []
        lang = context.preferred_language
        templates = self.translation_templates[lang]["recommendations"]
        
        # Risk-based recommendations
        risk_score = ml_prediction.get('risk_score', 0)
        
        if risk_score >= 75:
            recommendations.append({
                "priority": "HIGH",
                "action": templates["emergency"],
                "timeline": "Immediate" if lang == Language.ENGLISH else "तुरंत" if lang == Language.HINDI else "ತಕ್ಷಣ",
                "icon": "🚨"
            })
        elif risk_score >= 50:
            recommendations.append({
                "priority": "MEDIUM", 
                "action": templates["doctor"],
                "timeline": "Within 24 hours" if lang == Language.ENGLISH else "24 घंटे के भीतर" if lang == Language.HINDI else "24 ಗಂಟೆಗಳಲ್ಲಿ",
                "icon": "👩‍⚕️"
            })
        
        # Activity-based recommendations
        activity_metrics = health_data.get('activity_metrics', {})
        if activity_metrics.get('daily_steps', 0) < 2000:
            recommendations.append({
                "priority": "LOW",
                "action": templates["activity"],
                "timeline": "Daily" if lang == Language.ENGLISH else "दैनिक" if lang == Language.HINDI else "ದೈನಂದಿನ",
                "icon": "🚶‍♂️"
            })
        
        # Medication recommendations
        medication_compliance = health_data.get('medication_compliance', {})
        if medication_compliance.get('overall_adherence', 1.0) < 0.8:
            recommendations.append({
                "priority": "MEDIUM",
                "action": templates["medication"].format(name=context.senior_name),
                "timeline": "Today" if lang == Language.ENGLISH else "आज" if lang == Language.HINDI else "ಇಂದು",
                "icon": "💊"
            })
        
        return recommendations
    
    def _identify_risk_factors(self, health_data: Dict, ml_prediction: Dict, context: ExplanationContext) -> List[Dict[str, str]]:
        """Identify current risk factors"""
        
        risk_factors = []
        lang = context.preferred_language
        
        # Vital signs risks
        vital_signs = health_data.get('vital_signs', {})
        
        if 'systolic_bp' in vital_signs:
            sbp = vital_signs['systolic_bp']
            if sbp > 140:
                risk_factors.append({
                    "factor": "High Blood Pressure" if lang == Language.ENGLISH else "उच्च रक्तचाप" if lang == Language.HINDI else "ಅಧಿಕ ರಕ್ತದ ಒತ್ತಡ",
                    "severity": "Moderate" if lang == Language.ENGLISH else "मध्यम" if lang == Language.HINDI else "ಮಧ್ಯಮ",
                    "description": f"Blood pressure {sbp} is above normal range" if lang == Language.ENGLISH else f"रक्तचाप {sbp} सामान्य सीमा से अधिक है" if lang == Language.HINDI else f"ರಕ್ತದ ಒತ್ತಡ {sbp} ಸಾಮಾನ್ಯ ಮಿತಿಯಿಂದ ಅಧಿಕವಾಗಿದೆ"
                })
        
        if 'oxygen_saturation' in vital_signs:
            spo2 = vital_signs['oxygen_saturation']
            if spo2 < 95:
                risk_factors.append({
                    "factor": "Low Oxygen Levels" if lang == Language.ENGLISH else "कम ऑक्सीजन स्तर" if lang == Language.HINDI else "ಕಡಿಮೆ ಆಮ್ಲಜನಕ ಮಟ್ಟ",
                    "severity": "High" if lang == Language.ENGLISH else "उच्च" if lang == Language.HINDI else "ಹೆಚ್ಚು",
                    "description": f"Oxygen level {spo2}% is below normal" if lang == Language.ENGLISH else f"ऑक्सीजन स्तर {spo2}% सामान्य से कम है" if lang == Language.HINDI else f"ಆಮ್ಲಜನಕ ಮಟ್ಟ {spo2}% ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗಿದೆ"
                })
        
        # Activity risks
        activity_metrics = health_data.get('activity_metrics', {})
        if activity_metrics.get('daily_steps', 0) < 1500:
            risk_factors.append({
                "factor": "Low Physical Activity" if lang == Language.ENGLISH else "कम शारीरिक गतिविधि" if lang == Language.HINDI else "ಕಡಿಮೆ ದೈಹಿಕ ಚಟುವಟಿಕೆ",
                "severity": "Low" if lang == Language.ENGLISH else "कम" if lang == Language.HINDI else "ಕಡಿಮೆ",
                "description": "Sedentary lifestyle increases health risks" if lang == Language.ENGLISH else "गतिहीन जीवनशैली स्वास्थ्य जोखिम बढ़ाती है" if lang == Language.HINDI else "ಕುಳಿತುಕೊಳ್ಳುವ ಜೀವನಶೈಲಿ ಆರೋಗ್ಯ ಅಪಾಯಗಳನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ"
            })
        
        return risk_factors
    
    def _identify_protective_factors(self, health_data: Dict, context: ExplanationContext) -> List[str]:
        """Identify protective factors"""
        
        protective_factors = []
        lang = context.preferred_language
        
        # Good medication adherence
        medication_compliance = health_data.get('medication_compliance', {})
        if medication_compliance.get('overall_adherence', 1.0) >= 0.9:
            if lang == Language.ENGLISH:
                protective_factors.append("Excellent medication adherence")
            elif lang == Language.HINDI:
                protective_factors.append("उत्कृष्ट दवा पालन")
            elif lang == Language.KANNADA:
                protective_factors.append("ಅತ್ಯುತ್ತಮ ಔಷಧಿ ಪಾಲನೆ")
        
        # Good activity level
        activity_metrics = health_data.get('activity_metrics', {})
        if activity_metrics.get('daily_steps', 0) >= 3000:
            if lang == Language.ENGLISH:
                protective_factors.append("Good daily physical activity")
            elif lang == Language.HINDI:
                protective_factors.append("अच्छी दैनिक शारीरिक गतिविधि")
            elif lang == Language.KANNADA:
                protective_factors.append("ಉತ್ತಮ ದೈನಂದಿನ ದೈಹಿಕ ಚಟುವಟಿಕೆ")
        
        # Normal vital signs
        vital_signs = health_data.get('vital_signs', {})
        if 'heart_rate' in vital_signs:
            hr = vital_signs['heart_rate']
            if 60 <= hr <= 100:
                if lang == Language.ENGLISH:
                    protective_factors.append("Normal heart rate")
                elif lang == Language.HINDI:
                    protective_factors.append("सामान्य हृदय गति")
                elif lang == Language.KANNADA:
                    protective_factors.append("ಸಾಮಾನ್ಯ ಹೃದಯ ಬಡಿತ")
        
        # Family support (cultural factor)
        if context.cultural_context.get('family_support', False):
            if lang == Language.ENGLISH:
                protective_factors.append("Strong family support system")
            elif lang == Language.HINDI:
                protective_factors.append("मजबूत पारिवारिक सहायता प्रणाली")
            elif lang == Language.KANNADA:
                protective_factors.append("ಬಲವಾದ ಕುಟುಂಬ ಬೆಂಬಲ ವ್ಯವಸ್ಥೆ")
        
        return protective_factors
    
    def _generate_visual_indicators(self, health_status: HealthStatus, health_data: Dict) -> Dict[str, Any]:
        """Generate visual indicators for the explanation"""
        
        status_visual = self.visual_indicators["health_status_colors"][health_status]
        
        visual_data = {
            "overall_status": {
                "color": status_visual["color"],
                "icon": status_visual["icon"],
                "emoji": status_visual["emoji"]
            },
            "vital_signs": {},
            "trends": {}
        }
        
        # Vital signs visuals
        vital_signs = health_data.get('vital_signs', {})
        for vital, value in vital_signs.items():
            if vital in self.visual_indicators["vital_signs_icons"]:
                visual_data["vital_signs"][vital] = {
                    "icon": self.visual_indicators["vital_signs_icons"][vital],
                    "value": value,
                    "color": self._get_vital_color(vital, value)
                }
        
        return visual_data
    
    def _get_vital_color(self, vital: str, value: float) -> str:
        """Get color coding for vital signs"""
        
        if vital == 'heart_rate':
            if 60 <= value <= 100:
                return "#2E8B57"  # Green
            elif 50 <= value <= 120:
                return "#FFD700"  # Yellow
            else:
                return "#DC143C"  # Red
        
        elif vital == 'systolic_bp':
            if value < 120:
                return "#2E8B57"  # Green
            elif value < 140:
                return "#FFD700"  # Yellow
            else:
                return "#DC143C"  # Red
        
        elif vital == 'oxygen_saturation':
            if value >= 95:
                return "#2E8B57"  # Green
            elif value >= 90:
                return "#FFD700"  # Yellow
            else:
                return "#DC143C"  # Red
        
        return "#808080"  # Default gray
    
    def _generate_cultural_notes(self, health_data: Dict, context: ExplanationContext) -> List[str]:
        """Generate culturally-relevant notes"""
        
        cultural_notes = []
        lang = context.preferred_language
        
        # Dietary considerations
        if context.cultural_context.get('vegetarian', False):
            if lang == Language.ENGLISH:
                cultural_notes.append("Consider protein-rich vegetarian foods for better health")
            elif lang == Language.HINDI:
                cultural_notes.append("बेहतर स्वास्थ्य के लिए प्रोटीन युक्त शाकाहारी भोजन पर विचार करें")
            elif lang == Language.KANNADA:
                cultural_notes.append("ಉತ್ತಮ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಪ್ರೋಟೀನ್ ಭರಿತ ಸಸ್ಯಾಹಾರಿ ಆಹಾರವನ್ನು ಪರಿಗಣಿಸಿ")
        
        # Prayer/medication timing
        if context.cultural_context.get('religious_practice', False):
            if lang == Language.ENGLISH:
                cultural_notes.append("Coordinate medication timing with prayer schedule")
            elif lang == Language.HINDI:
                cultural_notes.append("प्रार्थना के समय के साथ दवा का समय समन्वयित करें")
            elif lang == Language.KANNADA:
                cultural_notes.append("ಪ್ರಾರ್ಥನೆಯ ವೇಳಾಪಟ್ಟಿಯೊಂದಿಗೆ ಔಷಧಿಯ ಸಮಯವನ್ನು ಸಮನ್ವಯಗೊಳಿಸಿ")
        
        # Joint family support
        if context.cultural_context.get('joint_family', False):
            if lang == Language.ENGLISH:
                cultural_notes.append("Involve family members in health monitoring routine")
            elif lang == Language.HINDI:
                cultural_notes.append("स्वास्थ्य निगरानी की दिनचर्या में पारिवारिक सदस्यों को शामिल करें")
            elif lang == Language.KANNADA:
                cultural_notes.append("ಆರೋಗ್ಯ ಮೇಲ್ವಿಚಾರಣೆ ದಿನಚರಿಯಲ್ಲಿ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಒಳಗೊಳ್ಳಿಸಿ")
        
        return cultural_notes
    
    def _generate_medical_disclaimer(self, language: Language) -> str:
        """Generate appropriate medical disclaimer"""
        
        if language == Language.ENGLISH:
            return "This AI analysis is for informational purposes only and should not replace professional medical advice. Always consult with healthcare providers for medical decisions."
        
        elif language == Language.HINDI:
            return "यह AI विश्लेषण केवल जानकारी के लिए है और पेशेवर चिकित्सा सलाह का स्थान नहीं ले सकता। चिकित्सा निर्णयों के लिए हमेशा स्वास्थ्य सेवा प्रदाताओं से सलाह लें।"
        
        elif language == Language.KANNADA:
            return "ಈ AI ವಿಶ್ಲೇಷಣೆ ಕೇವಲ ಮಾಹಿತಿ ಉದ್ದೇಶಗಳಿಗಾಗಿ ಮತ್ತು ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಯನ್ನು ಬದಲಿಸಬಾರದು. ವೈದ್ಯಕೀಯ ನಿರ್ಧಾರಗಳಿಗಾಗಿ ಯಾವಾಗಲೂ ಆರೋಗ್ಯ ಸೇವಾ ಪೂರೈಕೆದಾರರೊಂದಿಗೆ ಸಮಾಲೋಚಿಸಿ."
        
        return ""
    
    def _get_respectful_name(self, name: str, context: ExplanationContext) -> str:
        """Get culturally appropriate name with respect"""
        
        lang = context.preferred_language
        
        # Add respectful titles based on language and relationship
        if lang == Language.HINDI:
            if context.senior_age >= 70:
                return f"{name} जी"  # Add respectful suffix
            else:
                return f"{name}"
        
        elif lang == Language.KANNADA:
            if context.senior_age >= 70:
                return f"{name} ಅವರು"  # Respectful suffix
            else:
                return f"{name}"
        
        else:  # English
            return name
    
    def format_for_mobile_app(self, explanation: HealthExplanation) -> Dict[str, Any]:
        """Format explanation for mobile app display"""
        
        return {
            "explanation_id": explanation.explanation_id,
            "language": explanation.language.value,
            "summary_card": {
                "title": explanation.summary.split('.')[0],  # First sentence
                "status_color": explanation.visual_indicators["overall_status"]["color"],
                "status_icon": explanation.visual_indicators["overall_status"]["icon"],
                "timestamp": explanation.generated_at
            },
            "detailed_sections": [
                {
                    "title": "Key Insights" if explanation.language == Language.ENGLISH else "मुख्य जानकारी" if explanation.language == Language.HINDI else "ಮುಖ್ಯ ಒಳನೋಟಗಳು",
                    "content": explanation.key_insights,
                    "type": "bullet_list"
                },
                {
                    "title": "Recommendations" if explanation.language == Language.ENGLISH else "सिफारिशें" if explanation.language == Language.HINDI else "ಶಿಫಾರಸುಗಳು",
                    "content": explanation.recommendations,
                    "type": "action_list"
                },
                {
                    "title": "Protective Factors" if explanation.language == Language.ENGLISH else "सुरक्षात्मक कारक" if explanation.language == Language.HINDI else "ರಕ್ಷಣಾತ್ಮಕ ಅಂಶಗಳು",
                    "content": explanation.protective_factors,
                    "type": "positive_list"
                }
            ],
            "cultural_notes": explanation.cultural_notes,
            "disclaimer": explanation.medical_disclaimer
        }


def demo_family_friendly_explanations():
    """Demo of family-friendly explanations system"""
    logger.info("🗣️ Starting Family-Friendly Explanations Demo")
    
    # Initialize explanation system
    explanation_system = FamilyFriendlyExplanations()
    
    # Sample health data
    sample_health_data = {
        'senior_id': 'bangalore_senior_001',
        'vital_signs': {
            'heart_rate': 88,
            'systolic_bp': 145,
            'diastolic_bp': 92,
            'oxygen_saturation': 96
        },
        'activity_metrics': {
            'daily_steps': 1800,
            'sleep_hours': 7.5,
            'active_minutes': 25
        },
        'medication_compliance': {
            'overall_adherence': 0.85,
            'missed_dose_events': 2
        },
        'emergency_indicators': {
            'fall_detected': False,
            'critical_vitals': False,
            'medication_emergency': False
        }
    }
    
    # Sample ML prediction
    sample_ml_prediction = {
        'risk_score': 45,
        'deterioration_probability': 0.35,
        'confidence': 0.92,
        'health_status': 'MODERATE_RISK'
    }
    
    # Test contexts for different languages and family structures
    test_contexts = [
        ExplanationContext(
            senior_name="Rajesh Kumar",
            senior_age=72,
            family_member_name="Priya",
            relationship="daughter",
            preferred_language=Language.ENGLISH,
            technical_level="basic",
            cultural_context={
                'joint_family': True,
                'vegetarian': True,
                'religious_practice': True,
                'family_support': True
            }
        ),
        ExplanationContext(
            senior_name="सुनीता देवी",
            senior_age=68,
            family_member_name="अमित",
            relationship="son",
            preferred_language=Language.HINDI,
            technical_level="intermediate",
            cultural_context={
                'joint_family': True,
                'vegetarian': True,
                'religious_practice': True,
                'family_support': True
            }
        ),
        ExplanationContext(
            senior_name="ರामಕೃಷ್ಣ ರಾವ್",
            senior_age=75,
            family_member_name="ಸುಮಿತ್ರಾ",
            relationship="daughter_in_law",
            preferred_language=Language.KANNADA,
            technical_level="basic",
            cultural_context={
                'joint_family': True,
                'vegetarian': False,
                'religious_practice': True,
                'family_support': True
            }
        )
    ]
    
    # Generate explanations for each context
    for i, context in enumerate(test_contexts):
        logger.info(f"\n📱 Test {i+1}: {context.preferred_language.value.upper()} explanation")
        
        # Generate explanation
        explanation = explanation_system.generate_explanation(
            sample_health_data, 
            sample_ml_prediction, 
            context
        )
        
        logger.info(f"  Senior: {context.senior_name}")
        logger.info(f"  Language: {explanation.language.value}")
        logger.info(f"  Summary: {explanation.summary[:100]}...")
        logger.info(f"  Key insights: {len(explanation.key_insights)}")
        logger.info(f"  Recommendations: {len(explanation.recommendations)}")
        logger.info(f"  Cultural notes: {len(explanation.cultural_notes)}")
        
        # Format for mobile app
        mobile_format = explanation_system.format_for_mobile_app(explanation)
        logger.info(f"  Mobile sections: {len(mobile_format['detailed_sections'])}")
        
        # Show sample recommendation
        if explanation.recommendations:
            sample_rec = explanation.recommendations[0]
            logger.info(f"  Sample recommendation: {sample_rec['action'][:50]}...")
    
    logger.info("✅ Family-Friendly Explanations Demo Complete")
    logger.info("🌐 Multi-language AI explanations ready for Bangalore pilot!")
    
    return explanation_system


if __name__ == '__main__':
    demo_family_friendly_explanations()