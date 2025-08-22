"""
PERSONALIZED RISK ASSESSMENT ALGORITHMS
Built by: ai-ml-chief agent
Bangalore Pilot - Senior Care AI System
Focus: Individual health patterns and medical history analysis
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import logging
from dataclasses import dataclass
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SeniorProfile:
    """Data class for senior citizen health profile"""
    senior_id: str
    age: int
    gender: str
    medical_conditions: List[str]
    medications: List[str]
    baseline_vitals: Dict[str, float]
    family_history: List[str]
    lifestyle_factors: Dict[str, any]
    emergency_contacts: List[Dict]
    created_at: str
    last_updated: str

@dataclass
class RiskAssessment:
    """Data class for personalized risk assessment results"""
    senior_id: str
    overall_risk_score: float
    risk_category: str
    risk_factors: List[Dict]
    protective_factors: List[str]
    recommendations: List[Dict]
    monitoring_frequency: str
    next_assessment_date: str
    confidence_score: float
    assessment_timestamp: str

class PersonalizedRiskAssessment:
    """
    Advanced personalized risk assessment system for Indian seniors
    Considers individual medical history, family patterns, and cultural factors
    """
    
    def __init__(self):
        self.risk_models = {}
        self.population_clusters = None
        self.scaler = StandardScaler()
        
        # Indian-specific health risk factors
        self.indian_health_risks = {
            'diabetes': {
                'prevalence': 0.77,  # 77% of Indian seniors
                'complication_risk': 0.45,
                'risk_multiplier': 1.8
            },
            'hypertension': {
                'prevalence': 0.63,
                'complication_risk': 0.35,
                'risk_multiplier': 1.5
            },
            'cardiovascular_disease': {
                'prevalence': 0.45,
                'complication_risk': 0.65,
                'risk_multiplier': 2.2
            },
            'kidney_disease': {
                'prevalence': 0.28,
                'complication_risk': 0.55,
                'risk_multiplier': 1.7
            },
            'osteoporosis': {
                'prevalence': 0.42,
                'complication_risk': 0.25,
                'risk_multiplier': 1.3
            }
        }
        
        # Cultural and lifestyle factors specific to Indian families
        self.cultural_factors = {
            'joint_family_support': {'protective_factor': True, 'risk_reduction': 0.15},
            'vegetarian_diet': {'protective_factor': True, 'risk_reduction': 0.08},
            'yoga_meditation': {'protective_factor': True, 'risk_reduction': 0.12},
            'smoking_tobacco': {'protective_factor': False, 'risk_increase': 0.35},
            'sedentary_lifestyle': {'protective_factor': False, 'risk_increase': 0.25},
            'air_pollution_exposure': {'protective_factor': False, 'risk_increase': 0.18}
        }
        
        # Bangalore-specific environmental factors
        self.bangalore_factors = {
            'air_quality_pm25': 65,  # Average PM2.5 levels
            'traffic_pollution_risk': 0.22,
            'urban_stress_level': 0.18,
            'healthcare_accessibility': 0.85,  # Good healthcare access
            'emergency_response_time': 15  # Average minutes
        }
        
        logger.info("🎯 Personalized Risk Assessment System initialized for Bangalore pilot")
    
    def create_senior_profile(self, profile_data: Dict) -> SeniorProfile:
        """Create comprehensive senior profile from intake data"""
        
        profile = SeniorProfile(
            senior_id=profile_data['senior_id'],
            age=profile_data['age'],
            gender=profile_data['gender'],
            medical_conditions=profile_data.get('medical_conditions', []),
            medications=profile_data.get('medications', []),
            baseline_vitals=profile_data.get('baseline_vitals', {}),
            family_history=profile_data.get('family_history', []),
            lifestyle_factors=profile_data.get('lifestyle_factors', {}),
            emergency_contacts=profile_data.get('emergency_contacts', []),
            created_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat()
        )
        
        logger.info(f"👤 Senior profile created for {profile.senior_id}")
        return profile
    
    def assess_personalized_risk(self, profile: SeniorProfile, recent_health_data: Dict) -> RiskAssessment:
        """
        Comprehensive personalized risk assessment
        Combines medical history, current health data, and cultural factors
        """
        logger.info(f"🔍 Conducting personalized risk assessment for {profile.senior_id}")
        
        # 1. Medical history risk assessment
        medical_risk = self._assess_medical_history_risk(profile)
        
        # 2. Current health status risk
        current_health_risk = self._assess_current_health_risk(profile, recent_health_data)
        
        # 3. Age and gender-specific risk
        demographic_risk = self._assess_demographic_risk(profile)
        
        # 4. Lifestyle and cultural factors
        lifestyle_risk = self._assess_lifestyle_risk(profile)
        
        # 5. Environmental factors (Bangalore-specific)
        environmental_risk = self._assess_environmental_risk(profile)
        
        # 6. Medication adherence risk
        medication_risk = self._assess_medication_risk(profile, recent_health_data)
        
        # 7. Family history risk
        genetic_risk = self._assess_genetic_risk(profile)
        
        # Combine all risk factors with weights
        risk_weights = {
            'medical_history': 0.25,
            'current_health': 0.30,
            'demographic': 0.15,
            'lifestyle': 0.12,
            'environmental': 0.08,
            'medication': 0.07,
            'genetic': 0.03
        }
        
        overall_risk_score = (
            medical_risk['score'] * risk_weights['medical_history'] +
            current_health_risk['score'] * risk_weights['current_health'] +
            demographic_risk['score'] * risk_weights['demographic'] +
            lifestyle_risk['score'] * risk_weights['lifestyle'] +
            environmental_risk['score'] * risk_weights['environmental'] +
            medication_risk['score'] * risk_weights['medication'] +
            genetic_risk['score'] * risk_weights['genetic']
        )
        
        # Normalize to 0-100 scale
        overall_risk_score = min(100, max(0, overall_risk_score))
        
        # Determine risk category
        risk_category = self._categorize_risk(overall_risk_score)
        
        # Compile risk factors
        all_risk_factors = []
        all_risk_factors.extend(medical_risk['factors'])
        all_risk_factors.extend(current_health_risk['factors'])
        all_risk_factors.extend(demographic_risk['factors'])
        all_risk_factors.extend(lifestyle_risk['factors'])
        all_risk_factors.extend(environmental_risk['factors'])
        all_risk_factors.extend(medication_risk['factors'])
        all_risk_factors.extend(genetic_risk['factors'])
        
        # Generate protective factors
        protective_factors = self._identify_protective_factors(profile)
        
        # Generate personalized recommendations
        recommendations = self._generate_personalized_recommendations(
            profile, overall_risk_score, all_risk_factors
        )
        
        # Determine monitoring frequency
        monitoring_frequency = self._determine_monitoring_frequency(risk_category)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(profile, recent_health_data)
        
        assessment = RiskAssessment(
            senior_id=profile.senior_id,
            overall_risk_score=round(overall_risk_score, 2),
            risk_category=risk_category,
            risk_factors=all_risk_factors,
            protective_factors=protective_factors,
            recommendations=recommendations,
            monitoring_frequency=monitoring_frequency,
            next_assessment_date=(datetime.now() + timedelta(days=30)).isoformat(),
            confidence_score=round(confidence_score, 2),
            assessment_timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"✅ Risk assessment complete: {risk_category} ({overall_risk_score:.1f}/100)")
        return assessment
    
    def _assess_medical_history_risk(self, profile: SeniorProfile) -> Dict:
        """Assess risk based on existing medical conditions"""
        risk_score = 0
        risk_factors = []
        
        for condition in profile.medical_conditions:
            condition_lower = condition.lower()
            
            if 'diabetes' in condition_lower:
                condition_risk = self.indian_health_risks['diabetes']
                risk_score += 25 * condition_risk['risk_multiplier']
                risk_factors.append({
                    'factor': 'Diabetes',
                    'severity': 'High',
                    'impact': condition_risk['risk_multiplier'],
                    'description': 'Diabetes significantly increases risk of complications'
                })
            
            elif 'hypertension' in condition_lower or 'blood pressure' in condition_lower:
                condition_risk = self.indian_health_risks['hypertension']
                risk_score += 20 * condition_risk['risk_multiplier']
                risk_factors.append({
                    'factor': 'Hypertension',
                    'severity': 'Moderate',
                    'impact': condition_risk['risk_multiplier'],
                    'description': 'High blood pressure increases cardiovascular risk'
                })
            
            elif 'heart' in condition_lower or 'cardiovascular' in condition_lower:
                condition_risk = self.indian_health_risks['cardiovascular_disease']
                risk_score += 30 * condition_risk['risk_multiplier']
                risk_factors.append({
                    'factor': 'Cardiovascular Disease',
                    'severity': 'High',
                    'impact': condition_risk['risk_multiplier'],
                    'description': 'Heart conditions require careful monitoring'
                })
            
            elif 'kidney' in condition_lower:
                condition_risk = self.indian_health_risks['kidney_disease']
                risk_score += 22 * condition_risk['risk_multiplier']
                risk_factors.append({
                    'factor': 'Kidney Disease',
                    'severity': 'Moderate',
                    'impact': condition_risk['risk_multiplier'],
                    'description': 'Kidney issues can affect medication processing'
                })
        
        return {'score': min(risk_score, 80), 'factors': risk_factors}
    
    def _assess_current_health_risk(self, profile: SeniorProfile, health_data: Dict) -> Dict:
        """Assess risk based on current health indicators"""
        risk_score = 0
        risk_factors = []
        
        # Check vital signs against baseline and normal ranges
        if 'heart_rate' in health_data:
            hr = health_data['heart_rate']
            baseline_hr = profile.baseline_vitals.get('heart_rate', 70)
            
            if abs(hr - baseline_hr) > 20:
                risk_score += 15
                risk_factors.append({
                    'factor': 'Heart Rate Deviation',
                    'severity': 'Moderate',
                    'impact': 1.2,
                    'description': f'Heart rate ({hr}) differs significantly from baseline ({baseline_hr})'
                })
        
        if 'blood_pressure' in health_data:
            bp = health_data['blood_pressure']
            if isinstance(bp, dict) and 'systolic' in bp:
                systolic = bp['systolic']
                if systolic > 140:
                    risk_score += 20
                    risk_factors.append({
                        'factor': 'Elevated Blood Pressure',
                        'severity': 'High',
                        'impact': 1.5,
                        'description': f'Systolic BP ({systolic}) is above normal range'
                    })
        
        if 'oxygen_saturation' in health_data:
            spo2 = health_data['oxygen_saturation']
            if spo2 < 95:
                risk_score += 25
                risk_factors.append({
                    'factor': 'Low Oxygen Saturation',
                    'severity': 'High',
                    'impact': 1.8,
                    'description': f'Oxygen level ({spo2}%) is below normal'
                })
        
        # Activity level assessment
        if 'daily_steps' in health_data:
            steps = health_data['daily_steps']
            if steps < 2000:
                risk_score += 12
                risk_factors.append({
                    'factor': 'Low Physical Activity',
                    'severity': 'Moderate',
                    'impact': 1.3,
                    'description': f'Daily steps ({steps}) indicate sedentary lifestyle'
                })
        
        return {'score': min(risk_score, 70), 'factors': risk_factors}
    
    def _assess_demographic_risk(self, profile: SeniorProfile) -> Dict:
        """Assess risk based on age and gender"""
        risk_score = 0
        risk_factors = []
        
        # Age-based risk (increases exponentially after 75)
        if profile.age >= 85:
            risk_score += 30
            risk_factors.append({
                'factor': 'Advanced Age',
                'severity': 'High',
                'impact': 1.8,
                'description': f'Age {profile.age} increases overall health risks'
            })
        elif profile.age >= 75:
            risk_score += 18
            risk_factors.append({
                'factor': 'Senior Age',
                'severity': 'Moderate',
                'impact': 1.4,
                'description': f'Age {profile.age} requires increased monitoring'
            })
        elif profile.age >= 65:
            risk_score += 8
        
        # Gender-specific risks
        if profile.gender.lower() == 'female':
            # Higher osteoporosis risk for women
            risk_score += 5
            risk_factors.append({
                'factor': 'Female Gender Risk',
                'severity': 'Low',
                'impact': 1.1,
                'description': 'Women have higher risk for osteoporosis and certain conditions'
            })
        else:
            # Higher cardiovascular risk for men
            risk_score += 8
            risk_factors.append({
                'factor': 'Male Gender Risk',
                'severity': 'Low',
                'impact': 1.2,
                'description': 'Men have higher cardiovascular risk'
            })
        
        return {'score': risk_score, 'factors': risk_factors}
    
    def _assess_lifestyle_risk(self, profile: SeniorProfile) -> Dict:
        """Assess risk from lifestyle factors"""
        risk_score = 0
        risk_factors = []
        
        lifestyle = profile.lifestyle_factors
        
        # Smoking/tobacco use
        if lifestyle.get('tobacco_use', False):
            risk_score += 25
            risk_factors.append({
                'factor': 'Tobacco Use',
                'severity': 'High',
                'impact': 2.0,
                'description': 'Tobacco use significantly increases health risks'
            })
        
        # Diet quality
        if lifestyle.get('diet_quality', 'moderate') == 'poor':
            risk_score += 15
            risk_factors.append({
                'factor': 'Poor Diet',
                'severity': 'Moderate',
                'impact': 1.3,
                'description': 'Poor dietary habits increase chronic disease risk'
            })
        
        # Physical activity
        if lifestyle.get('exercise_frequency', 0) < 2:  # Less than 2 times per week
            risk_score += 12
            risk_factors.append({
                'factor': 'Low Exercise',
                'severity': 'Moderate',
                'impact': 1.2,
                'description': 'Insufficient physical activity increases health risks'
            })
        
        # Sleep quality
        if lifestyle.get('sleep_quality', 'good') == 'poor':
            risk_score += 10
            risk_factors.append({
                'factor': 'Poor Sleep',
                'severity': 'Moderate',
                'impact': 1.2,
                'description': 'Poor sleep quality affects overall health'
            })
        
        return {'score': risk_score, 'factors': risk_factors}
    
    def _assess_environmental_risk(self, profile: SeniorProfile) -> Dict:
        """Assess environmental risks specific to Bangalore"""
        risk_score = 0
        risk_factors = []
        
        # Air pollution risk (Bangalore has moderate to high pollution)
        risk_score += 8
        risk_factors.append({
            'factor': 'Air Pollution',
            'severity': 'Moderate',
            'impact': 1.15,
            'description': f'Bangalore air quality (PM2.5: {self.bangalore_factors["air_quality_pm25"]}) poses health risks'
        })
        
        # Urban stress
        if profile.lifestyle_factors.get('stress_level', 'moderate') == 'high':
            risk_score += 12
            risk_factors.append({
                'factor': 'Urban Stress',
                'severity': 'Moderate',
                'impact': 1.2,
                'description': 'High urban stress levels affect cardiovascular health'
            })
        
        return {'score': risk_score, 'factors': risk_factors}
    
    def _assess_medication_risk(self, profile: SeniorProfile, health_data: Dict) -> Dict:
        """Assess risks related to medications"""
        risk_score = 0
        risk_factors = []
        
        # Polypharmacy risk (multiple medications)
        med_count = len(profile.medications)
        if med_count >= 5:
            risk_score += 15
            risk_factors.append({
                'factor': 'Polypharmacy',
                'severity': 'Moderate',
                'impact': 1.3,
                'description': f'{med_count} medications increase interaction and adherence risks'
            })
        elif med_count >= 3:
            risk_score += 8
        
        # Medication adherence
        adherence_rate = health_data.get('medication_adherence', 1.0)
        if adherence_rate < 0.7:
            risk_score += 18
            risk_factors.append({
                'factor': 'Poor Medication Adherence',
                'severity': 'High',
                'impact': 1.5,
                'description': f'Adherence rate ({adherence_rate:.1%}) below optimal level'
            })
        elif adherence_rate < 0.8:
            risk_score += 10
        
        return {'score': risk_score, 'factors': risk_factors}
    
    def _assess_genetic_risk(self, profile: SeniorProfile) -> Dict:
        """Assess genetic and family history risks"""
        risk_score = 0
        risk_factors = []
        
        high_risk_conditions = ['heart disease', 'diabetes', 'stroke', 'cancer']
        
        for condition in profile.family_history:
            if any(risk_condition in condition.lower() for risk_condition in high_risk_conditions):
                risk_score += 5
                risk_factors.append({
                    'factor': 'Family History',
                    'severity': 'Low',
                    'impact': 1.1,
                    'description': f'Family history of {condition} increases risk'
                })
        
        return {'score': min(risk_score, 15), 'factors': risk_factors}
    
    def _categorize_risk(self, risk_score: float) -> str:
        """Categorize overall risk score"""
        if risk_score >= 75:
            return 'CRITICAL'
        elif risk_score >= 60:
            return 'HIGH'
        elif risk_score >= 40:
            return 'MODERATE'
        elif risk_score >= 25:
            return 'LOW-MODERATE'
        else:
            return 'LOW'
    
    def _identify_protective_factors(self, profile: SeniorProfile) -> List[str]:
        """Identify factors that reduce health risks"""
        protective_factors = []
        
        lifestyle = profile.lifestyle_factors
        
        if lifestyle.get('family_support', False):
            protective_factors.append('Strong family support system')
        
        if lifestyle.get('regular_checkups', False):
            protective_factors.append('Regular medical checkups')
        
        if lifestyle.get('diet_quality', 'moderate') == 'good':
            protective_factors.append('Healthy diet')
        
        if lifestyle.get('exercise_frequency', 0) >= 3:
            protective_factors.append('Regular physical activity')
        
        if lifestyle.get('social_engagement', False):
            protective_factors.append('Active social engagement')
        
        if not lifestyle.get('tobacco_use', False):
            protective_factors.append('Non-smoker')
        
        if lifestyle.get('medication_management', False):
            protective_factors.append('Good medication management')
        
        return protective_factors
    
    def _generate_personalized_recommendations(self, profile: SeniorProfile, risk_score: float, risk_factors: List[Dict]) -> List[Dict]:
        """Generate personalized health recommendations"""
        recommendations = []
        
        # High-priority recommendations based on risk category
        if risk_score >= 60:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Medical Care',
                'recommendation': 'Schedule immediate consultation with healthcare provider',
                'timeline': 'Within 24-48 hours'
            })
        
        # Medication-related recommendations
        if any('medication' in rf['factor'].lower() for rf in risk_factors):
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Medication Management',
                'recommendation': 'Review medication adherence with family member or pharmacist',
                'timeline': 'Within 1 week'
            })
        
        # Lifestyle recommendations
        if any('activity' in rf['factor'].lower() or 'exercise' in rf['factor'].lower() for rf in risk_factors):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Physical Activity',
                'recommendation': 'Increase daily physical activity with gentle walking or yoga',
                'timeline': 'Start within 3 days'
            })
        
        # Diet recommendations
        if any('diet' in rf['factor'].lower() for rf in risk_factors):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Nutrition',
                'recommendation': 'Consult with nutritionist for senior-friendly Indian meal planning',
                'timeline': 'Within 2 weeks'
            })
        
        # Monitoring recommendations
        if risk_score >= 40:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Health Monitoring',
                'recommendation': 'Increase frequency of vital signs monitoring',
                'timeline': 'Immediate'
            })
        
        return recommendations
    
    def _determine_monitoring_frequency(self, risk_category: str) -> str:
        """Determine how often monitoring should occur"""
        frequency_map = {
            'CRITICAL': 'Every 4 hours',
            'HIGH': 'Every 8 hours',
            'MODERATE': 'Twice daily',
            'LOW-MODERATE': 'Daily',
            'LOW': 'Every 2 days'
        }
        return frequency_map.get(risk_category, 'Daily')
    
    def _calculate_confidence_score(self, profile: SeniorProfile, health_data: Dict) -> float:
        """Calculate confidence in the risk assessment"""
        confidence = 85.0  # Base confidence
        
        # Reduce confidence for missing data
        total_expected_fields = 8
        available_fields = len([
            f for f in ['age', 'medical_conditions', 'medications', 'baseline_vitals']
            if getattr(profile, f, None)
        ]) + len([
            f for f in ['heart_rate', 'blood_pressure', 'oxygen_saturation', 'daily_steps']
            if f in health_data
        ])
        
        data_completeness = available_fields / total_expected_fields
        confidence *= data_completeness
        
        # Increase confidence for longer history
        if len(profile.medical_conditions) > 0:
            confidence += 5
        
        if len(profile.medications) > 0:
            confidence += 3
        
        return min(confidence, 95.0)


def demo_personalized_risk_assessment():
    """Demo of personalized risk assessment system"""
    logger.info("🎯 Starting Personalized Risk Assessment Demo")
    
    # Initialize system
    risk_assessor = PersonalizedRiskAssessment()
    
    # Sample senior profile
    sample_profile_data = {
        'senior_id': 'bangalore_senior_001',
        'age': 72,
        'gender': 'female',
        'medical_conditions': ['Type 2 Diabetes', 'Hypertension', 'Osteoporosis'],
        'medications': ['Metformin', 'Amlodipine', 'Calcium supplements', 'Vitamin D'],
        'baseline_vitals': {
            'heart_rate': 75,
            'systolic_bp': 135,
            'diastolic_bp': 85,
            'oxygen_saturation': 97
        },
        'family_history': ['Heart disease', 'Diabetes'],
        'lifestyle_factors': {
            'tobacco_use': False,
            'diet_quality': 'good',
            'exercise_frequency': 2,
            'sleep_quality': 'fair',
            'family_support': True,
            'stress_level': 'moderate'
        },
        'emergency_contacts': [
            {'name': 'Daughter', 'phone': '+91-9876543210', 'relationship': 'daughter'}
        ]
    }
    
    # Recent health data
    sample_health_data = {
        'heart_rate': 82,
        'blood_pressure': {'systolic': 148, 'diastolic': 92},
        'oxygen_saturation': 96,
        'daily_steps': 1800,
        'medication_adherence': 0.75
    }
    
    # Create profile
    profile = risk_assessor.create_senior_profile(sample_profile_data)
    
    # Conduct risk assessment
    assessment = risk_assessor.assess_personalized_risk(profile, sample_health_data)
    
    # Display results
    logger.info("📊 Personalized Risk Assessment Results:")
    logger.info(f"  Senior ID: {assessment.senior_id}")
    logger.info(f"  Overall Risk Score: {assessment.overall_risk_score}/100")
    logger.info(f"  Risk Category: {assessment.risk_category}")
    logger.info(f"  Confidence Score: {assessment.confidence_score}%")
    logger.info(f"  Monitoring Frequency: {assessment.monitoring_frequency}")
    
    logger.info(f"\n🚨 Risk Factors ({len(assessment.risk_factors)}):")
    for rf in assessment.risk_factors[:5]:  # Show top 5
        logger.info(f"  - {rf['factor']} ({rf['severity']}): {rf['description']}")
    
    logger.info(f"\n🛡️ Protective Factors ({len(assessment.protective_factors)}):")
    for pf in assessment.protective_factors[:3]:  # Show top 3
        logger.info(f"  - {pf}")
    
    logger.info(f"\n💡 Recommendations ({len(assessment.recommendations)}):")
    for rec in assessment.recommendations:
        logger.info(f"  - [{rec['priority']}] {rec['recommendation']} ({rec['timeline']})")
    
    logger.info("✅ Personalized Risk Assessment Demo Complete")
    
    return assessment


if __name__ == '__main__':
    demo_personalized_risk_assessment()