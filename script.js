/**
 * Weather App
 * Replace YOUR_API_KEY_HERE with a valid OpenWeatherMap API key.
 *
 * This script:
 * - Detects user location (geolocation)
 * - Fetches weather via OpenWeatherMap One Call API
 * - Shows current, hourly (24h) and daily (5 days)
 * - Renders animated background per weather condition
 * - Supports C/F toggle and dark/light theme (persisted)
 */

// =========================
// CONFIG
// =========================
const OPENWEATHER_KEY = 'YOUR_API_KEY_HERE'; // <<-- REPLACE with your OpenWeatherMap API key
// OneCall: https://openweathermap.org/api/one-call-api
// We'll first fetch coords via "weather" endpoint for city searches, then call onecall

// =========================
// DOM refs
// =========================
const $ = sel => document.querySelector(sel);
const app = $('#app');
const searchInput = $('#city-input');
const searchBtn = $('#search-btn');
const unitToggle = $('#unit-toggle');
const themeToggle = $('#theme-toggle');

const weatherIcon = $('#weather-icon');
const tempValue = $('#temp-value');
const tempUnit = $('#temp-unit');
const weatherDesc = $('#weather-desc');

const placeEl = $('#place');
const localTimeEl = $('#local-time');
const humidityEl = $('#humidity');
const windEl = $('#wind');
const pressureEl = $('#pressure');
const sunriseEl = $('#sunrise');
const sunsetEl = $('#sunset');

const hourlyScroll = $('#hourly-scroll');
const dailyGrid = $('#daily-grid');
const statusEl = $('#status');
const bgLayer = $('#bg-layer');
const locationShort = $('#location-short');

// =========================
// STATE
// =========================
let state = {
  unit: localStorage.getItem('pw_unit') || 'metric', // metric or imperial
  theme: localStorage.getItem('pw_theme') || 'light', // light or dark
  lastPlace: null,
  timezoneOffset: 0, // seconds offset from UTC for displayed location
};

// apply saved prefs
applyTheme(state.theme);
applyUnitLabel();

// =========================
// HELPERS
// =========================
function formatTemp(v) {
  return Math.round(v);
}

function timeFromUnix(unixSec, tzOffsetSeconds, opts) {
  // returns a localized time string for the given tz offset
  const d = new Date((unixSec + tzOffsetSeconds) * 1000);
  // default options
  return d.toLocaleTimeString([], opts || { hour: '2-digit', minute: '2-digit' });
}

function dateFromUnix(unixSec, tzOffsetSeconds, opts) {
  const d = new Date((unixSec + tzOffsetSeconds) * 1000);
  return d.toLocaleString([], opts || { weekday: 'short', month: 'short', day: 'numeric' });
}

function localDateTimeString(tzOffsetSeconds) {
  const d = new Date(Date.now() + tzOffsetSeconds * 1000);
  return d.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff6b6b' : '';
}

// small helper to clear children
function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// =========================
// API CALLS
// =========================

/**
 * Fetch coords using city name (weather endpoint).
 * Returns {lat, lon, name, country}
 */
async function fetchCoordsByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  const data = await res.json();
  return {
    lat: data.coord.lat,
    lon: data.coord.lon,
    name: data.name,
    country: data.sys.country
  };
}

/**
 * OneCall fetch: current, hourly, daily
 * Excludes minutely and alerts to reduce payload
 */
async function fetchWeatherOneCall(lat, lon, units = 'metric') {
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely,alerts&appid=${OPENWEATHER_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Weather fetch failed: ' + txt);
  }
  return res.json();
}

// =========================
// RENDERING
// =========================

function applyUnitLabel() {
  tempUnit.textContent = state.unit === 'metric' ? '°C' : '°F';
  unitToggle.textContent = state.unit === 'metric' ? '°C / °F' : '°F / °C';
  localStorage.setItem('pw_unit', state.unit);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Dark';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = 'Light';
  }
  state.theme = theme;
  localStorage.setItem('pw_theme', theme);
}

/**
 * Update main current weather UI
 */
function renderCurrent(onecall, placeName = '', country = '') {
  // onecall.current has current data
  const cur = onecall.current;
  state.timezoneOffset = onecall.timezone_offset || 0;

  // temperature
  tempValue.textContent = formatTemp(cur.temp);
  tempUnit.textContent = state.unit === 'metric' ? '°C' : '°F';

  // description and icon
  const weather = cur.weather[0];
  weatherDesc.textContent = weather.description || '';
  weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
  weatherIcon.alt = weather.description || 'weather';

  // place and local time
  placeEl.textContent = placeName ? `${placeName}, ${country || ''}` : onecall.timezone || '—';
  locationShort.textContent = placeName ? `${placeName}` : onecall.timezone || '—';
  localTimeEl.textContent = localDateTimeString(state.timezoneOffset);

  // meta
  humidityEl.textContent = `${cur.humidity}%`;
  windEl.textContent = `${cur.wind_speed} ${state.unit === 'metric' ? 'm/s' : 'mph'}`;
  pressureEl.textContent = `${cur.pressure} hPa`;

  // sunrise/sunset in local time
  sunriseEl.textContent = timeFromUnix(cur.sunrise, state.timezoneOffset);
  sunsetEl.textContent = timeFromUnix(cur.sunset, state.timezoneOffset);

  // animated background based on weather main
  updateBackground(weather.main.toLowerCase());
}

/**
 * Render hourly cards (next 24 hours)
 */
function renderHourly(onecall) {
  clear(hourlyScroll);
  const hours = onecall.hourly.slice(0, 24); // 24 hours
  hours.forEach(hour => {
    const card = document.createElement('div');
    card.className = 'hour-card';

    const t = timeFromUnix(hour.dt, state.timezoneOffset, { hour: '2-digit', minute: '2-digit' });
    const temp = `${formatTemp(hour.temp)}°`;
    const pop = Math.round((hour.pop || 0) * 100); // precipitation probability
    const icon = hour.weather && hour.weather[0] ? hour.weather[0].icon : '01d';

    card.innerHTML = `
      <div class="hour-time">${t}</div>
      <div style="margin:6px 0"><img src="https://openweathermap.org/img/wn/${icon}.png" alt="" width="40" height="40"></div>
      <div class="hour-temp">${temp}</div>
      <div style="color:var(--muted);font-size:12px;margin-top:6px">${pop}% rain</div>
    `;
    hourlyScroll.appendChild(card);
  });
}

/**
 * Render daily forecast (5 days)
 */
function renderDaily(onecall) {
  clear(dailyGrid);
  // use daily; skip the current day index 0 and show next 5
  const days = onecall.daily.slice(1, 6);
  days.forEach(d => {
    const date = dateFromUnix(d.dt, state.timezoneOffset, { weekday: 'short', month: 'short', day: 'numeric' });
    const icon = d.weather && d.weather[0] ? d.weather[0].icon : '01d';
    const min = formatTemp(d.temp.min);
    const max = formatTemp(d.temp.max);
    const pop = Math.round((d.pop || 0) * 100);

    const el = document.createElement('div');
    el.className = 'day-card';
    el.innerHTML = `
      <div style="font-size:13px;color:var(--muted)">${date}</div>
      <div style="margin:10px 0"><img src="https://openweathermap.org/img/wn/${icon}.png" alt="" width="48" height="48"></div>
      <div style="font-weight:700">${max}° / ${min}°</div>
      <div style="color:var(--muted);font-size:12px;margin-top:6px">${pop}% chance</div>
    `;
    dailyGrid.appendChild(el);
  });
}

// =========================
// BACKGROUND ANIMATIONS
// Create/clear nodes in the bgLayer element based on weather.
// Keep animations lightweight for mobile.
// =========================
function clearBackground() {
  clear(bgLayer);
  bgLayer.style.opacity = '0';
  // small fade-out
  setTimeout(() => { bgLayer.innerHTML = ''; }, 300);
}

function updateBackground(condition) {
  // condition is something like 'rain', 'clouds', 'snow', 'clear', 'thunderstorm', etc.
  clearBackground();
  bgLayer.style.opacity = '1';

  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunder')) {
    // create a moving cloud and falling raindrops
    const cloud = document.createElement('div');
    cloud.className = 'bg-cloud';
    cloud.style.top = '6%';
    cloud.style.left = '-10%';
    bgLayer.appendChild(cloud);

    // raindrops
    const count = 40; // keep it reasonable for performance
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      const left = Math.random() * 100;
      const delay = Math.random() * -10;
      const dur = 0.9 + Math.random() * 0.8;
      drop.style.left = `${left}%`;
      drop.style.top = `${-Math.random() * 60}%`;
      drop.style.height = `${8 + Math.random() * 12}px`;
      drop.style.opacity = `${0.3 + Math.random() * 0.7}`;
      drop.style.animationDuration = `${dur}s`;
      drop.style.animationDelay = `${delay}s`;
      bgLayer.appendChild(drop);
    }
  } else if (condition.includes('snow')) {
    // snow flakes
    const count = 28;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'snow';
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${-Math.random() * 40}%`;
      s.style.width = `${4 + Math.random() * 8}px`;
      s.style.height = s.style.width;
      s.style.opacity = `${0.5 + Math.random() * 0.6}`;
      s.style.animationDuration = `${6 + Math.random() * 8}s`;
      s.style.animationDelay = `${-Math.random() * 10}s`;
      bgLayer.appendChild(s);
    }
    // soft cloud
    const cloud = document.createElement('div');
    cloud.className = 'bg-cloud';
    cloud.style.top = '6%';
    cloud.style.left = '-5%';
    bgLayer.appendChild(cloud);
  } else if (condition.includes('cloud')) {
    // more clouds for cloudy
    const c1 = document.createElement('div');
    c1.className = 'bg-cloud';
    c1.style.top = '8%';
    c1.style.left = '-8%';
    c1.style.opacity = '0.95';
    c1.style.filter = 'blur(12px)';
    bgLayer.appendChild(c1);

    const c2 = document.createElement('div');
    c2.className = 'bg-cloud';
    c2.style.top = '26%';
    c2.style.left = '-18%';
    c2.style.opacity = '0.75';
    c2.style.height = '100px';
    bgLayer.appendChild(c2);
  } else {
    // clear/clear-day -> warm sun glow
    const sun = document.createElement('div');
    sun.className = 'bg-sun';
    bgLayer.appendChild(sun);

    // tiny drifting cloud
    const cloud = document.createElement('div');
    cloud.className = 'bg-cloud';
    cloud.style.top = '18%';
    cloud.style.left = '-6%';
    cloud.style.opacity = '0.22';
    cloud.style.filter = 'blur(20px)';
    cloud.style.height = '110px';
    bgLayer.appendChild(cloud);
  }
}

// =========================
// MAIN FLOW
// =========================

async function loadWeatherByCoords(lat, lon, placeName = '', country = '') {
  try {
    setStatus('Loading weather...', false);
    const onecall = await fetchWeatherOneCall(lat, lon, state.unit);
    // animate updates: simple fade
    app.animate([{ opacity: 0.92 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });

    renderCurrent(onecall, placeName, country);
    renderHourly(onecall);
    renderDaily(onecall);
    setStatus(`Updated: ${localDateTimeString(state.timezoneOffset)}`, false);
    state.lastPlace = { lat, lon, name: placeName, country };
  } catch (err) {
    console.error(err);
    setStatus('Failed to load weather. Check API key or network.', true);
  }
}

// Search by city name
async function handleSearchCity(city) {
  if (!city) {
    setStatus('Please enter a city name.', true);
    return;
  }
  try {
    setStatus('Looking up city...');
    const coords = await fetchCoordsByCity(city);
    await loadWeatherByCoords(coords.lat, coords.lon, coords.name, coords.country);
  } catch (err) {
    setStatus(err.message || 'City not found', true);
  }
}

// Geolocation flow
function initGeolocation() {
  if (!navigator.geolocation) {
    setStatus('Geolocation not available. Use search.', true);
    // fallback to a default city
    handleSearchCity('Johannesburg');
    return;
  }

  setStatus('Requesting location...');
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    // reverse quick city fetch using weather endpoint to get name
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const name = data.name || '';
      const country = (data.sys && data.sys.country) ? data.sys.country : '';
      await loadWeatherByCoords(lat, lon, name, country);
    } catch (err) {
      // still try onecall
      await loadWeatherByCoords(lat, lon, '', '');
    }
  }, err => {
    console.warn('Geolocation failed', err);
    setStatus('Location denied or unavailable. Use search.', true);
    // fallback city
    handleSearchCity('Johannesburg');
  }, { timeout: 8000, maximumAge: 1000 * 60 * 10 });
}

// =========================
// Event listeners
// =========================
searchBtn.addEventListener('click', () => {
  const q = searchInput.value.trim();
  handleSearchCity(q);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSearchCity(searchInput.value.trim());
  }
});

unitToggle.addEventListener('click', async () => {
  state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
  applyUnitLabel();
  // reload last place if exists
  if (state.lastPlace) {
    await loadWeatherByCoords(state.lastPlace.lat, state.lastPlace.lon, state.lastPlace.name, state.lastPlace.country);
  }
});

themeToggle.addEventListener('click', () => {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
});

// init
(function init() {
  // set initial UI text
  setStatus('Initializing...');
  // apply theme from saved state
  applyTheme(state.theme);

  // try geolocation first
  initGeolocation();
})();

// --- PWA: register service worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch(err => console.warn('SW failed', err));
  });
}

// --- Settings panel ---
const settingsPanel = document.getElementById('settings-panel');
const settingsToggle = document.getElementById('settings-toggle');
const settingsClose = document.getElementById('settings-close');

const settingsTheme = document.getElementById('settings-theme');
const settingsUnit = document.getElementById('settings-unit');
const settingsForecast = document.getElementById('settings-forecast');
const settingsAnimations = document.getElementById('settings-animations');

// open panel
settingsToggle.addEventListener('click', () => {
  settingsPanel.style.display = 'block';
  settingsTheme.value = state.theme;
  settingsUnit.value = state.unit;
  settingsForecast.value = 'hourly'; // default
  settingsAnimations.value = state.animations || 'on';
});

// close panel
settingsClose.addEventListener('click', () => settingsPanel.style.display = 'none');

// apply settings changes
settingsTheme.addEventListener('change', () => {
  applyTheme(settingsTheme.value);
});
settingsUnit.addEventListener('change', async () => {
  state.unit = settingsUnit.value;
  applyUnitLabel();
  if(state.lastPlace) await loadWeatherByCoords(state.lastPlace.lat,state.lastPlace.lon,state.lastPlace.name,state.lastPlace.country);
});
settingsAnimations.addEventListener('change', () => {
  state.animations = settingsAnimations.value;
  if(!state.animations) clearBackground();
});

