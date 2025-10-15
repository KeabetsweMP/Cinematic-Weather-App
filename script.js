const API_BASE = 'https://api.openweathermap.org/data/2.5';
let apiKey = localStorage.getItem('own_api_key') || 'YOUR_API_KEY';

const cityEl = document.querySelector('.city');
const tempEl = document.querySelector('.temp');
const descEl = document.querySelector('.description');
const feelsEl = document.querySelector('.feels-like');
const humidityEl = document.querySelector('.humidity');
const windEl = document.querySelector('.wind');
const weatherIcon = document.getElementById('weather-icon');
const weatherBg = document.querySelector('.weather-bg');
const effectsDiv = document.getElementById('weather-effects');

function kelvinToC(kelvin) { return Math.round(kelvin - 273.15); }

function getLottieIcon(weather, isDay) {
  weather = weather.toLowerCase();
  if(weather.includes('cloud')) return isDay ? 'https://assets10.lottiefiles.com/packages/lf20_q5pk6p1k.json' : 'https://assets10.lottiefiles.com/packages/lf20_s8o3je.json';
  if(weather.includes('rain') || weather.includes('drizzle')) return 'https://assets10.lottiefiles.com/packages/lf20_j1adxtyb.json';
  if(weather.includes('snow')) return 'https://assets10.lottiefiles.com/packages/lf20_vfxyjl6b.json';
  if(weather.includes('thunder')) return 'https://assets10.lottiefiles.com/packages/lf20_ktwnwv5m.json';
  return isDay ? 'https://assets10.lottiefiles.com/packages/lf20_bfO4yL.json' : 'https://assets10.lottiefiles.com/packages/lf20_cu4m6smv.json';
}

function setWeatherEffects(weather){
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
  if(weather.includes('thunder') || weather.includes('storm')){
    for(let i=0;i<15;i++){
      const circle = document.createElement('div');
      circle.className='effect-circle';
      circle.style.left=Math.random()*100+'%';
      circle.style.top=Math.random()*80+'%';
      circle.style.animationDelay=Math.random()*2+'s';
      effectsDiv.appendChild(circle);
    }
  }
}

function getSkyGradient(tempC, isDay){
  if(!isDay) return 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)'; // night gradient
  if(tempC <= 0) return 'linear-gradient(to bottom, #74b9ff, #a29bfe)';
  if(tempC <= 15) return 'linear-gradient(to bottom, #55efc4, #81ecec)';
  if(tempC <= 25) return 'linear-gradient(to bottom, #ffeaa7, #fab1a0)';
  if(tempC <= 35) return 'linear-gradient(to bottom, #fab1a0, #e17055)';
  return 'linear-gradient(to bottom, #e17055, #d63031)';
}

async function fetchWeather(lat, lon){
  const url = `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();

    const tempC = kelvinToC(data.main.temp);
    const feelsC = kelvinToC(data.main.feels_like);
    const isDay = data.dt > data.sys.sunrise && data.dt < data.sys.sunset;

    cityEl.textContent = data.name;
    tempEl.textContent = `${tempC}°C`;
    descEl.textContent = data.weather[0].description;
    feelsEl.textContent = `${feelsC}°C`;
    humidityEl.textContent = `${data.main.humidity}%`;
    windEl.textContent = `${Math.round(data.wind.speed*3.6)} km/h`;

    weatherBg.style.background = getSkyGradient(tempC, isDay);
    weatherIcon.load(getLottieIcon(data.weather[0].main, isDay));
    setWeatherEffects(data.weather[0].main);

  } catch(err){
    console.error(err);
    cityEl.textContent = 'Unable to get weather';
    tempEl.textContent = '--°C';
    descEl.textContent = '---';
  }
}

if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeather(pos.coords.latitude, pos.coords.longitude);
  }, err => {
    cityEl.textContent = 'Location denied';
  });
}else{
  cityEl.textContent = 'Geolocation not supported';
}

