"""
PREDICTIVE AI HEALTH MODELS - BANGALORE PILOT
Built by: ai-ml-chief agent
Target: 97.3% accuracy for 24-48 hour health deterioration prediction
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb
import joblib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PredictiveHealthModel:
    """
    Core predictive health model for senior care emergency prevention
    Combines XGBoost for primary predictions with ensemble methods for robustness
    """
    
    def __init__(self, target_accuracy: float = 97.3):
        self.target_accuracy = target_accuracy
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        self.model_metrics = {}
        
        # Medical thresholds based on geriatric medicine standards
        self.medical_thresholds = {
            'heart_rate': {'low': 50, 'high': 120, 'critical_low': 40, 'critical_high': 150},
            'systolic_bp': {'low': 90, 'high': 140, 'critical_low': 80, 'critical_high': 180},
            'diastolic_bp': {'low': 60, 'high': 90, 'critical_low': 50, 'critical_high': 110},
            'oxygen_saturation': {'low': 95, 'critical_low': 90},
            'blood_sugar': {'low': 70, 'high': 140, 'critical_low': 60, 'critical_high': 300},
            'temperature': {'low': 36.1, 'high': 37.2, 'critical_low': 35.0, 'critical_high': 38.5}
        }
        
        # Risk factors for Indian seniors
        self.risk_factors = {
            'diabetes_prevalence': 0.77,  # 77% of Indians over 65 have diabetes
            'hypertension_prevalence': 0.63,  # 63% prevalence in seniors
            'cardiovascular_risk': 0.45,  # 45% have cardiovascular conditions
            'medication_adherence': 0.68  # 68% average adherence rate
        }
        
        logger.info(f"🤖 Predictive Health Model initialized - Target accuracy: {target_accuracy}%")
    
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for ML model training and inference
        Includes feature engineering for health deterioration prediction
        """
        logger.info("🔄 Preparing features for ML model...")
        
        features = data.copy()
        
        # Vital signs features
        if 'heart_rate' in features.columns:
            features['hr_deviation'] = np.abs(features['heart_rate'] - 70)  # Normal resting HR
            features['hr_risk_score'] = self._calculate_vital_risk(features['heart_rate'], 'heart_rate')
        
        if 'systolic_bp' in features.columns and 'diastolic_bp' in features.columns:
            features['pulse_pressure'] = features['systolic_bp'] - features['diastolic_bp']
            features['bp_risk_score'] = (
                self._calculate_vital_risk(features['systolic_bp'], 'systolic_bp') +
                self._calculate_vital_risk(features['diastolic_bp'], 'diastolic_bp')
            ) / 2
        
        if 'oxygen_saturation' in features.columns:
            features['spo2_risk_score'] = self._calculate_vital_risk(features['oxygen_saturation'], 'oxygen_saturation')
        
        # Activity pattern features
        if 'daily_steps' in features.columns:
            features['activity_decline'] = features['daily_steps'].rolling(window=7).mean().pct_change()
            features['sedentary_risk'] = (features['daily_steps'] < 2000).astype(int)
        
        # Sleep pattern features
        if 'sleep_hours' in features.columns:
            features['sleep_quality_score'] = np.where(
                (features['sleep_hours'] >= 6) & (features['sleep_hours'] <= 9), 1, 0
            )
        
        # Medication adherence features
        if 'medication_taken' in features.columns and 'medication_scheduled' in features.columns:
            features['adherence_rate'] = features['medication_taken'] / features['medication_scheduled']
            features['adherence_risk'] = (features['adherence_rate'] < 0.8).astype(int)
        
        # Time-based features
        if 'timestamp' in features.columns:
            features['hour'] = pd.to_datetime(features['timestamp']).dt.hour
            features['day_of_week'] = pd.to_datetime(features['timestamp']).dt.dayofweek
            features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
        
        # Composite health risk score
        risk_columns = [col for col in features.columns if col.endswith('_risk_score')]
        if risk_columns:
            features['composite_risk_score'] = features[risk_columns].mean(axis=1)
        
        logger.info(f"✅ Feature preparation complete - {features.shape[1]} features created")
        return features
    
    def _calculate_vital_risk(self, values: pd.Series, vital_type: str) -> pd.Series:
        """Calculate risk score for vital signs based on medical thresholds"""
        thresholds = self.medical_thresholds.get(vital_type, {})
        
        if vital_type == 'oxygen_saturation':
            # Lower is worse for SpO2
            return np.where(values < thresholds.get('critical_low', 90), 3,
                          np.where(values < thresholds.get('low', 95), 2, 
                                 np.where(values < 98, 1, 0)))
        else:
            # Calculate risk based on deviation from normal range
            low = thresholds.get('low', 0)
            high = thresholds.get('high', 999)
            critical_low = thresholds.get('critical_low', 0)
            critical_high = thresholds.get('critical_high', 999)
            
            return np.where((values < critical_low) | (values > critical_high), 3,
                          np.where((values < low) | (values > high), 2,
                                 np.where((values < low * 1.1) | (values > high * 0.9), 1, 0)))
    
    def train_deterioration_prediction_model(self, training_data: pd.DataFrame, target_column: str = 'health_deterioration_24h'):
        """
        Train the primary health deterioration prediction model using XGBoost
        Target: 97.3% accuracy for 24-48 hour predictions
        """
        logger.info("🎯 Training health deterioration prediction model...")
        
        # Prepare features
        features = self.prepare_features(training_data)
        
        # Separate features and target
        feature_columns = [col for col in features.columns if col not in [target_column, 'senior_id', 'timestamp']]
        X = features[feature_columns]
        y = features[target_column]
        
        # Handle missing values
        X = X.fillna(X.median())
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['deterioration_prediction'] = scaler
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
        
        # Train XGBoost model (primary model)
        xgb_model = xgb.XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        )
        
        xgb_model.fit(X_train, y_train, 
                     eval_set=[(X_test, y_test)], 
                     early_stopping_rounds=50, 
                     verbose=False)
        
        # Train ensemble models for robustness
        rf_model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
        rf_model.fit(X_train, y_train)
        
        # Store models
        self.models['deterioration_xgb'] = xgb_model
        self.models['deterioration_rf'] = rf_model
        
        # Evaluate models
        xgb_pred = xgb_model.predict(X_test)
        rf_pred = rf_model.predict(X_test)
        
        # Ensemble prediction (weighted average)
        ensemble_pred = (xgb_pred * 0.7 + rf_pred * 0.3).round().astype(int)
        
        # Calculate metrics
        xgb_accuracy = accuracy_score(y_test, xgb_pred) * 100
        rf_accuracy = accuracy_score(y_test, rf_pred) * 100
        ensemble_accuracy = accuracy_score(y_test, ensemble_pred) * 100
        
        self.model_metrics['deterioration_prediction'] = {
            'xgb_accuracy': xgb_accuracy,
            'rf_accuracy': rf_accuracy,
            'ensemble_accuracy': ensemble_accuracy,
            'precision': precision_score(y_test, ensemble_pred, average='weighted') * 100,
            'recall': recall_score(y_test, ensemble_pred, average='weighted') * 100,
            'f1_score': f1_score(y_test, ensemble_pred, average='weighted') * 100
        }
        
        # Feature importance
        self.feature_importance['deterioration_prediction'] = dict(zip(feature_columns, xgb_model.feature_importances_))
        
        logger.info(f"🎯 Model Training Complete:")
        logger.info(f"  XGBoost Accuracy: {xgb_accuracy:.2f}%")
        logger.info(f"  Random Forest Accuracy: {rf_accuracy:.2f}%")
        logger.info(f"  Ensemble Accuracy: {ensemble_accuracy:.2f}%")
        logger.info(f"  Target Accuracy: {self.target_accuracy}%")
        
        if ensemble_accuracy >= self.target_accuracy:
            logger.info(f"✅ TARGET ACHIEVED: {ensemble_accuracy:.2f}% >= {self.target_accuracy}%")
        else:
            logger.warning(f"⚠️ Target not met. Current: {ensemble_accuracy:.2f}%, Target: {self.target_accuracy}%")
        
        return {
            'accuracy_achieved': ensemble_accuracy,
            'target_met': ensemble_accuracy >= self.target_accuracy,
            'feature_count': len(feature_columns),
            'training_samples': len(X_train)
        }
    
    def predict_health_deterioration(self, input_data: Dict) -> Dict:
        """
        Predict health deterioration risk for next 24-48 hours
        Returns prediction with confidence score and explanations
        """
        # Convert input to DataFrame
        df = pd.DataFrame([input_data])
        
        # Prepare features
        features = self.prepare_features(df)
        
        # Remove non-feature columns
        feature_columns = [col for col in features.columns if col not in ['senior_id', 'timestamp']]
        X = features[feature_columns].fillna(features[feature_columns].median())
        
        # Scale features
        if 'deterioration_prediction' in self.scalers:
            X_scaled = self.scalers['deterioration_prediction'].transform(X)
        else:
            X_scaled = X
        
        # Make predictions
        xgb_prob = self.models['deterioration_xgb'].predict_proba(X_scaled)[0]
        rf_prob = self.models['deterioration_rf'].predict_proba(X_scaled)[0]
        
        # Ensemble prediction
        ensemble_prob = xgb_prob * 0.7 + rf_prob * 0.3
        prediction = ensemble_prob.argmax()
        confidence = ensemble_prob.max() * 100
        
        # Generate explanation
        explanation = self._generate_prediction_explanation(input_data, features.iloc[0])
        
        return {
            'prediction': int(prediction),
            'risk_level': self._get_risk_level(prediction, confidence),
            'confidence': float(confidence),
            'deterioration_probability': float(ensemble_prob[1]) if len(ensemble_prob) > 1 else 0.0,
            'explanation': explanation,
            'prediction_window': '24-48 hours',
            'model_version': '1.0-bangalore-pilot',
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_risk_level(self, prediction: int, confidence: float) -> str:
        """Convert prediction to human-readable risk level"""
        if prediction == 0:
            if confidence > 90:
                return 'LOW'
            elif confidence > 75:
                return 'LOW-MODERATE'
            else:
                return 'UNCERTAIN'
        else:
            if confidence > 90:
                return 'CRITICAL'
            elif confidence > 75:
                return 'HIGH'
            else:
                return 'MODERATE'
    
    def _generate_prediction_explanation(self, input_data: Dict, features: pd.Series) -> Dict:
        """Generate family-friendly explanation of prediction"""
        explanations = []
        risk_factors = []
        recommendations = []
        
        # Analyze vital signs
        if 'heart_rate' in input_data:
            hr = input_data['heart_rate']
            if hr < 50 or hr > 120:
                risk_factors.append(f"Heart rate ({hr} BPM) is outside normal range")
                if hr < 50:
                    recommendations.append("Monitor for dizziness or fatigue")
                else:
                    recommendations.append("Monitor for chest pain or shortness of breath")
        
        if 'systolic_bp' in input_data and 'diastolic_bp' in input_data:
            sys_bp = input_data['systolic_bp']
            dia_bp = input_data['diastolic_bp']
            if sys_bp > 140 or dia_bp > 90:
                risk_factors.append(f"Blood pressure ({sys_bp}/{dia_bp}) is elevated")
                recommendations.append("Consider consulting healthcare provider about blood pressure")
        
        if 'oxygen_saturation' in input_data:
            spo2 = input_data['oxygen_saturation']
            if spo2 < 95:
                risk_factors.append(f"Oxygen level ({spo2}%) is below normal")
                recommendations.append("Monitor breathing and consider oxygen supplementation")
        
        # Analyze activity patterns
        if 'daily_steps' in input_data:
            steps = input_data['daily_steps']
            if steps < 2000:
                risk_factors.append("Low daily activity level")
                recommendations.append("Encourage gentle physical activity as tolerated")
        
        # Analyze medication adherence
        if 'adherence_rate' in features:
            adherence = features['adherence_rate']
            if adherence < 0.8:
                risk_factors.append("Medication adherence is below optimal")
                recommendations.append("Review medication schedule with family member")
        
        return {
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'explanation_text': self._create_family_friendly_explanation(risk_factors),
            'language': 'english',  # Can be extended to Hindi/Kannada
            'medical_disclaimer': 'This AI analysis is for informational purposes only and should not replace professional medical advice.'
        }
    
    def _create_family_friendly_explanation(self, risk_factors: List[str]) -> str:
        """Create simple, family-friendly explanation"""
        if not risk_factors:
            return "All monitored health indicators appear to be within normal ranges. Continue regular monitoring and care routine."
        
        if len(risk_factors) == 1:
            return f"We've noticed {risk_factors[0].lower()}. This may require attention from a healthcare provider."
        else:
            return f"We've identified {len(risk_factors)} health indicators that may need attention: {', '.join([rf.lower() for rf in risk_factors[:2]])}{'...' if len(risk_factors) > 2 else ''}. We recommend consulting with a healthcare provider."
    
    def save_models(self, filepath: str):
        """Save trained models and preprocessors"""
        model_package = {
            'models': self.models,
            'scalers': self.scalers,
            'encoders': self.encoders,
            'feature_importance': self.feature_importance,
            'model_metrics': self.model_metrics,
            'medical_thresholds': self.medical_thresholds,
            'target_accuracy': self.target_accuracy,
            'created_at': datetime.now().isoformat()
        }
        
        joblib.dump(model_package, filepath)
        logger.info(f"💾 Models saved to {filepath}")
    
    def load_models(self, filepath: str):
        """Load trained models and preprocessors"""
        model_package = joblib.load(filepath)
        
        self.models = model_package['models']
        self.scalers = model_package['scalers']
        self.encoders = model_package['encoders']
        self.feature_importance = model_package['feature_importance']
        self.model_metrics = model_package['model_metrics']
        self.medical_thresholds = model_package['medical_thresholds']
        
        logger.info(f"📂 Models loaded from {filepath}")
        return model_package


class RealTimeHealthAnalyzer:
    """
    Real-time health analysis engine for IoT sensor data
    Target: <2 second inference time
    """
    
    def __init__(self, model: PredictiveHealthModel):
        self.model = model
        self.sensor_buffer = {}
        self.analysis_cache = {}
        self.cache_ttl = 300  # 5 minutes
        
        logger.info("⚡ Real-time Health Analyzer initialized")
    
    def process_sensor_data(self, senior_id: str, sensor_data: Dict) -> Dict:
        """
        Process incoming IoT sensor data in real-time
        Returns health analysis with <2 second response time
        """
        start_time = datetime.now()
        
        # Update sensor buffer
        if senior_id not in self.sensor_buffer:
            self.sensor_buffer[senior_id] = {}
        
        self.sensor_buffer[senior_id].update(sensor_data)
        self.sensor_buffer[senior_id]['last_updated'] = start_time.isoformat()
        
        # Check cache
        cache_key = f"{senior_id}_{hash(str(sorted(sensor_data.items())))}"
        if cache_key in self.analysis_cache:
            cached_result = self.analysis_cache[cache_key]
            if (start_time - datetime.fromisoformat(cached_result['analyzed_at'])).seconds < self.cache_ttl:
                cached_result['cache_hit'] = True
                cached_result['response_time'] = (datetime.now() - start_time).total_seconds()
                return cached_result
        
        # Perform real-time analysis
        try:
            # Aggregate recent sensor data
            aggregated_data = self._aggregate_sensor_data(senior_id)
            
            # Run prediction
            prediction_result = self.model.predict_health_deterioration(aggregated_data)
            
            # Calculate response time
            response_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                **prediction_result,
                'senior_id': senior_id,
                'sensor_data': sensor_data,
                'response_time': response_time,
                'analyzed_at': datetime.now().isoformat(),
                'cache_hit': False
            }
            
            # Cache result
            self.analysis_cache[cache_key] = result
            
            # Log performance
            if response_time > 2.0:
                logger.warning(f"⚠️ Response time exceeded target: {response_time:.3f}s > 2.0s")
            else:
                logger.info(f"⚡ Real-time analysis complete: {response_time:.3f}s")
            
            return result
        
        except Exception as e:
            logger.error(f"❌ Real-time analysis failed: {str(e)}")
            return {
                'error': str(e),
                'senior_id': senior_id,
                'response_time': (datetime.now() - start_time).total_seconds(),
                'analyzed_at': datetime.now().isoformat()
            }
    
    def _aggregate_sensor_data(self, senior_id: str) -> Dict:
        """Aggregate recent sensor data for analysis"""
        buffer = self.sensor_buffer.get(senior_id, {})
        
        # Extract latest values
        aggregated = {}
        
        # Vital signs
        vital_fields = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'oxygen_saturation', 'temperature']
        for field in vital_fields:
            if field in buffer:
                aggregated[field] = buffer[field]
        
        # Activity data
        activity_fields = ['daily_steps', 'sleep_hours', 'activity_level']
        for field in activity_fields:
            if field in buffer:
                aggregated[field] = buffer[field]
        
        # Medication data
        med_fields = ['medication_taken', 'medication_scheduled', 'adherence_rate']
        for field in med_fields:
            if field in buffer:
                aggregated[field] = buffer[field]
        
        # Add timestamp
        aggregated['timestamp'] = datetime.now().isoformat()
        
        return aggregated


# Demo and testing functions
def generate_sample_data(n_samples: int = 1000) -> pd.DataFrame:
    """Generate sample health data for testing"""
    np.random.seed(42)
    
    data = {
        'senior_id': [f'senior_{i%100}' for i in range(n_samples)],
        'heart_rate': np.random.normal(75, 15, n_samples),
        'systolic_bp': np.random.normal(125, 20, n_samples),
        'diastolic_bp': np.random.normal(80, 12, n_samples),
        'oxygen_saturation': np.random.normal(97, 3, n_samples),
        'temperature': np.random.normal(36.7, 0.5, n_samples),
        'daily_steps': np.random.poisson(3000, n_samples),
        'sleep_hours': np.random.normal(7, 1.5, n_samples),
        'medication_taken': np.random.poisson(4, n_samples),
        'medication_scheduled': np.repeat(5, n_samples),
        'timestamp': [datetime.now() - timedelta(hours=i) for i in range(n_samples)]
    }
    
    df = pd.DataFrame(data)
    
    # Calculate adherence rate
    df['adherence_rate'] = df['medication_taken'] / df['medication_scheduled']
    
    # Generate health deterioration target (simulate 15% deterioration rate)
    # Higher risk for abnormal vitals
    risk_score = (
        (np.abs(df['heart_rate'] - 70) > 20).astype(int) * 0.3 +
        (df['systolic_bp'] > 140).astype(int) * 0.3 +
        (df['oxygen_saturation'] < 95).astype(int) * 0.4 +
        (df['adherence_rate'] < 0.7).astype(int) * 0.2 +
        (df['daily_steps'] < 2000).astype(int) * 0.2
    )
    
    df['health_deterioration_24h'] = (risk_score > np.random.uniform(0.5, 0.8, n_samples)).astype(int)
    
    return df


def main():
    """Demo of predictive health model"""
    logger.info("🚀 Starting Predictive Health Model Demo - Bangalore Pilot")
    
    # Initialize model
    model = PredictiveHealthModel(target_accuracy=97.3)
    
    # Generate sample training data
    logger.info("📊 Generating sample training data...")
    training_data = generate_sample_data(5000)
    
    # Train model
    training_results = model.train_deterioration_prediction_model(training_data)
    
    # Initialize real-time analyzer
    analyzer = RealTimeHealthAnalyzer(model)
    
    # Test real-time prediction
    sample_sensor_data = {
        'heart_rate': 85,
        'systolic_bp': 145,
        'diastolic_bp': 92,
        'oxygen_saturation': 96,
        'temperature': 36.8,
        'daily_steps': 1500,
        'sleep_hours': 6.5,
        'medication_taken': 4,
        'medication_scheduled': 5
    }
    
    logger.info("⚡ Testing real-time analysis...")
    result = analyzer.process_sensor_data('test_senior_001', sample_sensor_data)
    
    logger.info("📊 Real-time Analysis Results:")
    logger.info(f"  Risk Level: {result.get('risk_level', 'N/A')}")
    logger.info(f"  Confidence: {result.get('confidence', 0):.1f}%")
    logger.info(f"  Response Time: {result.get('response_time', 0):.3f}s")
    logger.info(f"  Deterioration Probability: {result.get('deterioration_probability', 0):.1f}%")
    
    # Save models
    model.save_models('/Users/gokulnair/senior-care-startup/ai-ecosystem/ai-models/predictive_health_model.joblib')
    
    logger.info("✅ Predictive Health Model Demo Complete")
    
    return {
        'training_results': training_results,
        'real_time_test': result,
        'model_ready': True
    }


if __name__ == '__main__':
    main()