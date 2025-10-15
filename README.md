# Weather Now - Cinematic Upgrade

This web app shows current weather with a short hourly forecast using OpenWeatherMap.

## Features
- **Cinematic weather card** with dynamic blur and shadow.
- **Dynamic background gradient** based on temperature and day/night.
- **Animated Lottie icons** for weather conditions.
- **Weather effects**: rain, snow, thunder/storm circles.
- **Extras displayed**: feels-like, humidity, wind.
- **Units toggle (°C / °F)** persisted to localStorage.
- **Loading spinner and disabled controls** while fetching.
- **Geolocation support** for auto-detecting your location.
- **PWA-ready** with a service worker for offline caching.

## Quick Start
1. Copy the folder to a web server or open `index.html` in a browser (for geolocation and service worker features, serve over localhost/https).
2. Click "Set API Key" and paste your OpenWeatherMap API key.
3. The app will auto-detect your location and display weather.
4. Optionally, enter a city manually to search.

## Notes
- Keep your API key secret; do not commit it to public repos.
- Service worker caches core files; avoid caching API responses without careful versioning.
- Powered by [WeatherMap](https://openweathermap.org/).
