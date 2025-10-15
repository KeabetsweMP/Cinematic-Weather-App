// ---- CONFIG ----
const API_BASE = 'https://api.openweathermap.org/data/2.5';
let apiKey = localStorage.getItem('owm_api_key');

// ---- PROMPT FOR API KEY IF MISSING ----
if(!apiKey){
    apiKey = prompt("Enter your OpenWeatherMap API Key:");
    if(apiKey){
        localStorage.setItem('owm_api_key', apiKey);
    } else {
        alert("API Key is required to fetch weather.");
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

// ---- HELPERS ----
function kelvinToC(kelvin) { return Math.round(kelvin - 273.15); }
function kelvinToF(kelvin) { return Math.round((kelvin - 273.15) * 9/5 + 32); }

function getBackgroundColor(tempC) {
  if(tempC <= 0) return '#74b9ff';       // cold
  if(tempC <= 15) return '#55efc4';      // cool
  if(tempC <= 25) return '#ffeaa7';      // mild
  if(tempC <= 35) return '#fab1a0';      // hot
  return '#e17055';                      // very hot
}

function getLottieIcon(weather, isDay) {
  weather = weather.toLowerCase();
  if(weather.includes('cloud')) return isDay ? 'https://assets10.lottiefiles.com/packages/lf20_q5pk6p1k.json' : 'https://assets10.lottiefiles.com/packages/lf20_s8o3je.json';
  if(weather.includes('rain') || weather.includes('drizzle')) return 'https://assets10.lottiefiles.com/packages/lf20_j1adxtyb.json';
  if(weather.includes('snow')) return 'https://assets10.lottiefiles.com/packages/lf20_vfxyjl6b.json';
  if(weather.includes('thunder')) return 'https://assets10.lottiefiles.com/packages/lf20_ktwnwv5m.json';
  return isDay ? 'https://assets10.lottiefiles.com/packages/lf20_bfO4yL.json' : 'https://assets10.lottiefiles.com/packages/lf20_cu4m6smv.json';
}

function setWeatherEffects(weather) {
  effectsDiv.innerHTML = '';
  weather = weather.toLowerCase();
  if(weather.includes('rain') || weather.includes('drizzle')){
    for(let i=0;i<30;i++){
      const drop = document.createElement('div');
      drop.className='drop';
      drop.style.left = Math.random()*100+'%';
      drop.style.animationDelay = Math.random()*2+'s';
      effectsDiv.appendChild(drop);
    }
  }
  if(weather.includes('snow')){
    for(let i=0;i<20;i++){
      const flake = document.createElement('div');
      flake.className='flake';
      flake.style.left = Math.random()*100+'%';
      flake.style.animationDelay = Math.random()*3+'s';
      effectsDiv.appendChild(flake);
    }
  }
}

// ---- FETCH WEATHER ----
async function fetchWeather(lat, lon) {
  if(!apiKey) return; // stop if no key

  const url = `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const res = await fetch(url);
    if(!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();

    const tempC = kelvinToC(data.main.temp);
    const feelsC = kelvinToC(data.main.feels_like);
    const isDay = data.dt > data.sys.sunrise && data.dt < data.sys.sunset;

    // update UI
    cityEl.textContent = data.name;
    tempEl.textContent = `${tempC}°C`;
    descEl.textContent = data.weather[0].description;
    feelsEl.textContent = `${feelsC}°C`;
    humidityEl.textContent = `${data.main.humidity}%`;
    windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    weatherBg.style.background = getBackgroundColor(tempC);
    weatherIcon.load(getLottieIcon(data.weather[0].main, isDay));
    setWeatherEffects(data.weather[0].main);

  } catch(err){
    console.error(err);
    cityEl.textContent = 'Unable to get weather';
    tempEl.textContent = '--°C';
    descEl.textContent = '---';
  }
}

// ---- GEOLOCATION ----
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeather(pos.coords.latitude, pos.coords.longitude);
  }, err => {
    cityEl.textContent = 'Location denied';
  });
}else{
  cityEl.textContent = 'Geolocation not supported';
}
