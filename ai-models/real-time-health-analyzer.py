"""
REAL-TIME HEALTH ANALYSIS ENGINE
Built by: ai-ml-chief agent
Target: <2 second inference time for senior health monitoring
Bangalore Pilot - Emergency Prevention System
"""

import asyncio
import time
import numpy as np
import pandas as pd
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import redis
import threading
from concurrent.futures import ThreadPoolExecutor
import queue
from collections import deque, defaultdict
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class HealthAlert:
    """Data class for health alerts"""
    alert_id: str
    senior_id: str
    alert_type: str
    severity: str
    vital_signs: Dict
    risk_score: float
    prediction: Dict
    timestamp: str
    response_time: float
    
@dataclass
class SensorReading:
    """Data class for sensor readings"""
    senior_id: str
    device_id: str
    sensor_type: str
    readings: Dict
    timestamp: str
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None

class RealTimeHealthAnalyzer:
    """
    Ultra-fast real-time health analysis engine
    Processes IoT sensor data with <2 second response time
    Designed for emergency prevention in Bangalore pilot
    """
    
    def __init__(self, model_path: Optional[str] = None, redis_host: str = 'localhost', redis_port: int = 6379):
        self.model_path = model_path
        self.models = {}
        self.sensor_buffers = defaultdict(lambda: deque(maxlen=100))  # Last 100 readings per senior
        self.analysis_cache = {}
        self.alert_queue = queue.Queue(maxsize=1000)
        self.processing_queue = queue.Queue(maxsize=500)
        
        # Performance tracking
        self.performance_metrics = {
            'total_analyses': 0,
            'average_response_time': 0.0,
            'fastest_response': float('inf'),
            'slowest_response': 0.0,
            'cache_hit_rate': 0.0,
            'alerts_generated': 0
        }
        
        # Redis for caching and real-time data
        try:
            self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
            self.redis_client.ping()
            logger.info("✅ Redis connection established")
        except:
            logger.warning("⚠️ Redis not available, using in-memory cache")
            self.redis_client = None
        
        # Thread pool for parallel processing
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Critical thresholds for immediate alerts
        self.critical_thresholds = {
            'heart_rate': {'min': 45, 'max': 160},
            'systolic_bp': {'max': 200, 'min': 80},
            'diastolic_bp': {'max': 120, 'min': 50},
            'oxygen_saturation': {'min': 88},
            'temperature': {'max': 39.0, 'min': 35.0},
            'fall_detected': True,
            'medication_missed': 2  # 2 consecutive missed doses
        }
        
        # Pattern recognition for health trends
        self.trend_patterns = {
            'deteriorating': {
                'heart_rate_increase': 15,  # BPM increase over 4 hours
                'bp_increase': 20,  # mmHg increase over 6 hours
                'spo2_decrease': 3,  # % decrease over 2 hours
                'activity_decrease': 50  # % decrease over 24 hours
            }
        }
        
        # Start background processing
        self._start_background_processing()
        
        logger.info("⚡ Real-time Health Analyzer initialized - Target: <2s response time")
    
    def _start_background_processing(self):
        """Start background threads for processing"""
        # Alert processing thread
        alert_thread = threading.Thread(target=self._process_alerts, daemon=True)
        alert_thread.start()
        
        # Cache cleanup thread
        cleanup_thread = threading.Thread(target=self._cleanup_cache, daemon=True)
        cleanup_thread.start()
        
        logger.info("🔄 Background processing threads started")
    
    async def analyze_real_time(self, sensor_data: Dict) -> Dict:
        """
        Main real-time analysis function
        Target: <2 second response time
        """
        start_time = time.time()
        
        try:
            senior_id = sensor_data.get('senior_id')
            if not senior_id:
                raise ValueError("senior_id is required")
            
            # 1. Quick cache check (target: <0.1s)
            cache_result = await self._check_cache(sensor_data)
            if cache_result:
                response_time = time.time() - start_time
                self._update_performance_metrics(response_time, cache_hit=True)
                return {**cache_result, 'response_time': response_time, 'cache_hit': True}
            
            # 2. Process sensor data (target: <0.5s)
            processed_data = await self._process_sensor_data(sensor_data)
            
            # 3. Immediate critical check (target: <0.2s)
            critical_alert = await self._check_critical_conditions(processed_data)
            
            # 4. Run ML inference (target: <0.8s)
            ml_prediction = await self._run_ml_inference(processed_data)
            
            # 5. Trend analysis (target: <0.3s)
            trend_analysis = await self._analyze_trends(senior_id, processed_data)
            
            # 6. Generate response (target: <0.2s)
            response = await self._generate_response(
                processed_data, critical_alert, ml_prediction, trend_analysis
            )
            
            # Calculate total response time
            response_time = time.time() - start_time
            response['response_time'] = response_time
            response['cache_hit'] = False
            
            # Cache result if response time is good
            if response_time < 2.0:
                await self._cache_result(sensor_data, response)
            
            # Update performance metrics
            self._update_performance_metrics(response_time, cache_hit=False)
            
            # Queue alert if necessary
            if response.get('alert_required', False):
                await self._queue_alert(response)
            
            # Log performance
            if response_time > 2.0:
                logger.warning(f"⚠️ Response time exceeded target: {response_time:.3f}s")
            else:
                logger.info(f"⚡ Analysis complete: {response_time:.3f}s")
            
            return response
            
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"❌ Analysis failed: {str(e)}")
            return {
                'error': str(e),
                'senior_id': sensor_data.get('senior_id'),
                'response_time': response_time,
                'timestamp': datetime.now().isoformat()
            }
    
    async def _check_cache(self, sensor_data: Dict) -> Optional[Dict]:
        """Quick cache check for similar recent analyses"""
        if not self.redis_client:
            return None
        
        try:
            # Create cache key from sensor data
            cache_key = self._create_cache_key(sensor_data)
            cached_result = self.redis_client.get(cache_key)
            
            if cached_result:
                result = json.loads(cached_result)
                # Check if cache is still valid (< 5 minutes old)
                cached_time = datetime.fromisoformat(result['timestamp'])
                if (datetime.now() - cached_time).total_seconds() < 300:
                    return result
        except Exception as e:
            logger.warning(f"Cache check failed: {str(e)}")
        
        return None
    
    async def _process_sensor_data(self, sensor_data: Dict) -> Dict:
        """Process and normalize sensor data"""
        senior_id = sensor_data['senior_id']
        
        # Store in buffer for trend analysis
        self.sensor_buffers[senior_id].append({
            'data': sensor_data,
            'timestamp': datetime.now().isoformat()
        })
        
        # Normalize and validate data
        processed = {
            'senior_id': senior_id,
            'timestamp': sensor_data.get('timestamp', datetime.now().isoformat()),
            'device_info': sensor_data.get('device_info', {}),
            'vitals': {},
            'activity': {},
            'environmental': {}
        }
        
        # Process vital signs
        if 'heart_rate' in sensor_data:
            processed['vitals']['heart_rate'] = self._validate_vital(
                sensor_data['heart_rate'], 'heart_rate'
            )
        
        if 'blood_pressure' in sensor_data:
            bp = sensor_data['blood_pressure']
            if isinstance(bp, dict):
                processed['vitals']['systolic_bp'] = self._validate_vital(
                    bp.get('systolic'), 'systolic_bp'
                )
                processed['vitals']['diastolic_bp'] = self._validate_vital(
                    bp.get('diastolic'), 'diastolic_bp'
                )
        
        if 'oxygen_saturation' in sensor_data:
            processed['vitals']['oxygen_saturation'] = self._validate_vital(
                sensor_data['oxygen_saturation'], 'oxygen_saturation'
            )
        
        if 'temperature' in sensor_data:
            processed['vitals']['temperature'] = self._validate_vital(
                sensor_data['temperature'], 'temperature'
            )
        
        # Process activity data
        if 'steps' in sensor_data:
            processed['activity']['steps'] = sensor_data['steps']
        
        if 'movement' in sensor_data:
            processed['activity']['movement'] = sensor_data['movement']
        
        if 'fall_detected' in sensor_data:
            processed['activity']['fall_detected'] = sensor_data['fall_detected']
        
        # Process environmental data
        if 'location' in sensor_data:
            processed['environmental']['location'] = sensor_data['location']
        
        return processed
    
    async def _check_critical_conditions(self, data: Dict) -> Optional[Dict]:
        """Ultra-fast critical condition detection"""
        alerts = []
        
        vitals = data.get('vitals', {})
        activity = data.get('activity', {})
        
        # Check each vital against critical thresholds
        for vital, value in vitals.items():
            if vital in self.critical_thresholds and value is not None:
                thresholds = self.critical_thresholds[vital]
                
                if 'min' in thresholds and value < thresholds['min']:
                    alerts.append({
                        'type': 'CRITICAL_LOW',
                        'vital': vital,
                        'value': value,
                        'threshold': thresholds['min'],
                        'severity': 'CRITICAL'
                    })
                
                if 'max' in thresholds and value > thresholds['max']:
                    alerts.append({
                        'type': 'CRITICAL_HIGH',
                        'vital': vital,
                        'value': value,
                        'threshold': thresholds['max'],
                        'severity': 'CRITICAL'
                    })
        
        # Check for fall detection
        if activity.get('fall_detected', False):
            alerts.append({
                'type': 'FALL_DETECTED',
                'severity': 'CRITICAL',
                'location': data.get('environmental', {}).get('location')
            })
        
        if alerts:
            return {
                'critical_alerts': alerts,
                'requires_immediate_response': True,
                'emergency_level': 'CRITICAL'
            }
        
        return None
    
    async def _run_ml_inference(self, data: Dict) -> Dict:
        """Run machine learning inference on processed data"""
        try:
            # Prepare features for ML model
            features = self._prepare_ml_features(data)
            
            # Mock ML inference (in production, this would use trained models)
            # Simulating health deterioration prediction
            vitals = data.get('vitals', {})
            
            # Calculate risk score based on vital deviations
            risk_score = 0
            
            if 'heart_rate' in vitals:
                hr = vitals['heart_rate']
                if hr and (hr < 60 or hr > 100):
                    risk_score += 15
            
            if 'systolic_bp' in vitals:
                sbp = vitals['systolic_bp']
                if sbp and sbp > 140:
                    risk_score += 20
            
            if 'oxygen_saturation' in vitals:
                spo2 = vitals['oxygen_saturation']
                if spo2 and spo2 < 95:
                    risk_score += 25
            
            # Predict health deterioration probability
            deterioration_prob = min(risk_score / 100.0, 0.95)
            
            return {
                'risk_score': risk_score,
                'deterioration_probability': deterioration_prob,
                'health_status': self._categorize_health_status(risk_score),
                'confidence': 0.92,  # Mock confidence score
                'model_version': '1.0-bangalore-pilot'
            }
            
        except Exception as e:
            logger.error(f"ML inference failed: {str(e)}")
            return {
                'error': 'ML inference failed',
                'risk_score': 0,
                'deterioration_probability': 0.0,
                'health_status': 'UNKNOWN'
            }
    
    async def _analyze_trends(self, senior_id: str, current_data: Dict) -> Dict:
        """Analyze health trends from historical data"""
        try:
            # Get recent readings from buffer
            recent_readings = list(self.sensor_buffers[senior_id])
            
            if len(recent_readings) < 3:
                return {'trend': 'INSUFFICIENT_DATA'}
            
            # Extract vital signs from recent readings
            hr_values = []
            bp_values = []
            spo2_values = []
            timestamps = []
            
            for reading in recent_readings[-10:]:  # Last 10 readings
                data = reading['data']
                timestamps.append(reading['timestamp'])
                
                if 'heart_rate' in data:
                    hr_values.append(data['heart_rate'])
                
                if 'blood_pressure' in data:
                    bp = data['blood_pressure']
                    if isinstance(bp, dict) and 'systolic' in bp:
                        bp_values.append(bp['systolic'])
                
                if 'oxygen_saturation' in data:
                    spo2_values.append(data['oxygen_saturation'])
            
            # Analyze trends
            trends = {}
            
            if len(hr_values) >= 3:
                hr_trend = self._calculate_trend(hr_values)
                if hr_trend > 10:  # Increasing by >10 BPM
                    trends['heart_rate'] = 'INCREASING'
                elif hr_trend < -10:
                    trends['heart_rate'] = 'DECREASING'
                else:
                    trends['heart_rate'] = 'STABLE'
            
            if len(bp_values) >= 3:
                bp_trend = self._calculate_trend(bp_values)
                if bp_trend > 15:  # Increasing by >15 mmHg
                    trends['blood_pressure'] = 'INCREASING'
                elif bp_trend < -15:
                    trends['blood_pressure'] = 'DECREASING'
                else:
                    trends['blood_pressure'] = 'STABLE'
            
            if len(spo2_values) >= 3:
                spo2_trend = self._calculate_trend(spo2_values)
                if spo2_trend < -2:  # Decreasing by >2%
                    trends['oxygen_saturation'] = 'DECREASING'
                else:
                    trends['oxygen_saturation'] = 'STABLE'
            
            # Determine overall trend
            concerning_trends = [
                trend for trend in trends.values() 
                if trend in ['INCREASING', 'DECREASING']
            ]
            
            if len(concerning_trends) >= 2:
                overall_trend = 'DETERIORATING'
            elif len(concerning_trends) == 1:
                overall_trend = 'MONITORING_REQUIRED'
            else:
                overall_trend = 'STABLE'
            
            return {
                'overall_trend': overall_trend,
                'vital_trends': trends,
                'data_points': len(recent_readings),
                'analysis_window': '2 hours'
            }
            
        except Exception as e:
            logger.error(f"Trend analysis failed: {str(e)}")
            return {'trend': 'ANALYSIS_ERROR'}
    
    async def _generate_response(self, data: Dict, critical_alert: Optional[Dict], 
                               ml_prediction: Dict, trend_analysis: Dict) -> Dict:
        """Generate comprehensive response"""
        
        response = {
            'senior_id': data['senior_id'],
            'timestamp': datetime.now().isoformat(),
            'vitals': data.get('vitals', {}),
            'ml_prediction': ml_prediction,
            'trend_analysis': trend_analysis,
            'alert_required': False,
            'recommendations': []
        }
        
        # Check for critical alerts
        if critical_alert:
            response.update(critical_alert)
            response['alert_required'] = True
            response['alert_level'] = 'CRITICAL'
        
        # Check ML prediction
        elif ml_prediction.get('deterioration_probability', 0) > 0.7:
            response['alert_required'] = True
            response['alert_level'] = 'HIGH'
            response['recommendations'].append(
                'High probability of health deterioration detected. Consider medical consultation.'
            )
        
        # Check trends
        elif trend_analysis.get('overall_trend') == 'DETERIORATING':
            response['alert_required'] = True
            response['alert_level'] = 'MODERATE'
            response['recommendations'].append(
                'Health indicators showing concerning trends. Increase monitoring frequency.'
            )
        
        # Add general recommendations
        if not response['alert_required']:
            response['health_status'] = 'STABLE'
            response['recommendations'].append('Continue regular monitoring routine.')
        
        return response
    
    async def _cache_result(self, sensor_data: Dict, response: Dict):
        """Cache analysis result for performance"""
        if not self.redis_client:
            return
        
        try:
            cache_key = self._create_cache_key(sensor_data)
            cache_data = {
                **response,
                'cached_at': datetime.now().isoformat()
            }
            
            # Cache for 5 minutes
            self.redis_client.setex(cache_key, 300, json.dumps(cache_data))
        except Exception as e:
            logger.warning(f"Cache write failed: {str(e)}")
    
    async def _queue_alert(self, response: Dict):
        """Queue alert for processing"""
        try:
            alert = HealthAlert(
                alert_id=f"alert_{response['senior_id']}_{int(time.time())}",
                senior_id=response['senior_id'],
                alert_type=response.get('alert_level', 'UNKNOWN'),
                severity=response.get('alert_level', 'UNKNOWN'),
                vital_signs=response.get('vitals', {}),
                risk_score=response.get('ml_prediction', {}).get('risk_score', 0),
                prediction=response.get('ml_prediction', {}),
                timestamp=response['timestamp'],
                response_time=response.get('response_time', 0)
            )
            
            self.alert_queue.put(alert, block=False)
            self.performance_metrics['alerts_generated'] += 1
            
        except queue.Full:
            logger.warning("Alert queue full, dropping alert")
        except Exception as e:
            logger.error(f"Alert queuing failed: {str(e)}")
    
    def _validate_vital(self, value: Any, vital_type: str) -> Optional[float]:
        """Validate and clean vital sign values"""
        if value is None:
            return None
        
        try:
            float_value = float(value)
            
            # Basic range validation
            if vital_type == 'heart_rate':
                return float_value if 30 <= float_value <= 200 else None
            elif vital_type in ['systolic_bp', 'diastolic_bp']:
                return float_value if 50 <= float_value <= 300 else None
            elif vital_type == 'oxygen_saturation':
                return float_value if 70 <= float_value <= 100 else None
            elif vital_type == 'temperature':
                return float_value if 30 <= float_value <= 45 else None
            
            return float_value
            
        except (ValueError, TypeError):
            return None
    
    def _prepare_ml_features(self, data: Dict) -> Dict:
        """Prepare features for ML model"""
        features = {}
        
        vitals = data.get('vitals', {})
        for vital, value in vitals.items():
            if value is not None:
                features[vital] = value
        
        # Add derived features
        if 'systolic_bp' in features and 'diastolic_bp' in features:
            features['pulse_pressure'] = features['systolic_bp'] - features['diastolic_bp']
        
        if 'heart_rate' in features:
            features['hr_deviation'] = abs(features['heart_rate'] - 70)
        
        return features
    
    def _categorize_health_status(self, risk_score: float) -> str:
        """Categorize health status based on risk score"""
        if risk_score >= 75:
            return 'CRITICAL'
        elif risk_score >= 50:
            return 'HIGH_RISK'
        elif risk_score >= 25:
            return 'MODERATE_RISK'
        else:
            return 'LOW_RISK'
    
    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate simple linear trend"""
        if len(values) < 2:
            return 0
        return values[-1] - values[0]
    
    def _create_cache_key(self, sensor_data: Dict) -> str:
        """Create cache key from sensor data"""
        senior_id = sensor_data.get('senior_id', 'unknown')
        vitals_hash = hash(str(sorted(sensor_data.items())))
        return f"health_analysis:{senior_id}:{vitals_hash}"
    
    def _update_performance_metrics(self, response_time: float, cache_hit: bool = False):
        """Update performance tracking metrics"""
        self.performance_metrics['total_analyses'] += 1
        
        if not cache_hit:
            # Update response time metrics
            current_avg = self.performance_metrics['average_response_time']
            total = self.performance_metrics['total_analyses']
            self.performance_metrics['average_response_time'] = (
                (current_avg * (total - 1) + response_time) / total
            )
            
            self.performance_metrics['fastest_response'] = min(
                self.performance_metrics['fastest_response'], response_time
            )
            self.performance_metrics['slowest_response'] = max(
                self.performance_metrics['slowest_response'], response_time
            )
        
        # Update cache hit rate
        cache_hits = sum(1 for _ in range(self.performance_metrics['total_analyses']) if cache_hit)
        self.performance_metrics['cache_hit_rate'] = cache_hits / self.performance_metrics['total_analyses']
    
    def _process_alerts(self):
        """Background thread to process queued alerts"""
        while True:
            try:
                alert = self.alert_queue.get(timeout=1)
                logger.info(f"🚨 Processing alert: {alert.alert_id} - {alert.severity}")
                
                # In production, this would integrate with emergency response system
                # For now, just log the alert
                logger.info(f"Alert details: {alert.senior_id}, Risk: {alert.risk_score}")
                
                self.alert_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Alert processing failed: {str(e)}")
    
    def _cleanup_cache(self):
        """Background thread to cleanup old cache entries"""
        while True:
            try:
                time.sleep(300)  # Run every 5 minutes
                if self.redis_client:
                    # In production, implement proper cache cleanup
                    pass
            except Exception as e:
                logger.error(f"Cache cleanup failed: {str(e)}")
    
    def get_performance_metrics(self) -> Dict:
        """Get current performance metrics"""
        return self.performance_metrics.copy()
    
    def get_system_status(self) -> Dict:
        """Get current system status"""
        return {
            'status': 'OPERATIONAL',
            'performance_metrics': self.get_performance_metrics(),
            'active_seniors': len(self.sensor_buffers),
            'alert_queue_size': self.alert_queue.qsize(),
            'cache_available': self.redis_client is not None,
            'uptime': time.time(),
            'last_check': datetime.now().isoformat()
        }


async def demo_real_time_analyzer():
    """Demo of real-time health analyzer"""
    logger.info("⚡ Starting Real-time Health Analyzer Demo")
    
    # Initialize analyzer
    analyzer = RealTimeHealthAnalyzer()
    
    # Sample sensor data scenarios
    test_scenarios = [
        {
            'name': 'Normal vitals',
            'data': {
                'senior_id': 'bangalore_001',
                'heart_rate': 75,
                'blood_pressure': {'systolic': 125, 'diastolic': 80},
                'oxygen_saturation': 97,
                'temperature': 36.8,
                'steps': 500,
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'name': 'High blood pressure',
            'data': {
                'senior_id': 'bangalore_002',
                'heart_rate': 85,
                'blood_pressure': {'systolic': 165, 'diastolic': 95},
                'oxygen_saturation': 96,
                'temperature': 36.9,
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'name': 'Critical oxygen levels',
            'data': {
                'senior_id': 'bangalore_003',
                'heart_rate': 95,
                'blood_pressure': {'systolic': 145, 'diastolic': 88},
                'oxygen_saturation': 87,  # Critical
                'temperature': 37.2,
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'name': 'Fall detection',
            'data': {
                'senior_id': 'bangalore_004',
                'heart_rate': 110,
                'fall_detected': True,
                'location': {'lat': 12.9716, 'lng': 77.5946},
                'timestamp': datetime.now().isoformat()
            }
        }
    ]
    
    # Test each scenario
    for i, scenario in enumerate(test_scenarios):
        logger.info(f"\n🧪 Test {i+1}: {scenario['name']}")
        
        result = await analyzer.analyze_real_time(scenario['data'])
        
        logger.info(f"  Response time: {result.get('response_time', 0):.3f}s")
        logger.info(f"  Health status: {result.get('health_status', 'N/A')}")
        logger.info(f"  Alert required: {result.get('alert_required', False)}")
        
        if result.get('alert_required'):
            logger.info(f"  Alert level: {result.get('alert_level', 'N/A')}")
        
        # Add small delay between tests
        await asyncio.sleep(0.1)
    
    # Performance summary
    metrics = analyzer.get_performance_metrics()
    logger.info(f"\n📊 Performance Summary:")
    logger.info(f"  Total analyses: {metrics['total_analyses']}")
    logger.info(f"  Average response time: {metrics['average_response_time']:.3f}s")
    logger.info(f"  Fastest response: {metrics['fastest_response']:.3f}s")
    logger.info(f"  Alerts generated: {metrics['alerts_generated']}")
    
    # Check if target is met
    if metrics['average_response_time'] < 2.0:
        logger.info("✅ TARGET ACHIEVED: Average response time < 2 seconds")
    else:
        logger.warning("⚠️ Target not met: Average response time >= 2 seconds")
    
    return analyzer


if __name__ == '__main__':
    asyncio.run(demo_real_time_analyzer())