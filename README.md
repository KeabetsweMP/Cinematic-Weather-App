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
Weather Now - Upgraded
Copy the folder to a web server or open index.html in a browser.
(For geolocation and service worker features, serve over localhost or a web server.)

When opening the app for the first time, you will be prompted to enter your OpenWeatherMap API key.

Once entered, it is saved in your browser’s localStorage.

Click "Use my location" or enter a city and click Search to view the weather.

##Features##

Automatic geolocation detection

Dynamic, cinematic backgrounds based on temperature

Units toggle (°C / °F) persisted in localStorage

Animated weather icons (day/night)

Weather effects (rain, snow, clouds, storm circles)

Extra info: feels like, humidity, wind

Small chart for upcoming temperatures (Chart.js via CDN)

PWA manifest and a simple service worker for offline caching

Loading spinner and disabled controls while fetching

Inline message area instead of alert popups

##Notes##

Keep your API key secret; do not commit it to public repos.

Service worker caches core files; avoid caching API responses without careful versioning.

The app now prompts for your API key automatically on first load for easier deployment.

Credits
Powered by WeatherMap (OpenWeatherMap)

Animated icons via LottieFiles

Powered by WeatherMap (OpenWeatherMap)

Animated icons via LottieFiles
