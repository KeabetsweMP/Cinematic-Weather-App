// ---- CONFIG ----
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// Default key (you can replace this with your own)
const DEFAULT_API_KEY = '4b6e4a4c6db6a6e6f9b41f55d26a7e91'; // example fallback key
let apiKey = localStorage.getItem('owm_api_key') || DEFAULT_API_KEY;

// Ask user if they want to add their own API key
if (!localStorage.getItem('owm_api_key')) {
  const useOwn = confirm("Would you like to use your own OpenWeatherMap API Key?");
  if (useOwn) {
    apiKey = prompt("Enter your OpenWeatherMap API Key:");
    if (apiKey && apiKey.trim() !== '') {
      localStorage.setItem('owm_api_key', apiKey.trim());
    } else {
      apiKey = DEFAULT_API_KEY;
    }
  }
}

// ---- SELECTORS ----
const cityEl = document.querySelector('.city');
const tempEl = document.querySelector('.temp');
const descEl = document.querySelector('.description');
const feelsEl = document.querySelector('.feels-like');
const humidityEl = document.querySelector('.humidity');
const windEl = document.querySelector('.wind');
const weatherIcon = document.getElementById('weather-icon');
const weatherBg = document.querySelector('.weather-bg');
const effectsDiv = document.getElementById('weather-effects');
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

// ---- HELPERS ----
function kelvinToC(k) { return Math.round(k - 273.15); }

function getBackgroundColor(tempC) {
  if (tempC <= 0) return '#74b9ff';
  if (tempC <= 15) return '#55efc4';
  if (tempC <= 25) return '#ffeaa7';
  if (tempC <= 35) return '#fab1a0';
  return '#e17055';
}

function getLottieIcon(weather, isDay) {
  weather = weather.toLowerCase();
  if (weather.includes('cloud')) return isDay ? 'https://assets10.lottiefiles.com/packages/lf20_q5pk6p1k.json' : 'https://assets10.lottiefiles.com/packages/lf20_s8o3je.json';
  if (weather.includes('rain') || weather.includes('drizzle')) return 'https://assets10.lottiefiles.com/packages/lf20_j1adxtyb.json';
  if (weather.includes('snow')) return 'https://assets10.lottiefiles.com/packages/lf20_vfxyjl6b.json';
  if (weather.includes('thunder')) return 'https://assets10.lottiefiles.com/packages/lf20_ktwnwv5m.json';
  return isDay ? 'https://assets10.lottiefiles.com/packages/lf20_bfO4yL.json' : 'https://assets10.lottiefiles.com/packages/lf20_cu4m6smv.json';
}

function setWeatherEffects(weather) {
  effectsDiv.innerHTML = '';
  weather = weather.toLowerCase();
  if (weather.includes('rain') || weather.includes('drizzle')) {
    for (let i = 0; i < 30; i++) {
      const drop = document.createElement('div');
      drop.className = 'drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDelay = Math.random() * 2 + 's';
      effectsDiv.appendChild(drop);
    }
  }
  if (weather.includes('snow')) {
    for (let i = 0; i < 20; i++) {
      const flake = document.createElement('div');
      flake.className = 'flake';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.animationDelay = Math.random() * 3 + 's';
      effectsDiv.appendChild(flake);
    }
  }
}

// ---- FETCH WEATHER ----
async function fetchWeather(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();

    const tempC = kelvinToC(data.main.temp);
    const feelsC = kelvinToC(data.main.feels_like);
    const isDay = data.dt > data.sys.sunrise && data.dt < data.sys.sunset;

    cityEl.textContent = data.name;
    tempEl.textContent = `${tempC}°C`;
    descEl.textContent = data.weather[0].description;
    feelsEl.textContent = `${feelsC}°C`;
    humidityEl.textContent = `${data.main.humidity}%`;
    windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    weatherBg.style.background = getBackgroundColor(tempC);
    weatherIcon.load(getLottieIcon(data.weather[0].main, isDay));
    setWeatherEffects(data.weather[0].main);

  } catch (err) {
    console.error(err);
    cityEl.textContent = 'Unable to get weather';
    tempEl.textContent = '--°C';
    descEl.textContent = '---';
  }
}

async function fetchWeatherByCity(city) {
  const url = `${API_BASE}/weather?q=${city}&appid=${apiKey}`;
  localStorage.setItem('last_city', city);
  await fetchWeather(url);
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  await fetchWeather(url);
}

// ---- INITIAL LOAD ----
const lastCity = localStorage.getItem('last_city');
if (lastCity) {
  fetchWeatherByCity(lastCity);
} else if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
  }, () => {
    cityEl.textContent = 'Location denied';
  });
} else {
  cityEl.textContent = 'Geolocation not supported';
}

// ---- SEARCH ----
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
    cityInput.value = '';
  }
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchBtn.click();
});
