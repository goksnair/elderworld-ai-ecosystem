import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import matplotlib.pyplot as plt
import os
from datetime import datetime, timedelta
from caregiver_data_ingestion import CaregiverDataIngestion

class CaregiverAvailabilityPredictor:
    def __init__(self):
        self.ingestor = CaregiverDataIngestion()
        self.model = None

    def train_model(self, historical_data):
        # Preprocess data for ARIMA: aggregate availability per hour/day
        df = pd.DataFrame(historical_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)

        # Aggregate availability (e.g., sum of available caregivers per hour)
        # For simplicity, let's just use the 'is_available' status of one agent for now
        # In a real scenario, you'd aggregate across all caregivers or specific groups
        
        # Let's pick one agent for time series prediction for demonstration
        # You would typically train a model per agent or a more complex multi-variate model
        agent_name_to_predict = 'ai-ml-specialist' # Example agent
        agent_df = df[df['agent_name'] == agent_name_to_predict]['is_available'].astype(int)
        
        if agent_df.empty:
            print(f"No data for agent {agent_name_to_predict} to train model.")
            return

        # Resample to hourly data, filling missing with 0 (not available)
        agent_df = agent_df.resample('H').mean().fillna(0) # Mean of availability (0 or 1)

        # Train ARIMA model
        # Order (p,d,q) can be determined using ACF/PACF plots or auto_arima
        # For demonstration, using a simple order
        try:
            self.model = ARIMA(agent_df, order=(1,1,1))
            self.model_fit = self.model.fit()
            print(f"Model trained successfully for {agent_name_to_predict}.")
        except Exception as e:
            print(f"Error training model: {e}")
            self.model_fit = None

    def predict_availability(self, steps=24):
        if self.model_fit is None:
            print("Model not trained. Please train the model first.")
            return None
        
        forecast = self.model_fit.predict(start=len(self.model_fit.fittedvalues), end=len(self.model_fit.fittedvalues) + steps - 1)
        return forecast

    def visualize_forecast(self, historical_data, forecast_data, agent_name_to_predict='ai-ml-specialist'):
        if historical_data is None or forecast_data is None:
            print("No data to visualize.")
            return

        df = pd.DataFrame(historical_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        agent_df = df[df['agent_name'] == agent_name_to_predict]['is_available'].astype(int)
        agent_df = agent_df.resample('H').mean().fillna(0)

        plt.figure(figsize=(12, 6))
        plt.plot(agent_df.index, agent_df.values, label='Historical Availability')
        plt.plot(forecast_data.index, forecast_data.values, label='Predicted Availability', linestyle='--')
        plt.title(f'Caregiver Availability Forecast for {agent_name_to_predict}')
        plt.xlabel('Time')
        plt.ylabel('Availability (0-1)')
        plt.legend()
        plt.grid(True)
        
        # Save plot to a file
        plot_filename = f'caregiver_availability_forecast_{agent_name_to_predict}.png'
        plt.savefig(plot_filename)
        print(f"Forecast plot saved as {plot_filename}")

if __name__ == '__main__':
    predictor = CaregiverAvailabilityPredictor()

    # 1. Ingest historical data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7) # Use 7 days of historical data
    historical_data = predictor.ingestor.get_caregiver_availability_data(start_date, end_date)

    if historical_data:
        # 2. Train model
        predictor.train_model(historical_data)

        # 3. Predict next 24 hours
        forecast = predictor.predict_availability(steps=24)

        if forecast is not None:
            print("\nPredicted Availability for next 24 hours:")
            print(forecast)
            # 4. Visualize forecast
            predictor.visualize_forecast(historical_data, forecast)
    else:
        print("No historical data available for prediction.")
