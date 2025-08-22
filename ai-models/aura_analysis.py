import json
from datetime import datetime, timedelta

def calculate_baseline(data, key, window_days=7):
    # Filter data for the last `window_days`
    recent_data = [entry[key] for entry in data if datetime.fromisoformat(entry["timestamp"]) > datetime.now() - timedelta(days=window_days)]
    if not recent_data:
        return None
    return sum(recent_data) / len(recent_data)

def detect_deviation(current_value, baseline, threshold_percentage=0.15):
    if baseline is None or baseline == 0:
        return False, "Baseline not available or zero"
    deviation = abs(current_value - baseline) / baseline
    if deviation > threshold_percentage:
        return True, f"Deviation of {deviation:.2%} from baseline"
    return False, "No significant deviation"

def analyze_aura_data(ingested_data):
    analysis_results = {
        "motion_deviation": {"detected": False, "details": ""},
        "sleep_deviation": {"detected": False, "details": ""},
        "call_frequency_deviation": {"detected": False, "details": ""}
    }

    # Analyze Motion Data
    motion_data = ingested_data["iot_sensors"]["motion_data"]
    if motion_data:
        # Calculate daily motion events for baseline
        daily_motion = {}
        for entry in motion_data:
            date = datetime.fromisoformat(entry["timestamp"]).date()
            daily_motion[date] = daily_motion.get(date, 0) + entry["value"]
        
        # Assuming the most recent day's data for current value
        latest_day = max(daily_motion.keys())
        current_motion = daily_motion[latest_day]
        
        motion_values = [v for v in daily_motion.values()]
        motion_baseline = sum(motion_values) / len(motion_values) if motion_values else None

        detected, details = detect_deviation(current_motion, motion_baseline)
        analysis_results["motion_deviation"] = {"detected": detected, "details": details, "current": current_motion, "baseline": motion_baseline}

    # Analyze Sleep Data
    sleep_data = ingested_data["iot_sensors"]["sleep_data"]
    if sleep_data:
        current_sleep = sleep_data[-1]["value"] # Assuming last entry is most recent
        sleep_baseline = calculate_baseline(sleep_data, "value")
        detected, details = detect_deviation(current_sleep, sleep_baseline)
        analysis_results["sleep_deviation"] = {"detected": detected, "details": details, "current": current_sleep, "baseline": sleep_baseline}

    # Analyze Call Frequency Data
    call_logs = ingested_data["call_logs"]
    if call_logs:
        # Calculate daily call count for baseline
        daily_calls = {}
        for entry in call_logs:
            date = datetime.fromisoformat(entry["timestamp"]).date()
            daily_calls[date] = daily_calls.get(date, 0) + 1
        
        latest_day = max(daily_calls.keys())
        current_calls = daily_calls[latest_day]

        call_counts = [v for v in daily_calls.values()]
        call_baseline = sum(call_counts) / len(call_counts) if call_counts else None

        detected, details = detect_deviation(current_calls, call_baseline)
        analysis_results["call_frequency_deviation"] = {"detected": detected, "details": details, "current": current_calls, "baseline": call_baseline}

    return analysis_results

if __name__ == "__main__":
    # Example usage with simulated data from aura_data_ingestion.py
    from aura_data_ingestion import simulate_data_ingestion
    simulated_data = simulate_data_ingestion()
    analysis = analyze_aura_data(simulated_data)
    print(json.dumps(analysis, indent=4))
