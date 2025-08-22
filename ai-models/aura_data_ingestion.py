import json
import random
from datetime import datetime, timedelta

def generate_iot_data(sensor_type, num_entries=10):
    data = []
    for i in range(num_entries):
        timestamp = datetime.now() - timedelta(minutes=random.randint(1, 60 * 24 * 7)) # Last 7 days
        value = 0
        if sensor_type == "motion":
            value = random.randint(0, 100) # Motion events
        elif sensor_type == "sleep":
            value = random.randint(4, 10) # Hours of sleep
        data.append({
            "timestamp": timestamp.isoformat(),
            "sensor_type": sensor_type,
            "value": value,
            "unit": "events" if sensor_type == "motion" else "hours"
        })
    return data

def generate_call_log_metadata(num_entries=5):
    data = []
    contacts = ["Family Member A", "Family Member B", "Friend C", "Caregiver D"]
    for i in range(num_entries):
        timestamp = datetime.now() - timedelta(minutes=random.randint(1, 60 * 24 * 7))
        data.append({
            "timestamp": timestamp.isoformat(),
            "contact": random.choice(contacts),
            "duration_minutes": random.randint(1, 30),
            "call_type": random.choice(["incoming", "outgoing"])
        })
    return data

def simulate_data_ingestion():
    ingested_data = {
        "iot_sensors": {
            "motion_data": generate_iot_data("motion", 20),
            "sleep_data": generate_iot_data("sleep", 7)
        },
        "call_logs": generate_call_log_metadata(10)
    }
    return ingested_data

if __name__ == "__main__":
    simulated_data = simulate_data_ingestion()
    print(json.dumps(simulated_data, indent=4))
