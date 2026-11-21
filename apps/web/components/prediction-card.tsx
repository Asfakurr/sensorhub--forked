import type { SensorPrediction } from '@sensorhub/shared';
import { formatPredictionTargetTime, formatTrend } from '@/lib/predictions';

const TITLE = 'Temperature Forecast (Linear Trend)';
const INSUFFICIENT_MESSAGE =
  'Insufficient historical readings for trend forecast (minimum 2 readings required).';
const HORIZONS = [1, 5, 10] as const;

function Forecast({ prediction }: { prediction: SensorPrediction }) {
  const trend = formatTrend(prediction.slopePerMinute);

  return (
    <>
      <div className="metrics">
        <div>
          <span className="prediction-rate mono">{trend.formattedRate}</span>
          <span className={`trend-indicator trend-${trend.direction}`}>{trend.label}</span>
        </div>
      </div>
      <p className="muted">
        Based on {prediction.sampleCount} readings over the last 30 minutes
      </p>
      <div className="prediction-grid">
        {HORIZONS.map((horizon) => {
          const point = prediction.predictions.find((p) => p.horizonMinutes === horizon);
          if (!point) return null;
          return (
            <div className="prediction-point" key={horizon}>
              <span className="muted">+{horizon} min</span>
              <span className="prediction-temperature mono">
                {point.predictedTemperature.toFixed(1)} °C
              </span>
              <span className="muted mono">{formatPredictionTargetTime(point.targetTime)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Read-only forecast card; safe to render with null or insufficient data. */
export function PredictionCard({ prediction }: { prediction: SensorPrediction | null }) {
  return (
    <article className="card prediction-card">
      <header>
        <h3>{TITLE}</h3>
      </header>
      {prediction && prediction.status === 'ready' && prediction.predictions.length > 0 ? (
        <Forecast prediction={prediction} />
      ) : (
        <p className="notice">{INSUFFICIENT_MESSAGE}</p>
      )}
    </article>
  );
}
