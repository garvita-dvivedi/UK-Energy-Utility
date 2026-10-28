import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, Cell
} from 'recharts';
import {
  Wind, TrendingUp, AlertTriangle, Calendar, Clock,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Layers, BarChart3, Info, Sun, Moon
} from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '3000' ? '' : 'http://localhost:8000');

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [decisionHour, setDecisionHour] = useState(12);
  const [activeTab, setActiveTab] = useState('dayView'); // 'dayView' | 'monthView'
  
  // Theme state: dark (default) | light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  const [dayData, setDayData] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch daily comparison data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`${API_BASE_URL}/api/comparison?date=${selectedDate}&decision_hour=${decisionHour}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setDayData(data);
          setLoading(false);
          setError(null);
        }
      })
      .catch(err => {
        console.warn('API error, falling back to local computation:', err);
        if (isMounted) {
          setError('Backend connecting... Showing data view.');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [selectedDate, decisionHour]);

  // Fetch monthly summary data
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/metrics/summary?decision_hour=${decisionHour}`)
      .then(res => res.json())
      .then(data => setMonthData(data))
      .catch(err => console.warn('Could not load monthly summary:', err));
  }, [decisionHour]);

  const metrics = dayData?.metrics || {
    mae: 0,
    rmse: 0,
    bias: 0,
    mape: 0,
    totalActualMWh: 0,
    totalForecastMWh: 0
  };

  const chartData = dayData?.periods || [];

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Wind size={28} />
          </div>
          <div className="brand-titles">
            <h1>
              UK Wind Power Procurement Portal
              <span className="badge badge-live">Elexon BMRS Live</span>
            </h1>
            <p>Day-Ahead Renewable Generation Forecasting & Error Evaluation (January 2026)</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="controls-bar">
          <div className="control-item">
            <Calendar size={16} />
            <label>Delivery Day:</label>
            <input
              type="date"
              className="control-date"
              value={selectedDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="control-item">
            <Clock size={16} />
            <label>Decision Gate (D-1):</label>
            <select
              className="control-select"
              value={decisionHour}
              onChange={(e) => setDecisionHour(Number(e.target.value))}
            >
              <option value={9}>09:00 UTC (Early Morning)</option>
              <option value={11}>11:00 UTC (Pre-Auction)</option>
              <option value={12}>12:00 UTC (EPEX Gate Closure)</option>
              <option value={15}>15:00 UTC (Post-Auction)</option>
              <option value={18}>18:00 UTC (Evening)</option>
            </select>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle light or dark theme"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <Sun size={15} style={{ color: '#f59e0b' }} />
            ) : (
              <Moon size={15} style={{ color: '#8b5cf6' }} />
            )}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'dayView' ? 'active' : ''}`}
          onClick={() => setActiveTab('dayView')}
        >
          <Layers size={18} />
          Day View (48 Settlement Periods)
        </button>
        <button
          className={`tab-btn ${activeTab === 'monthView' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthView')}
        >
          <BarChart3 size={18} />
          Month Overview (January 2026)
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Mean Absolute Error (MAE)</span>
            <AlertTriangle size={18} className="kpi-icon" style={{ color: '#f59e0b' }} />
          </div>
          <div className="kpi-value">
            {metrics.mae?.toLocaleString()} <span className="kpi-unit">MW</span>
          </div>
          <div className="kpi-subtext">Average magnitude of forecast deviation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Root Mean Square Error (RMSE)</span>
            <TrendingUp size={18} className="kpi-icon" style={{ color: '#8b5cf6' }} />
          </div>
          <div className="kpi-value">
            {metrics.rmse?.toLocaleString()} <span className="kpi-unit">MW</span>
          </div>
          <div className="kpi-subtext">Penalizes large extreme variance errors</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Forecast Bias</span>
            {metrics.bias >= 0 ? (
              <ArrowUpRight size={18} className="kpi-icon" style={{ color: '#f43f5e' }} />
            ) : (
              <ArrowDownRight size={18} className="kpi-icon" style={{ color: '#06b6d4' }} />
            )}
          </div>
          <div className="kpi-value" style={{ color: metrics.bias >= 0 ? '#f43f5e' : '#06b6d4' }}>
            {metrics.bias > 0 ? `+${metrics.bias}` : metrics.bias} <span className="kpi-unit">MW</span>
          </div>
          <div className="kpi-subtext">
            {metrics.bias >= 0 ? 'Over-forecasting (Surplus risk)' : 'Under-forecasting (Shortage risk)'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Wind Volume</span>
            <CheckCircle2 size={18} className="kpi-icon" style={{ color: '#10b981' }} />
          </div>
          <div className="kpi-value">
            {Math.round((metrics.totalActualMWh || 0) / 1000).toLocaleString()}{' '}
            <span className="kpi-unit">GWh</span>
          </div>
          <div className="kpi-subtext">
            Day forecast: {Math.round((metrics.totalForecastMWh || 0) / 1000).toLocaleString()} GWh
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Fetching Elexon BMRS stream data for {selectedDate}...</p>
        </div>
      ) : activeTab === 'dayView' ? (
        <>
          {/* Main Forecast vs Actual Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <h2>Day-Ahead Wind Forecast vs Actual Generation ({selectedDate})</h2>
                <p>Resolution: 48 Settlement Periods (30-minute intervals)</p>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
                  <span>Actual Generation (FUELHH)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#a855f7' }}></span>
                  <span>Day-Ahead Forecast (WINDFOR)</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'} />
                  <XAxis
                    dataKey="timeDisplay"
                    stroke={theme === 'light' ? '#94a3b8' : '#6b7280'}
                    tick={{ fill: theme === 'light' ? '#64748b' : '#9ca3af', fontSize: 11 }}
                    interval={3}
                  />
                  <YAxis
                    stroke={theme === 'light' ? '#94a3b8' : '#6b7280'}
                    tick={{ fill: theme === 'light' ? '#64748b' : '#9ca3af', fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="actualMW"
                    name="Actual Generation"
                    stroke="#10b981"
                    strokeWidth={2.8}
                    dot={false}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastMW"
                    name="Day-Ahead Forecast"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 6, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Variance / Error Delta Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <h2>Forecast Error Variance (Forecast − Actual)</h2>
                <p>Positive = Over-forecast (excess contracted); Negative = Under-forecast (thermal top-up required)</p>
              </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'} />
                  <XAxis
                    dataKey="timeDisplay"
                    stroke={theme === 'light' ? '#94a3b8' : '#6b7280'}
                    tick={{ fill: theme === 'light' ? '#64748b' : '#9ca3af', fontSize: 11 }}
                    interval={3}
                  />
                  <YAxis
                    stroke={theme === 'light' ? '#94a3b8' : '#6b7280'}
                    tick={{ fill: theme === 'light' ? '#64748b' : '#9ca3af', fontSize: 11 }}
                    tickFormatter={(v) => `${v} MW`}
                  />
                  <ReferenceLine y={0} stroke={theme === 'light' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.2)'} />
                  <Tooltip content={<ErrorTooltip />} />
                  <Bar
                    dataKey="errorMW"
                    name="Forecast Error"
                    radius={[3, 3, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.errorMW !== null && entry.errorMW !== undefined ? (entry.errorMW >= 0 ? '#f43f5e' : '#06b6d4') : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable Insights & Decision Support */}
          <div className="advisory-box">
            <Info size={24} className="advisory-icon" />
            <div className="advisory-content">
              <h3>Wholesale Day-Ahead Decision Advisory</h3>
              <p>
                For delivery on <strong>{selectedDate}</strong>, the wind forecast exhibited an average deviation of{' '}
                <strong>{metrics.mae?.toLocaleString()} MW</strong> (MAE) with an overall bias of{' '}
                <strong style={{ color: metrics.bias >= 0 ? '#f43f5e' : '#06b6d4' }}>
                  {metrics.bias > 0 ? `+${metrics.bias}` : metrics.bias} MW
                </strong>.
                {metrics.bias > 0
                  ? ' Because wind was over-forecasted, the utility faced an energy deficit on the delivery day and had to activate balancing thermal reserves.'
                  : ' Because wind was under-forecasted, actual wind exceeded expectations, reducing the need for costly peak thermal generation.'}
              </p>
            </div>
          </div>
        </>
      ) : (
        /* Month View: January 2026 Overview */
        <div className="table-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h2>January 2026 Daily Accuracy Performance Table</h2>
              <p>Click on any date to inspect its 48 settlement periods in detail</p>
            </div>
            {monthData?.overall && (
              <div className="badge badge-live">
                Month MAE: {monthData.overall.mae} MW | RMSE: {monthData.overall.rmse} MW
              </div>
            )}
          </div>

          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Delivery Date</th>
                  <th>MAE (MW)</th>
                  <th>RMSE (MW)</th>
                  <th>Mean Bias (MW)</th>
                  <th>MAPE (%)</th>
                  <th>Max Over (MW)</th>
                  <th>Max Under (MW)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(monthData?.daily || []).map((row) => (
                  <tr
                    key={row.date}
                    className={selectedDate === row.date ? 'selected' : ''}
                    onClick={() => {
                      setSelectedDate(row.date);
                      setActiveTab('dayView');
                    }}
                  >
                    <td className="mono" style={{ fontWeight: 600 }}>{row.date}</td>
                    <td>{row.mae?.toLocaleString()}</td>
                    <td>{row.rmse?.toLocaleString()}</td>
                    <td style={{ color: row.bias >= 0 ? '#f43f5e' : '#06b6d4', fontWeight: 600 }}>
                      {row.bias > 0 ? `+${row.bias}` : row.bias}
                    </td>
                    <td>{row.mape}%</td>
                    <td style={{ color: '#f43f5e' }}>+{row.maxOverForecastMW?.toLocaleString()}</td>
                    <td style={{ color: '#06b6d4' }}>{row.maxUnderForecastMW?.toLocaleString()}</td>
                    <td>
                      <button
                        className="tab-btn"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(row.date);
                          setActiveTab('dayView');
                        }}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Tooltip for Forecast vs Actual
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
          Period {data.settlementPeriod} ({data.timeDisplay} UTC)
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label" style={{ color: '#10b981' }}>Actual Generation:</span>
          <span className="tooltip-val">{data.actualMW?.toLocaleString()} MW</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label" style={{ color: '#a855f7' }}>Day-Ahead Forecast:</span>
          <span className="tooltip-val">{data.forecastMW?.toLocaleString()} MW</span>
        </div>
        {data.errorMW !== null && (
          <div className="tooltip-row">
            <span className="tooltip-label">Difference:</span>
            <span
              className="tooltip-val"
              style={{ color: data.errorMW >= 0 ? '#f43f5e' : '#06b6d4' }}
            >
              {data.errorMW > 0 ? `+${data.errorMW}` : data.errorMW} MW
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Error Chart
function ErrorTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.errorMW >= 0;
    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
          Period {data.settlementPeriod} ({data.timeDisplay} UTC)
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Deviation:</span>
          <span className="tooltip-val" style={{ color: isOver ? '#f43f5e' : '#06b6d4' }}>
            {data.errorMW > 0 ? `+${data.errorMW}` : data.errorMW} MW
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Impact:</span>
          <span className="tooltip-val">
            {isOver ? 'Surplus power contracted' : 'Additional thermal required'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}
