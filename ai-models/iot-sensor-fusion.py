"""
IOT SENSOR DATA FUSION SYSTEM
Built by: ai-ml-chief agent
Bangalore Pilot - Senior Care AI System
Multi-modal sensor integration: Wearables + Smart Home + Environmental
"""

import asyncio
import json
import logging
import time
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import threading
import queue
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SensorType(Enum):
    """Enum for different sensor types"""
    WEARABLE_HEART_RATE = "wearable_hr"
    WEARABLE_BLOOD_PRESSURE = "wearable_bp" 
    WEARABLE_OXYGEN = "wearable_spo2"
    WEARABLE_ACTIVITY = "wearable_activity"
    WEARABLE_SLEEP = "wearable_sleep"
    SMART_HOME_MOTION = "home_motion"
    SMART_HOME_DOOR = "home_door"
    SMART_HOME_BATHROOM = "home_bathroom"
    SMART_HOME_KITCHEN = "home_kitchen"
    SMART_HOME_BED = "home_bed"
    SMART_MEDICATION = "smart_pillbox"
    ENVIRONMENTAL_AIR = "env_air_quality"
    ENVIRONMENTAL_TEMPERATURE = "env_temperature"
    EMERGENCY_BUTTON = "emergency_button"
    FALL_DETECTOR = "fall_detector"

@dataclass
class SensorReading:
    """Standardized sensor reading format"""
    sensor_id: str
    sensor_type: SensorType
    senior_id: str
    timestamp: str
    raw_data: Dict[str, Any]
    processed_data: Dict[str, Any]
    quality_score: float  # 0-1 score for data quality
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None
    location: Optional[Dict[str, float]] = None

@dataclass 
class FusedHealthData:
    """Fused multi-sensor health data"""
    senior_id: str
    timestamp: str
    vital_signs: Dict[str, float]
    activity_metrics: Dict[str, Any]
    behavioral_patterns: Dict[str, Any]
    environmental_context: Dict[str, Any]
    medication_compliance: Dict[str, Any]
    emergency_indicators: Dict[str, Any]
    data_quality: Dict[str, float]
    confidence_score: float
    contributing_sensors: List[str]

class IoTSensorFusion:
    """
    Advanced IoT sensor data fusion system
    Combines multiple sensor types for comprehensive health monitoring
    Designed for Indian seniors with cultural and environmental considerations
    """
    
    def __init__(self):
        self.sensor_registry = {}  # Register all connected sensors
        self.sensor_buffers = defaultdict(lambda: deque(maxlen=1000))  # Per-sensor data buffers
        self.fusion_buffer = defaultdict(lambda: deque(maxlen=100))  # Fused data buffer per senior
        self.sensor_metadata = {}
        self.fusion_rules = {}
        self.quality_thresholds = {}
        
        # Initialize sensor fusion rules
        self._initialize_fusion_rules()
        
        # Initialize quality thresholds
        self._initialize_quality_thresholds()
        
        # Start background processing
        self.processing_queue = queue.Queue(maxsize=1000)
        self._start_background_processing()
        
        logger.info("🔗 IoT Sensor Fusion System initialized")
    
    def _initialize_fusion_rules(self):
        """Initialize rules for fusing different sensor types"""
        
        # Vital signs fusion rules
        self.fusion_rules['vital_signs'] = {
            'heart_rate': {
                'primary_sensors': [SensorType.WEARABLE_HEART_RATE],
                'backup_sensors': [SensorType.WEARABLE_BLOOD_PRESSURE],
                'fusion_method': 'weighted_average',
                'weights': {'wearable_hr': 0.8, 'wearable_bp': 0.6},
                'validation_range': (40, 180),
                'outlier_threshold': 2.5  # Standard deviations
            },
            'blood_pressure': {
                'primary_sensors': [SensorType.WEARABLE_BLOOD_PRESSURE],
                'backup_sensors': [],
                'fusion_method': 'latest_valid',
                'validation_range': {'systolic': (80, 220), 'diastolic': (50, 130)},
                'measurement_frequency': 4  # Per day minimum
            },
            'oxygen_saturation': {
                'primary_sensors': [SensorType.WEARABLE_OXYGEN],
                'backup_sensors': [],
                'fusion_method': 'median_filter',
                'validation_range': (85, 100),
                'critical_threshold': 90
            }
        }
        
        # Activity fusion rules
        self.fusion_rules['activity'] = {
            'steps': {
                'primary_sensors': [SensorType.WEARABLE_ACTIVITY],
                'backup_sensors': [SensorType.SMART_HOME_MOTION],
                'fusion_method': 'correlation_weighted',
                'daily_target': 3000  # Steps for Indian seniors
            },
            'sleep': {
                'primary_sensors': [SensorType.WEARABLE_SLEEP, SensorType.SMART_HOME_BED],
                'fusion_method': 'consensus',
                'target_range': (6, 9)  # Hours
            },
            'mobility': {
                'primary_sensors': [SensorType.SMART_HOME_MOTION, SensorType.SMART_HOME_DOOR],
                'fusion_method': 'activity_inference',
                'room_transitions': True
            }
        }
        
        # Behavioral pattern fusion
        self.fusion_rules['behavioral'] = {
            'routine_adherence': {
                'sensors': [SensorType.SMART_HOME_MOTION, SensorType.SMART_HOME_BATHROOM, SensorType.SMART_HOME_KITCHEN],
                'fusion_method': 'pattern_analysis',
                'baseline_period': 30  # Days to establish baseline
            },
            'medication_compliance': {
                'sensors': [SensorType.SMART_MEDICATION],
                'fusion_method': 'discrete_events',
                'adherence_threshold': 0.8
            }
        }
        
        logger.info("✅ Sensor fusion rules initialized")
    
    def _initialize_quality_thresholds(self):
        """Initialize data quality thresholds for different sensors"""
        
        self.quality_thresholds = {
            SensorType.WEARABLE_HEART_RATE: {
                'signal_strength': 0.7,
                'battery_minimum': 0.2,
                'sampling_rate': 1,  # Hz minimum
                'noise_threshold': 0.1
            },
            SensorType.WEARABLE_BLOOD_PRESSURE: {
                'signal_strength': 0.8,
                'battery_minimum': 0.3,
                'measurement_stability': 0.9
            },
            SensorType.SMART_HOME_MOTION: {
                'connectivity': 0.95,
                'false_positive_rate': 0.05,
                'coverage_area': 0.8
            },
            SensorType.SMART_MEDICATION: {
                'detection_accuracy': 0.95,
                'timestamp_precision': 0.99
            }
        }
        
        logger.info("✅ Quality thresholds configured")
    
    def register_sensor(self, sensor_config: Dict) -> bool:
        """Register a new IoT sensor with the fusion system"""
        try:
            sensor_id = sensor_config['sensor_id']
            sensor_type = SensorType(sensor_config['sensor_type'])
            senior_id = sensor_config['senior_id']
            
            self.sensor_registry[sensor_id] = {
                'sensor_type': sensor_type,
                'senior_id': senior_id,
                'location': sensor_config.get('location'),
                'capabilities': sensor_config.get('capabilities', []),
                'registered_at': datetime.now().isoformat(),
                'status': 'active',
                'last_seen': None
            }
            
            logger.info(f"📡 Sensor registered: {sensor_id} ({sensor_type.value}) for {senior_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Sensor registration failed: {str(e)}")
            return False
    
    async def process_sensor_data(self, sensor_data: Dict) -> Dict:
        """Process incoming sensor data and add to fusion pipeline"""
        try:
            sensor_id = sensor_data['sensor_id']
            
            if sensor_id not in self.sensor_registry:
                raise ValueError(f"Sensor {sensor_id} not registered")
            
            sensor_info = self.sensor_registry[sensor_id]
            sensor_type = sensor_info['sensor_type']
            senior_id = sensor_info['senior_id']
            
            # Create standardized sensor reading
            reading = SensorReading(
                sensor_id=sensor_id,
                sensor_type=sensor_type,
                senior_id=senior_id,
                timestamp=sensor_data.get('timestamp', datetime.now().isoformat()),
                raw_data=sensor_data.get('data', {}),
                processed_data={},
                quality_score=0.0,
                battery_level=sensor_data.get('battery_level'),
                signal_strength=sensor_data.get('signal_strength'),
                location=sensor_data.get('location')
            )
            
            # Process sensor-specific data
            reading.processed_data = await self._process_sensor_type_data(reading)
            
            # Calculate quality score
            reading.quality_score = self._calculate_quality_score(reading)
            
            # Store in buffer
            self.sensor_buffers[sensor_id].append(reading)
            
            # Update sensor status
            self.sensor_registry[sensor_id]['last_seen'] = reading.timestamp
            
            # Queue for fusion processing
            self.processing_queue.put(reading, block=False)
            
            return {
                'status': 'processed',
                'sensor_id': sensor_id,
                'quality_score': reading.quality_score,
                'timestamp': reading.timestamp
            }
            
        except Exception as e:
            logger.error(f"❌ Sensor data processing failed: {str(e)}")
            return {'status': 'error', 'error': str(e)}
    
    async def _process_sensor_type_data(self, reading: SensorReading) -> Dict:
        """Process data based on sensor type"""
        sensor_type = reading.sensor_type
        raw_data = reading.raw_data
        processed = {}
        
        try:
            if sensor_type == SensorType.WEARABLE_HEART_RATE:
                processed = await self._process_heart_rate_data(raw_data)
            
            elif sensor_type == SensorType.WEARABLE_BLOOD_PRESSURE:
                processed = await self._process_blood_pressure_data(raw_data)
            
            elif sensor_type == SensorType.WEARABLE_OXYGEN:
                processed = await self._process_oxygen_data(raw_data)
            
            elif sensor_type == SensorType.WEARABLE_ACTIVITY:
                processed = await self._process_activity_data(raw_data)
            
            elif sensor_type == SensorType.SMART_HOME_MOTION:
                processed = await self._process_motion_data(raw_data)
            
            elif sensor_type == SensorType.SMART_MEDICATION:
                processed = await self._process_medication_data(raw_data)
            
            elif sensor_type == SensorType.FALL_DETECTOR:
                processed = await self._process_fall_data(raw_data)
            
            elif sensor_type == SensorType.ENVIRONMENTAL_AIR:
                processed = await self._process_air_quality_data(raw_data)
            
            else:
                processed = raw_data.copy()  # Default: pass through
            
        except Exception as e:
            logger.error(f"Sensor type processing failed for {sensor_type}: {str(e)}")
            processed = raw_data.copy()
        
        return processed
    
    async def _process_heart_rate_data(self, raw_data: Dict) -> Dict:
        """Process heart rate sensor data"""
        processed = {}
        
        if 'heart_rate' in raw_data:
            hr = raw_data['heart_rate']
            
            # Validate range
            if 40 <= hr <= 180:
                processed['heart_rate'] = hr
                processed['hr_zone'] = self._classify_heart_rate_zone(hr)
                processed['hr_variability'] = raw_data.get('hrv', 0)
            else:
                processed['heart_rate'] = None
                processed['validation_error'] = f'HR {hr} out of valid range'
        
        # Add context
        processed['measurement_context'] = raw_data.get('context', 'resting')
        processed['sensor_position'] = raw_data.get('position', 'wrist')
        
        return processed
    
    async def _process_blood_pressure_data(self, raw_data: Dict) -> Dict:
        """Process blood pressure sensor data"""
        processed = {}
        
        if 'systolic' in raw_data and 'diastolic' in raw_data:
            systolic = raw_data['systolic']
            diastolic = raw_data['diastolic']
            
            # Validate ranges
            if 80 <= systolic <= 220 and 50 <= diastolic <= 130:
                processed['systolic'] = systolic
                processed['diastolic'] = diastolic
                processed['pulse_pressure'] = systolic - diastolic
                processed['bp_category'] = self._classify_blood_pressure(systolic, diastolic)
            else:
                processed['validation_error'] = f'BP {systolic}/{diastolic} out of valid range'
        
        processed['measurement_position'] = raw_data.get('position', 'sitting')
        processed['cuff_size'] = raw_data.get('cuff_size', 'standard')
        
        return processed
    
    async def _process_oxygen_data(self, raw_data: Dict) -> Dict:
        """Process oxygen saturation data"""
        processed = {}
        
        if 'spo2' in raw_data:
            spo2 = raw_data['spo2']
            
            if 85 <= spo2 <= 100:
                processed['oxygen_saturation'] = spo2
                processed['spo2_trend'] = raw_data.get('trend', 'stable')
                
                # Critical level detection
                if spo2 < 90:
                    processed['critical_alert'] = True
            else:
                processed['validation_error'] = f'SpO2 {spo2} out of valid range'
        
        processed['perfusion_index'] = raw_data.get('perfusion_index', 0)
        
        return processed
    
    async def _process_activity_data(self, raw_data: Dict) -> Dict:
        """Process activity/fitness tracker data"""
        processed = {}
        
        # Steps
        if 'steps' in raw_data:
            processed['steps'] = max(0, raw_data['steps'])
        
        # Distance
        if 'distance' in raw_data:
            processed['distance_km'] = max(0, raw_data['distance'])
        
        # Calories
        if 'calories' in raw_data:
            processed['calories_burned'] = max(0, raw_data['calories'])
        
        # Activity intensity
        if 'intensity_minutes' in raw_data:
            processed['active_minutes'] = raw_data['intensity_minutes']
            processed['activity_level'] = self._classify_activity_level(raw_data['intensity_minutes'])
        
        # Sleep data
        if 'sleep_data' in raw_data:
            sleep_data = raw_data['sleep_data']
            processed['sleep_hours'] = sleep_data.get('total_sleep', 0)
            processed['sleep_quality'] = sleep_data.get('sleep_quality', 'unknown')
            processed['sleep_efficiency'] = sleep_data.get('efficiency', 0)
        
        return processed
    
    async def _process_motion_data(self, raw_data: Dict) -> Dict:
        """Process smart home motion sensor data"""
        processed = {}
        
        processed['motion_detected'] = raw_data.get('motion', False)
        processed['room'] = raw_data.get('room', 'unknown')
        processed['duration'] = raw_data.get('duration', 0)
        processed['intensity'] = raw_data.get('intensity', 0)
        
        # Infer activity type
        if processed['motion_detected']:
            processed['inferred_activity'] = self._infer_activity_from_motion(raw_data)
        
        return processed
    
    async def _process_medication_data(self, raw_data: Dict) -> Dict:
        """Process smart medication dispenser data"""
        processed = {}
        
        processed['medication_taken'] = raw_data.get('pills_taken', 0)
        processed['scheduled_dose'] = raw_data.get('scheduled_dose', 0)
        processed['medication_name'] = raw_data.get('medication', 'unknown')
        processed['dose_time'] = raw_data.get('dose_time')
        processed['adherence'] = processed['medication_taken'] / max(processed['scheduled_dose'], 1)
        
        # Detect missed doses
        if processed['adherence'] < 0.8:
            processed['adherence_alert'] = True
        
        return processed
    
    async def _process_fall_data(self, raw_data: Dict) -> Dict:
        """Process fall detection data"""
        processed = {}
        
        processed['fall_detected'] = raw_data.get('fall_detected', False)
        processed['impact_force'] = raw_data.get('impact_force', 0)
        processed['confidence'] = raw_data.get('confidence', 0)
        processed['location'] = raw_data.get('location')
        
        if processed['fall_detected'] and processed['confidence'] > 0.8:
            processed['emergency_alert'] = True
        
        return processed
    
    async def _process_air_quality_data(self, raw_data: Dict) -> Dict:
        """Process environmental air quality data"""
        processed = {}
        
        processed['pm25'] = raw_data.get('pm25', 0)
        processed['pm10'] = raw_data.get('pm10', 0)
        processed['aqi'] = raw_data.get('aqi', 0)
        processed['temperature'] = raw_data.get('temperature', 0)
        processed['humidity'] = raw_data.get('humidity', 0)
        
        # Health risk assessment
        if processed['pm25'] > 35:  # WHO guideline
            processed['air_quality_risk'] = 'high'
        elif processed['pm25'] > 15:
            processed['air_quality_risk'] = 'moderate'
        else:
            processed['air_quality_risk'] = 'low'
        
        return processed
    
    async def fuse_sensor_data(self, senior_id: str, time_window: int = 300) -> FusedHealthData:
        """
        Fuse data from multiple sensors for comprehensive health picture
        time_window: seconds to look back for sensor data
        """
        try:
            current_time = datetime.now()
            cutoff_time = current_time - timedelta(seconds=time_window)
            
            # Collect recent sensor readings for this senior
            recent_readings = []
            contributing_sensors = []
            
            for sensor_id, sensor_info in self.sensor_registry.items():
                if sensor_info['senior_id'] == senior_id:
                    sensor_buffer = self.sensor_buffers[sensor_id]
                    
                    # Filter recent readings
                    for reading in sensor_buffer:
                        reading_time = datetime.fromisoformat(reading.timestamp)
                        if reading_time >= cutoff_time:
                            recent_readings.append(reading)
                            if reading.sensor_id not in contributing_sensors:
                                contributing_sensors.append(reading.sensor_id)
            
            if not recent_readings:
                raise ValueError(f"No recent sensor data for senior {senior_id}")
            
            # Fuse vital signs
            vital_signs = await self._fuse_vital_signs(recent_readings)
            
            # Fuse activity metrics
            activity_metrics = await self._fuse_activity_data(recent_readings)
            
            # Analyze behavioral patterns
            behavioral_patterns = await self._analyze_behavioral_patterns(senior_id, recent_readings)
            
            # Assess environmental context
            environmental_context = await self._assess_environmental_context(recent_readings)
            
            # Check medication compliance
            medication_compliance = await self._assess_medication_compliance(recent_readings)
            
            # Detect emergency indicators
            emergency_indicators = await self._detect_emergency_indicators(recent_readings)
            
            # Calculate data quality scores
            data_quality = await self._calculate_fusion_quality(recent_readings)
            
            # Calculate overall confidence
            confidence_score = await self._calculate_fusion_confidence(recent_readings, data_quality)
            
            # Create fused data object
            fused_data = FusedHealthData(
                senior_id=senior_id,
                timestamp=current_time.isoformat(),
                vital_signs=vital_signs,
                activity_metrics=activity_metrics,
                behavioral_patterns=behavioral_patterns,
                environmental_context=environmental_context,
                medication_compliance=medication_compliance,
                emergency_indicators=emergency_indicators,
                data_quality=data_quality,
                confidence_score=confidence_score,
                contributing_sensors=contributing_sensors
            )
            
            # Store in fusion buffer
            self.fusion_buffer[senior_id].append(fused_data)
            
            logger.info(f"🔗 Data fusion complete for {senior_id}: {len(contributing_sensors)} sensors, confidence {confidence_score:.2f}")
            
            return fused_data
            
        except Exception as e:
            logger.error(f"❌ Data fusion failed for {senior_id}: {str(e)}")
            raise
    
    async def _fuse_vital_signs(self, readings: List[SensorReading]) -> Dict[str, float]:
        """Fuse vital sign data from multiple sensors"""
        vital_signs = {}
        
        # Heart rate fusion
        hr_readings = []
        for reading in readings:
            if reading.sensor_type in [SensorType.WEARABLE_HEART_RATE, SensorType.WEARABLE_BLOOD_PRESSURE]:
                if 'heart_rate' in reading.processed_data and reading.processed_data['heart_rate']:
                    hr_readings.append({
                        'value': reading.processed_data['heart_rate'],
                        'quality': reading.quality_score,
                        'timestamp': reading.timestamp
                    })
        
        if hr_readings:
            # Weighted average based on quality scores
            total_weight = sum(r['quality'] for r in hr_readings)
            if total_weight > 0:
                vital_signs['heart_rate'] = sum(r['value'] * r['quality'] for r in hr_readings) / total_weight
        
        # Blood pressure fusion
        bp_readings = []
        for reading in readings:
            if reading.sensor_type == SensorType.WEARABLE_BLOOD_PRESSURE:
                if 'systolic' in reading.processed_data and 'diastolic' in reading.processed_data:
                    bp_readings.append({
                        'systolic': reading.processed_data['systolic'],
                        'diastolic': reading.processed_data['diastolic'],
                        'quality': reading.quality_score,
                        'timestamp': reading.timestamp
                    })
        
        if bp_readings:
            # Use most recent high-quality reading
            best_bp = max(bp_readings, key=lambda x: x['quality'])
            vital_signs['systolic_bp'] = best_bp['systolic']
            vital_signs['diastolic_bp'] = best_bp['diastolic']
        
        # Oxygen saturation
        spo2_readings = []
        for reading in readings:
            if reading.sensor_type == SensorType.WEARABLE_OXYGEN:
                if 'oxygen_saturation' in reading.processed_data:
                    spo2_readings.append({
                        'value': reading.processed_data['oxygen_saturation'],
                        'quality': reading.quality_score,
                        'timestamp': reading.timestamp
                    })
        
        if spo2_readings:
            # Median filter to remove outliers
            values = [r['value'] for r in spo2_readings]
            vital_signs['oxygen_saturation'] = np.median(values)
        
        return vital_signs
    
    async def _fuse_activity_data(self, readings: List[SensorReading]) -> Dict[str, Any]:
        """Fuse activity data from wearables and smart home sensors"""
        activity_metrics = {}
        
        # Steps from wearables
        for reading in readings:
            if reading.sensor_type == SensorType.WEARABLE_ACTIVITY:
                if 'steps' in reading.processed_data:
                    activity_metrics['daily_steps'] = reading.processed_data['steps']
                if 'active_minutes' in reading.processed_data:
                    activity_metrics['active_minutes'] = reading.processed_data['active_minutes']
                if 'sleep_hours' in reading.processed_data:
                    activity_metrics['sleep_hours'] = reading.processed_data['sleep_hours']
        
        # Motion from smart home sensors
        motion_events = []
        for reading in readings:
            if reading.sensor_type == SensorType.SMART_HOME_MOTION:
                if reading.processed_data.get('motion_detected'):
                    motion_events.append({
                        'room': reading.processed_data.get('room'),
                        'duration': reading.processed_data.get('duration', 0),
                        'timestamp': reading.timestamp
                    })
        
        if motion_events:
            activity_metrics['home_activity_events'] = len(motion_events)
            activity_metrics['active_rooms'] = len(set(event['room'] for event in motion_events))
            activity_metrics['total_motion_duration'] = sum(event['duration'] for event in motion_events)
        
        return activity_metrics
    
    async def _analyze_behavioral_patterns(self, senior_id: str, readings: List[SensorReading]) -> Dict[str, Any]:
        """Analyze behavioral patterns from sensor data"""
        patterns = {}
        
        # Medication adherence pattern
        med_readings = [r for r in readings if r.sensor_type == SensorType.SMART_MEDICATION]
        if med_readings:
            adherence_scores = [r.processed_data.get('adherence', 1.0) for r in med_readings]
            patterns['medication_adherence'] = np.mean(adherence_scores)
        
        # Activity routine analysis
        motion_readings = [r for r in readings if r.sensor_type == SensorType.SMART_HOME_MOTION]
        if motion_readings:
            room_usage = defaultdict(int)
            for reading in motion_readings:
                room = reading.processed_data.get('room', 'unknown')
                room_usage[room] += 1
            
            patterns['room_usage_pattern'] = dict(room_usage)
            patterns['mobility_score'] = len(room_usage) / 10.0  # Normalize by typical home rooms
        
        # Sleep pattern consistency
        sleep_readings = [r for r in readings if r.sensor_type == SensorType.WEARABLE_ACTIVITY and 'sleep_hours' in r.processed_data]
        if len(sleep_readings) > 1:
            sleep_hours = [r.processed_data['sleep_hours'] for r in sleep_readings]
            patterns['sleep_consistency'] = 1.0 - (np.std(sleep_hours) / np.mean(sleep_hours)) if np.mean(sleep_hours) > 0 else 0
        
        return patterns
    
    async def _assess_environmental_context(self, readings: List[SensorReading]) -> Dict[str, Any]:
        """Assess environmental factors affecting health"""
        context = {}
        
        # Air quality
        air_readings = [r for r in readings if r.sensor_type == SensorType.ENVIRONMENTAL_AIR]
        if air_readings:
            latest_air = max(air_readings, key=lambda x: x.timestamp)
            context['air_quality'] = {
                'pm25': latest_air.processed_data.get('pm25', 0),
                'aqi': latest_air.processed_data.get('aqi', 0),
                'risk_level': latest_air.processed_data.get('air_quality_risk', 'unknown')
            }
        
        # Indoor environment
        context['indoor_environment'] = {
            'temperature': 25.0,  # Default/placeholder
            'humidity': 60.0,     # Default/placeholder
            'air_circulation': 'good'
        }
        
        return context
    
    async def _assess_medication_compliance(self, readings: List[SensorReading]) -> Dict[str, Any]:
        """Assess medication compliance from smart medication sensors"""
        compliance = {}
        
        med_readings = [r for r in readings if r.sensor_type == SensorType.SMART_MEDICATION]
        
        if med_readings:
            adherence_scores = []
            missed_doses = 0
            
            for reading in med_readings:
                adherence = reading.processed_data.get('adherence', 1.0)
                adherence_scores.append(adherence)
                
                if adherence < 0.8:
                    missed_doses += 1
            
            compliance['overall_adherence'] = np.mean(adherence_scores)
            compliance['missed_dose_events'] = missed_doses
            compliance['compliance_trend'] = 'stable'  # Would be calculated from historical data
        else:
            compliance['overall_adherence'] = 1.0  # Assume compliance if no smart medication sensor
            compliance['missed_dose_events'] = 0
        
        return compliance
    
    async def _detect_emergency_indicators(self, readings: List[SensorReading]) -> Dict[str, Any]:
        """Detect emergency indicators from sensor fusion"""
        indicators = {
            'fall_detected': False,
            'critical_vitals': False,
            'medication_emergency': False,
            'inactivity_alert': False,
            'emergency_button': False
        }
        
        # Fall detection
        fall_readings = [r for r in readings if r.sensor_type == SensorType.FALL_DETECTOR]
        if any(r.processed_data.get('fall_detected', False) for r in fall_readings):
            indicators['fall_detected'] = True
        
        # Critical vital signs
        for reading in readings:
            if reading.sensor_type == SensorType.WEARABLE_OXYGEN:
                if reading.processed_data.get('critical_alert', False):
                    indicators['critical_vitals'] = True
                    break
        
        # Medication emergency (multiple missed doses)
        med_readings = [r for r in readings if r.sensor_type == SensorType.SMART_MEDICATION]
        if any(r.processed_data.get('adherence_alert', False) for r in med_readings):
            indicators['medication_emergency'] = True
        
        # Inactivity detection (no motion for extended period)
        motion_readings = [r for r in readings if r.sensor_type == SensorType.SMART_HOME_MOTION]
        if not any(r.processed_data.get('motion_detected', False) for r in motion_readings):
            # Check if this represents a concerning period of inactivity
            time_span = self._calculate_time_span(readings)
            if time_span > 7200:  # No motion for 2+ hours during daytime
                indicators['inactivity_alert'] = True
        
        # Emergency button
        emergency_readings = [r for r in readings if r.sensor_type == SensorType.EMERGENCY_BUTTON]
        if any(r.processed_data.get('button_pressed', False) for r in emergency_readings):
            indicators['emergency_button'] = True
        
        return indicators
    
    def _calculate_time_span(self, readings: List[SensorReading]) -> float:
        """Calculate time span of readings in seconds"""
        if len(readings) < 2:
            return 0
        
        timestamps = [datetime.fromisoformat(r.timestamp) for r in readings]
        return (max(timestamps) - min(timestamps)).total_seconds()
    
    async def _calculate_fusion_quality(self, readings: List[SensorReading]) -> Dict[str, float]:
        """Calculate data quality scores for the fusion result"""
        quality_scores = {}
        
        # Overall data completeness
        sensor_types = set(r.sensor_type for r in readings)
        expected_sensors = {SensorType.WEARABLE_HEART_RATE, SensorType.WEARABLE_ACTIVITY, SensorType.SMART_HOME_MOTION}
        completeness = len(sensor_types.intersection(expected_sensors)) / len(expected_sensors)
        quality_scores['data_completeness'] = completeness
        
        # Average sensor quality
        individual_qualities = [r.quality_score for r in readings if r.quality_score > 0]
        quality_scores['sensor_quality'] = np.mean(individual_qualities) if individual_qualities else 0
        
        # Data freshness (how recent is the data)
        current_time = datetime.now()
        ages = [(current_time - datetime.fromisoformat(r.timestamp)).total_seconds() for r in readings]
        avg_age = np.mean(ages)
        freshness = max(0, 1 - avg_age / 3600)  # Decreases over 1 hour
        quality_scores['data_freshness'] = freshness
        
        return quality_scores
    
    async def _calculate_fusion_confidence(self, readings: List[SensorReading], quality_scores: Dict[str, float]) -> float:
        """Calculate overall confidence in the fused data"""
        
        # Base confidence from quality scores
        base_confidence = np.mean(list(quality_scores.values()))
        
        # Boost confidence with more sensors
        num_sensors = len(set(r.sensor_id for r in readings))
        sensor_bonus = min(0.2, num_sensors * 0.05)  # Up to 20% bonus for multiple sensors
        
        # Reduce confidence for outliers or inconsistencies
        consistency_penalty = 0  # Would implement consistency checks
        
        confidence = min(1.0, base_confidence + sensor_bonus - consistency_penalty)
        return confidence
    
    def _calculate_quality_score(self, reading: SensorReading) -> float:
        """Calculate quality score for individual sensor reading"""
        score = 1.0
        
        sensor_type = reading.sensor_type
        thresholds = self.quality_thresholds.get(sensor_type, {})
        
        # Battery level check
        if reading.battery_level is not None:
            min_battery = thresholds.get('battery_minimum', 0.1)
            if reading.battery_level < min_battery:
                score *= 0.5  # Reduce score for low battery
        
        # Signal strength check
        if reading.signal_strength is not None:
            min_signal = thresholds.get('signal_strength', 0.5)
            if reading.signal_strength < min_signal:
                score *= 0.7  # Reduce score for weak signal
        
        # Data validation check
        if 'validation_error' in reading.processed_data:
            score *= 0.3  # Significantly reduce score for validation errors
        
        return max(0.0, min(1.0, score))
    
    def _classify_heart_rate_zone(self, heart_rate: float) -> str:
        """Classify heart rate into zones for seniors"""
        if heart_rate < 50:
            return 'bradycardia'
        elif heart_rate < 65:
            return 'low_normal'
        elif heart_rate < 85:
            return 'normal'
        elif heart_rate < 100:
            return 'elevated'
        else:
            return 'tachycardia'
    
    def _classify_blood_pressure(self, systolic: float, diastolic: float) -> str:
        """Classify blood pressure for seniors"""
        if systolic < 90 or diastolic < 60:
            return 'hypotension'
        elif systolic < 120 and diastolic < 80:
            return 'normal'
        elif systolic < 130 and diastolic < 80:
            return 'elevated'
        elif systolic < 140 or diastolic < 90:
            return 'stage_1_hypertension'
        else:
            return 'stage_2_hypertension'
    
    def _classify_activity_level(self, active_minutes: float) -> str:
        """Classify activity level for seniors"""
        if active_minutes < 15:
            return 'sedentary'
        elif active_minutes < 30:
            return 'lightly_active'
        elif active_minutes < 60:
            return 'moderately_active'
        else:
            return 'very_active'
    
    def _infer_activity_from_motion(self, motion_data: Dict) -> str:
        """Infer activity type from motion sensor data"""
        room = motion_data.get('room', 'unknown')
        duration = motion_data.get('duration', 0)
        intensity = motion_data.get('intensity', 0)
        
        if room == 'bathroom':
            return 'personal_care'
        elif room == 'kitchen':
            if duration > 300:  # More than 5 minutes
                return 'meal_preparation'
            else:
                return 'kitchen_activity'
        elif room == 'bedroom':
            return 'resting'
        elif room == 'living_room':
            if intensity > 0.5:
                return 'active_socializing'
            else:
                return 'relaxation'
        else:
            return 'general_activity'
    
    def _start_background_processing(self):
        """Start background thread for processing sensor fusion"""
        def process_fusion_queue():
            while True:
                try:
                    reading = self.processing_queue.get(timeout=1)
                    # Process fusion for the senior when new data arrives
                    senior_id = reading.senior_id
                    
                    # Trigger fusion every 10th reading to balance performance
                    sensor_buffer = self.sensor_buffers[reading.sensor_id]
                    if len(sensor_buffer) % 10 == 0:
                        try:
                            asyncio.run(self.fuse_sensor_data(senior_id))
                        except Exception as e:
                            logger.error(f"Background fusion failed: {str(e)}")
                    
                    self.processing_queue.task_done()
                    
                except queue.Empty:
                    continue
                except Exception as e:
                    logger.error(f"Background processing error: {str(e)}")
        
        fusion_thread = threading.Thread(target=process_fusion_queue, daemon=True)
        fusion_thread.start()
        logger.info("🔄 Background fusion processing started")
    
    def get_system_status(self) -> Dict:
        """Get current system status"""
        total_sensors = len(self.sensor_registry)
        active_sensors = sum(1 for s in self.sensor_registry.values() if s['status'] == 'active')
        
        return {
            'total_sensors': total_sensors,
            'active_sensors': active_sensors,
            'sensor_types': list(set(s['sensor_type'].value for s in self.sensor_registry.values())),
            'processing_queue_size': self.processing_queue.qsize(),
            'seniors_monitored': len(set(s['senior_id'] for s in self.sensor_registry.values())),
            'uptime': time.time(),
            'last_check': datetime.now().isoformat()
        }


async def demo_iot_sensor_fusion():
    """Demo of IoT sensor fusion system"""
    logger.info("🔗 Starting IoT Sensor Fusion Demo")
    
    # Initialize fusion system
    fusion_system = IoTSensorFusion()
    
    # Register demo sensors for a senior
    senior_id = 'bangalore_senior_001'
    
    sensors = [
        {
            'sensor_id': 'hr_watch_001',
            'sensor_type': SensorType.WEARABLE_HEART_RATE.value,
            'senior_id': senior_id,
            'capabilities': ['heart_rate', 'heart_rate_variability']
        },
        {
            'sensor_id': 'bp_monitor_001', 
            'sensor_type': SensorType.WEARABLE_BLOOD_PRESSURE.value,
            'senior_id': senior_id,
            'capabilities': ['systolic', 'diastolic', 'pulse']
        },
        {
            'sensor_id': 'motion_lr_001',
            'sensor_type': SensorType.SMART_HOME_MOTION.value,
            'senior_id': senior_id,
            'location': {'room': 'living_room'}
        },
        {
            'sensor_id': 'motion_br_001',
            'sensor_type': SensorType.SMART_HOME_MOTION.value,
            'senior_id': senior_id,
            'location': {'room': 'bedroom'}
        },
        {
            'sensor_id': 'pillbox_001',
            'sensor_type': SensorType.SMART_MEDICATION.value,
            'senior_id': senior_id,
            'capabilities': ['dose_detection', 'timing']
        }
    ]
    
    # Register all sensors
    for sensor in sensors:
        fusion_system.register_sensor(sensor)
    
    # Simulate sensor data streams
    sensor_data_streams = [
        {
            'sensor_id': 'hr_watch_001',
            'data': {'heart_rate': 78, 'hrv': 45},
            'battery_level': 0.85,
            'signal_strength': 0.9
        },
        {
            'sensor_id': 'bp_monitor_001',
            'data': {'systolic': 135, 'diastolic': 85},
            'battery_level': 0.65,
            'signal_strength': 0.8
        },
        {
            'sensor_id': 'motion_lr_001',
            'data': {'motion': True, 'room': 'living_room', 'duration': 120, 'intensity': 0.6},
            'signal_strength': 0.95
        },
        {
            'sensor_id': 'motion_br_001',
            'data': {'motion': False, 'room': 'bedroom'},
            'signal_strength': 0.9
        },
        {
            'sensor_id': 'pillbox_001',
            'data': {'pills_taken': 4, 'scheduled_dose': 5, 'medication': 'Metformin'},
            'battery_level': 0.7
        }
    ]
    
    # Process sensor data
    logger.info("📡 Processing sensor data streams...")
    for data in sensor_data_streams:
        result = await fusion_system.process_sensor_data(data)
        logger.info(f"  {data['sensor_id']}: Quality {result.get('quality_score', 0):.2f}")
    
    # Wait a moment for background processing
    await asyncio.sleep(1)
    
    # Perform data fusion
    logger.info("🔗 Performing sensor data fusion...")
    fused_data = await fusion_system.fuse_sensor_data(senior_id)
    
    # Display fusion results
    logger.info("📊 Sensor Fusion Results:")
    logger.info(f"  Senior ID: {fused_data.senior_id}")
    logger.info(f"  Contributing sensors: {len(fused_data.contributing_sensors)}")
    logger.info(f"  Confidence score: {fused_data.confidence_score:.2f}")
    
    logger.info(f"\n💓 Vital Signs:")
    for vital, value in fused_data.vital_signs.items():
        logger.info(f"    {vital}: {value}")
    
    logger.info(f"\n🏃 Activity Metrics:")
    for metric, value in fused_data.activity_metrics.items():
        logger.info(f"    {metric}: {value}")
    
    logger.info(f"\n🏠 Behavioral Patterns:")
    for pattern, value in fused_data.behavioral_patterns.items():
        logger.info(f"    {pattern}: {value}")
    
    logger.info(f"\n🚨 Emergency Indicators:")
    emergency_count = sum(1 for indicator, value in fused_data.emergency_indicators.items() if value)
    logger.info(f"    Active alerts: {emergency_count}")
    
    logger.info(f"\n💊 Medication Compliance:")
    adherence = fused_data.medication_compliance.get('overall_adherence', 0)
    logger.info(f"    Overall adherence: {adherence:.1%}")
    
    # System status
    status = fusion_system.get_system_status()
    logger.info(f"\n🔧 System Status:")
    logger.info(f"    Active sensors: {status['active_sensors']}/{status['total_sensors']}")
    logger.info(f"    Seniors monitored: {status['seniors_monitored']}")
    
    logger.info("✅ IoT Sensor Fusion Demo Complete")
    
    return fusion_system, fused_data


if __name__ == '__main__':
    asyncio.run(demo_iot_sensor_fusion())