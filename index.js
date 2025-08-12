let debounceTimer;

class WeatherApp {
  constructor() {
    this.apiKey = "945b0e63cb828d5c40303cadf5ed6aab";
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
    this.history = [];
    this.selectedIndex = -1;
  }

  async getWeather(city) {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric&lang=fr`
      );

      if (!response.ok) {
        throw new Error("Ville non trouvée");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  }

  async getWeatherByCoords(lat, lon) {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=fr`
      );

      if (!response.ok) {
        throw new Error("Erreur de récupération des données");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  }

  getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n'est pas supportée"));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  async getCurrentLocationWeather() {
    const position = await this.getPosition();
    const { latitude, longitude } = position.coords;
    return await this.getWeatherByCoords(latitude, longitude);
  }

  async searchCities(query) {
    if (query.length < 2) return [];

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          query
        )}&limit=8&appid=${this.apiKey}`
      );

      if (!response.ok) return [];

      const cities = await response.json();

      // Formatter les résultats pour avoir un format uniforme
      return cities.map((city) => ({
        name: city.name,
        country: city.country,
        state: city.state,
        lat: city.lat,
        lon: city.lon,
        displayName: city.state
          ? `${city.name}, ${city.state}, ${city.country}`
          : `${city.name}, ${city.country}`,
      }));
    } catch (error) {
      console.error("Erreur lors de la recherche de villes:", error);
      return [];
    }
  }
}

// Instance de l'app
const app = new WeatherApp();

// Fonction pour afficher la météo avec animation
function displayWeather(data) {
  // Ajouter la classe d'animation de transition
  const mainPanel = document.querySelector(".main-panel");
  mainPanel.classList.add("weather-transition");

  // Retirer la classe après l'animation
  setTimeout(() => {
    mainPanel.classList.remove("weather-transition");
  }, 600);

  // Panneau principal
  const weatherResult = document.getElementById("weather-result");
  const weatherIcon = getWeatherIcon(data.weather[0].main);

  weatherResult.innerHTML = `
    <div class="temperature-display">
        <div class="temperature">${Math.round(data.main.temp)}<sup>°</sup></div>
        <div class="city-name">${data.name}</div>
        <div class="weather-description">
            <span class="weather-icon">${weatherIcon}</span>
            <span>${data.weather[0].description}</span>
        </div>
        <div class="date-time">${new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</div>
    </div>
  `;

  // Détails météo
  document.getElementById("feels-like").textContent = `${Math.round(
    data.main.feels_like
  )}°C`;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("wind").textContent = `${Math.round(
    data.wind.speed * 3.6
  )} km/h`;
  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;

  // Changer la couleur de fond selon la météo
  updateBackground(data.weather[0].main);
  updateMainPanel(data.weather[0].main);
}

// Obtenir l'icône météo avec Phosphor Icons
function getWeatherIcon(weatherMain) {
  const icons = {
    Clear: '<i class="ph-fill ph-sun"></i>',
    Clouds: '<i class="ph-fill ph-cloud"></i>',
    Rain: '<i class="ph-fill ph-cloud-rain"></i>',
    Drizzle: '<i class="ph-fill ph-drop-half"></i>',
    Thunderstorm: '<i class="ph-fill ph-lightning"></i>',
    Snow: '<i class="ph-fill ph-snowflake"></i>',
    Mist: '<i class="ph-fill ph-waves"></i>',
    Fog: '<i class="ph-fill ph-waves"></i>',
    Haze: '<i class="ph-fill ph-waves"></i>',
  };
  return icons[weatherMain] || '<i class="ph-fill ph-cloud-sun"></i>';
}

// Mettre à jour le fond selon la météo
function updateBackground(weatherMain) {
  const body = document.body;
  const backgrounds = {
    Clear: "#8ab4deff",
    Clouds: "#86b8d8ff",
    Rain: "#757a7fff ",
    Snow: "#787879ff",
    Thunderstorm: "#2b2b39ff",
    default: "#1e3c72",
  };
  body.style.background = backgrounds[weatherMain] || backgrounds.default;
  body.style.transition = "background 0.5s ease";
}

function updateMainPanel(weatherMain) {
  const mainPanel = document.querySelector(".main-panel");

  const backgrounds = {
    Clear: 'url("./images/clear-sky.jpg")',
    Clouds: 'url("./images/cloudy-sky.jpg")',
    Rain: 'url("./images/rainy-sky.jpg")',
    Snow: 'url("./images/snowy-sky.jpg")',
    Thunderstorm: 'url("./images/thunderstorm-sky.jpg")',
    default: 'url("./images/default-sky.jpg")',
  };
  const textColors = {
    Clear: "#d5ebf7ff",
    Clouds: "#607c8cff",
    Rain: "#E1F5FE",
    Snow: "#626363ff",
    Thunderstorm: "#E6E6FA",
    default: "#FFFFFF",
  };

  mainPanel.style.background = `
    linear-gradient(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.5)),
    ${backgrounds[weatherMain] || backgrounds.default}
  `;
  mainPanel.style.backgroundSize = "cover";
  mainPanel.style.backgroundPosition = "center";
  mainPanel.style.backgroundRepeat = "no-repeat";
  mainPanel.style.transition = "background 0.5s ease";

  const color = textColors[weatherMain] || textColors.default;

  // Appliquer la couleur à tous les éléments texte
  const textElements = mainPanel.querySelectorAll(
    ".temperature, .city-name, .weather-description, .date-time"
  );
  textElements.forEach((element) => {
    element.style.color = color;
  });
}

// Fonction d'autocomplétion avec API
function setupAutocomplete() {
  const input = document.getElementById("city-input");
  const autocompleteList = document.getElementById("autocomplete-list");

  input.addEventListener("input", async function () {
    const value = this.value.trim();
    app.selectedIndex = -1;

    // Clear previous timer
    clearTimeout(debounceTimer);

    if (value.length < 2) {
      autocompleteList.classList.remove("active");
      return;
    }

    // Afficher un indicateur de chargement
    autocompleteList.innerHTML =
      '<div class="autocomplete-item">Recherche...</div>';
    autocompleteList.classList.add("active");

    // Debounce pour éviter trop d'appels API
    debounceTimer = setTimeout(async () => {
      const cities = await app.searchCities(value);

      if (cities.length === 0) {
        autocompleteList.innerHTML =
          '<div class="autocomplete-item">Aucune ville trouvée</div>';
        setTimeout(() => {
          autocompleteList.classList.remove("active");
        }, 2000);
        return;
      }

      autocompleteList.innerHTML = "";
      cities.forEach((city, index) => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.innerHTML = city.state
          ? `${city.name}<span class="country">${city.state}, ${city.country}</span>`
          : `${city.name}<span class="country">${city.country}</span>`;

        item.addEventListener("click", function () {
          input.value = city.name;
          autocompleteList.classList.remove("active");
          searchWeatherByCoords(city.lat, city.lon, city.name);
        });
        autocompleteList.appendChild(item);
      });
    }, 300); // Attendre 300ms avant de faire l'appel API
  });

  // Navigation au clavier
  input.addEventListener("keydown", function (e) {
    const items = autocompleteList.querySelectorAll(
      ".autocomplete-item:not(:first-child)"
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      app.selectedIndex = Math.min(app.selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      app.selectedIndex = Math.max(app.selectedIndex - 1, -1);
      updateSelection(items);
    } else if (e.key === "Enter" && app.selectedIndex >= 0) {
      e.preventDefault();
      items[app.selectedIndex].click();
    } else if (e.key === "Escape") {
      autocompleteList.classList.remove("active");
      app.selectedIndex = -1;
    }
  });

  // Fermer l'autocomplétion quand on clique ailleurs
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-container")) {
      autocompleteList.classList.remove("active");
    }
  });
}

// Nouvelle fonction pour rechercher par coordonnées (plus précis)
async function searchWeatherByCoords(lat, lon, cityName) {
  const button = document.getElementById("search-button");
  button.innerHTML = '<span class="loading"></span>';
  button.disabled = true;

  try {
    const data = await app.getWeatherByCoords(lat, lon);
    // Garder le nom de ville de l'autocomplétion si disponible
    if (cityName) {
      data.name = cityName;
    }
    displayWeather(data);
    document.getElementById("city-input").value = "";
    document.getElementById("autocomplete-list").classList.remove("active");
  } catch (error) {
    displayError("Erreur lors de la récupération des données météo.");
  } finally {
    button.innerHTML = '<i class="ph ph-magnifying-glass"></i>';
    button.disabled = false;
  }
}

function updateSelection(items) {
  items.forEach((item, index) => {
    if (index === app.selectedIndex) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  });
}

// Afficher une erreur
function displayError(message) {
  const weatherResult = document.getElementById("weather-result");
  weatherResult.innerHTML = `
    <div class="error-message">
        <i class="ph ph-warning-circle"></i> ${message}
    </div>
  `;
}

// Recherche de ville
async function searchWeather() {
  const city = document.getElementById("city-input").value.trim();
  if (!city) return;

  const button = document.getElementById("search-button");
  button.innerHTML = '<span class="loading"></span>';
  button.disabled = true;

  try {
    const data = await app.getWeather(city);
    displayWeather(data);
    document.getElementById("city-input").value = "";
    document.getElementById("autocomplete-list").classList.remove("active");
  } catch (error) {
    displayError("Ville non trouvée. Veuillez réessayer.");
  } finally {
    button.innerHTML = '<i class="ph ph-magnifying-glass"></i>';
    button.disabled = false;
  }
}

// Event listeners
document
  .getElementById("search-button")
  .addEventListener("click", searchWeather);

document.getElementById("city-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && app.selectedIndex === -1) {
    searchWeather();
  }
});

// Villes populaires
document.querySelectorAll(".city-list li").forEach((item) => {
  item.addEventListener("click", async () => {
    const city = item.dataset.city;
    document.getElementById("city-input").value = city;
    await searchWeather();
  });
});

// Géolocalisation
document.getElementById("geo-button").addEventListener("click", async () => {
  const button = document.getElementById("geo-button");
  button.innerHTML = '<i class="ph ph-circle-notch"></i> Localisation...';
  button.disabled = true;

  try {
    const data = await app.getCurrentLocationWeather();
    displayWeather(data);
  } catch (error) {
    displayError("Impossible de récupérer votre position");
  } finally {
    button.innerHTML = '<i class="ph ph-map-pin"></i> Ma position actuelle';
    button.disabled = false;
  }
});

// Initialisation
window.addEventListener("load", async () => {
  // Initialiser l'autocomplétion
  setupAutocomplete();

  // Charger Paris par défaut
  try {
    const data = await app.getWeather("Paris");
    displayWeather(data);
  } catch (error) {
    console.error("Erreur au chargement initial");
  }
});
