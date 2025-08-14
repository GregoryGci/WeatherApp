// =============================================================================
// WEATHER APP - APPLICATION MÉTÉO INTERACTIVE
// =============================================================================

let debounceTimer;

// =============================================================================
// SECTION 1: CLASSE PRINCIPALE ET CONFIGURATION
// =============================================================================

class WeatherApp {
  constructor() {
    this.apiKey = "945b0e63cb828d5c40303cadf5ed6aab";
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
    this.selectedIndex = -1;
  }

  // Récupérer la météo par nom de ville
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

  // Récupérer la météo par coordonnées
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

  // Obtenir la position de l'utilisateur
  getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n'est pas supportée"));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  // Récupérer la météo de la position actuelle
  async getCurrentLocationWeather() {
    const position = await this.getPosition();
    const { latitude, longitude } = position.coords;
    return await this.getWeatherByCoords(latitude, longitude);
  }

  // Rechercher des villes via API
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

// Instance globale de l'application
const app = new WeatherApp();

// =============================================================================
// SECTION 2: FONCTIONS UTILITAIRES
// =============================================================================

// Obtenir l'icône météo correspondant à la condition
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

// Afficher un message d'erreur
function displayError(message) {
  const weatherResult = document.getElementById("weather-result");
  weatherResult.innerHTML = `
    <div class="error-message">
        <i class="ph ph-warning-circle"></i> ${message}
    </div>
  `;
}

// =============================================================================
// SECTION 3: FONCTIONS D'ANIMATION
// =============================================================================

// Animer le changement de valeurs numériques avec défilement fluide
function animateNumber(element, targetValue, suffix = '', duration = 1000) {
  const startValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
  const difference = targetValue - startValue;
  const startTime = performance.now();
  
  // Ajouter la classe d'animation pour les effets CSS
  element.classList.add('animating-number');
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Fonction d'easing cubic ease-out pour une animation fluide
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    const currentValue = startValue + (difference * easedProgress);
    
    // Arrondi intelligent selon le type de valeur
    let displayValue;
    if (suffix.includes('%') || suffix.includes('hPa')) {
      displayValue = Math.round(currentValue);
    } else {
      displayValue = Math.round(currentValue * 10) / 10;
    }
    
    element.textContent = displayValue + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.classList.remove('animating-number');
    }
  }
  
  requestAnimationFrame(updateNumber);
}

// Animer le changement de texte avec effet de défilement de lettres
function animateText(element, targetText, duration = 800) {
  const startText = element.textContent || '';
  const maxLength = Math.max(startText.length, targetText.length);
  const startTime = performance.now();
  
  element.classList.add('animating-number');
  
  function updateText(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Fonction d'easing cubic ease-out
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    let displayText = '';
    const currentLength = Math.floor(easedProgress * maxLength);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < currentLength) {
        displayText += targetText[i] || '';
      } else if (i < startText.length) {
        // Afficher des caractères aléatoires pendant la transition
        const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        displayText += randomChars[Math.floor(Math.random() * randomChars.length)];
      }
    }
    
    element.textContent = displayText;
    
    if (progress < 1) {
      requestAnimationFrame(updateText);
    } else {
      element.textContent = targetText;
      element.classList.remove('animating-number');
    }
  }
  
  requestAnimationFrame(updateText);
}

// Animer la température principale avec un effet plus dramatique
function animateMainTemperature(element, targetValue, duration = 1200) {
  const startValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
  const difference = targetValue - startValue;
  const startTime = performance.now();
  
  element.classList.add('animating-number');
  
  function updateTemp(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing quartic ease-out pour un ralentissement progressif
    const easedProgress = 1 - Math.pow(1 - progress, 4);
    
    const currentValue = startValue + (difference * easedProgress);
    const displayValue = Math.round(currentValue);
    
    element.innerHTML = displayValue + '<sup>°</sup>';
    
    if (progress < 1) {
      requestAnimationFrame(updateTemp);
    } else {
      element.classList.remove('animating-number');
    }
  }
  
  requestAnimationFrame(updateTemp);
}

// Animer les icônes Phosphor avec effet fade in/out
function animateIcon(element, newIconHTML, duration = 600) {
  // Phase 1: Fade out de l'ancienne icône
  element.style.transition = `opacity ${duration/2}ms ease-out`;
  element.style.opacity = '0';
  
  // Phase 2: Changer l'icône et fade in
  setTimeout(() => {
    element.innerHTML = newIconHTML;
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration/2}ms ease-in`;
    
    // Nettoyer les styles après l'animation
    setTimeout(() => {
      element.style.transition = '';
    }, duration/2);
  }, duration/2);
}

// =============================================================================
// SECTION 4: FONCTIONS DE GESTION DU LOADER
// =============================================================================

// Afficher le loader de chargement initial
function showTransitionLoader() {
  // Supprimer un éventuel loader existant
  const existingLoader = document.getElementById("weather-transition-loader");
  if (existingLoader) {
    existingLoader.remove();
  }
  
  const loader = document.createElement("div");
  loader.id = "weather-transition-loader";
  
  // HTML du spinner avec styles inline
  const spinnerHTML = `
    <div style="
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
      margin-right: 12px;
    "></div>
    <span>Chargement de la météo...</span>
  `;
  
  loader.innerHTML = spinnerHTML;
  
  // Configuration complète du loader
  loader.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    background: rgba(0, 0, 0, 0.85) !important;
    backdrop-filter: blur(15px) !important;
    border-radius: 15px !important;
    padding: 25px 35px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: white !important;
    font-size: 1rem !important;
    font-family: 'Inter', sans-serif !important;
    z-index: 99999 !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    pointer-events: none !important;
  `;
  
  document.body.appendChild(loader);

  // Animation d'apparition
  loader.offsetHeight; // Force reflow
  requestAnimationFrame(() => {
    loader.style.opacity = "1";
  });

  return loader;
}

// Masquer et supprimer le loader
function hideTransitionLoader(loader) {
  if (loader && loader.parentNode) {
    loader.style.opacity = "0";
    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 300);
  }
}

// =============================================================================
// SECTION 5: FONCTIONS DE TRANSITION DES BACKGROUNDS
// =============================================================================

// Gérer la transition du background de couleur du body
function updateBackgroundWithTransition(weatherMain) {
  const body = document.body;
  
  const backgrounds = {
    Clear: "#4d7eb1ff",
    Clouds: "#33697fff",
    Rain: "#596663ff",
    Snow: "#787879ff",
    Thunderstorm: "#2b2b39ff",
    default: "#1e3c72",
  };

  const newBackground = backgrounds[weatherMain] || backgrounds.default;
  
  // Créer un overlay temporaire pour la transition fluide
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: ${newBackground};
    opacity: 0;
    z-index: -1;
    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  `;
  
  document.body.appendChild(overlay);
  
  // Démarrer la transition de fondu
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
  
  // Finaliser la transition
  setTimeout(() => {
    body.style.background = newBackground;
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 1000);
}

// Gérer la transition du panneau principal avec couleurs de texte dynamiques
function updateMainPanelWithTransition(weatherMain) {
  const mainPanel = document.querySelector(".main-panel");

  const backgrounds = {
    Clear: 'url("./images/clear-sky.jpg")',
    Clouds: 'url("./images/cloudy-sky.jpg")',
    Rain: 'url("./images/rainy-sky.jpg")',
    Snow: 'url("./images/snowy-sky.jpg")',
    Thunderstorm: 'url("./images/thunderstorm-sky.jpg")',
    default: 'url("./images/clear-sky.jpg")',
  };
  
  const textColors = {
    Clear: "#d5ebf7ff",
    Clouds: "#607c8cff",
    Rain: "#E1F5FE",
    Snow: "#626363ff",
    Thunderstorm: "#E6E6FA",
    default: "#FFFFFF",
  };

  const newImageUrl = backgrounds[weatherMain] || backgrounds.default;
  const color = textColors[weatherMain] || textColors.default;
  
  // Créer un overlay temporaire pour la transition d'image
  const imageOverlay = document.createElement('div');
  imageOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.5)), ${newImageUrl};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 30px;
    z-index: 0;
  `;
  
  mainPanel.appendChild(imageOverlay);
  
  // Démarrer la transition de fondu
  requestAnimationFrame(() => {
    imageOverlay.style.opacity = '1';
  });
  
  // Appliquer la couleur à tous les éléments texte avec transition
  const textElements = mainPanel.querySelectorAll(
    ".temperature, .city-name, .weather-description, .date-time"
  );
  textElements.forEach((element) => {
    element.style.transition = "color 0.6s ease";
    element.style.color = color;
  });
  
  // Finaliser la transition
  setTimeout(() => {
    mainPanel.style.background = `
      linear-gradient(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.5)),
      ${newImageUrl}
    `;
    mainPanel.style.backgroundSize = "cover";
    mainPanel.style.backgroundPosition = "center";
    mainPanel.style.backgroundRepeat = "no-repeat";
    
    if (imageOverlay.parentNode) {
      imageOverlay.parentNode.removeChild(imageOverlay);
    }
  }, 1200);
}

// =============================================================================
// SECTION 6: FONCTION PRINCIPALE D'AFFICHAGE
// =============================================================================

// Afficher les données météo avec toutes les animations synchrones
function displayWeather(data) {
  // Référence des éléments DOM
  const weatherResult = document.getElementById("weather-result");
  const weatherIcon = getWeatherIcon(data.weather[0].main);

  // Vérifier si c'est la première fois ou si le HTML existe déjà
  let tempElement = document.querySelector('.temperature');
  if (!tempElement) {
    // Première initialisation - créer le HTML
    weatherResult.innerHTML = `
      <div class="temperature-display">
          <div class="temperature">--<sup>°</sup></div>
          <div class="city-name">--</div>
          <div class="weather-description">
              <span class="weather-icon"><i class="ph-fill ph-cloud"></i></span>
              <span>En attente...</span>
          </div>
          <div class="date-time"></div>
      </div>
    `;
  }

  // Lancer les transitions de background immédiatement
  updateBackgroundWithTransition(data.weather[0].main);
  updateMainPanelWithTransition(data.weather[0].main);

  // Démarrer toutes les animations simultanément après un délai initial
  setTimeout(() => {
    // Animation de la température principale (chiffres)
    tempElement = document.querySelector('.temperature');
    animateMainTemperature(tempElement, Math.round(data.main.temp));
    
    // Animation du nom de ville (texte)
    animateText(document.querySelector('.city-name'), data.name, 300);
    
    // Animation de la description météo (texte)
    animateText(document.querySelector('.weather-description span:last-child'), data.weather[0].description, 300);
    
    // Animation de l'icône météo avec fade in/out
    animateIcon(document.querySelector('.weather-icon'), weatherIcon, 300);
    
    // Animation de la date/heure (texte)
    const dateTimeText = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric", 
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    animateText(document.querySelector('.date-time'), dateTimeText, 500);
    
    // Animations simultanées de tous les détails météo (chiffres)
    animateNumber(document.getElementById("feels-like"), Math.round(data.main.feels_like), "°C", 800);
    animateNumber(document.getElementById("humidity"), data.main.humidity, "%", 800);
    animateNumber(document.getElementById("wind"), Math.round(data.wind.speed * 3.6), " km/h", 800);
    animateNumber(document.getElementById("pressure"), data.main.pressure, " hPa", 800);
  }, 400);
}

// =============================================================================
// SECTION 7: SYSTÈME D'AUTOCOMPLÉTION
// =============================================================================

// Configuration de l'autocomplétion pour la recherche de villes
function setupAutocomplete() {
  const input = document.getElementById("city-input");
  const autocompleteList = document.getElementById("autocomplete-list");

  // Gestion de la saisie avec debounce
  input.addEventListener("input", async function () {
    const value = this.value.trim();
    app.selectedIndex = -1;

    clearTimeout(debounceTimer);

    if (value.length < 2) {
      autocompleteList.classList.remove("active");
      return;
    }

    // Afficher un indicateur de recherche
    autocompleteList.innerHTML =
      '<div class="autocomplete-item">Recherche...</div>';
    autocompleteList.classList.add("active");

    // Debounce pour optimiser les appels API
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

      // Générer la liste des suggestions
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
    }, 100);
  });

  // Navigation au clavier dans l'autocomplétion
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

  // Fermer l'autocomplétion lors du clic ailleurs
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-container")) {
      autocompleteList.classList.remove("active");
    }
  });
}

// Mettre à jour la sélection visuelle dans l'autocomplétion
function updateSelection(items) {
  items.forEach((item, index) => {
    if (index === app.selectedIndex) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  });
}

// =============================================================================
// SECTION 8: FONCTIONS DE RECHERCHE MÉTÉO
// =============================================================================

// Rechercher la météo par coordonnées (plus précis que par nom)
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

// Rechercher la météo par nom de ville
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

// =============================================================================
// SECTION 9: GESTIONNAIRES D'ÉVÉNEMENTS
// =============================================================================

// Événements du bouton de recherche
document
  .getElementById("search-button")
  .addEventListener("click", searchWeather);

document.getElementById("city-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && app.selectedIndex === -1) {
    searchWeather();
  }
});

// Événements des villes populaires
document.querySelectorAll(".city-list li").forEach((item) => {
  item.addEventListener("click", async () => {
    const city = item.dataset.city;
    document.getElementById("city-input").value = city;
    searchWeather();
  });
});

// Événement du bouton de géolocalisation
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

// =============================================================================
// SECTION 10: INITIALISATION DE L'APPLICATION
// =============================================================================

// Fonction d'initialisation avec géolocalisation intelligente
async function initializeApp() {
  // Afficher le loader de chargement sans masquer le main-panel
  const loader = showTransitionLoader();
  
  try {
    // Tentative de géolocalisation en premier
    const data = await app.getCurrentLocationWeather();
    displayWeather(data);
  } catch (geoError) {
    // Fallback sur Paris si la géolocalisation échoue
    try {
      const data = await app.getWeather("Paris");
      displayWeather(data);
    } catch (parisError) {
      displayError("Impossible de charger les données météo");
    }
  } finally {
    // Masquer le loader une fois les données chargées
    setTimeout(() => {
      hideTransitionLoader(loader);
    }, 500);
  }
}

// Point d'entrée de l'application
window.addEventListener("load", async () => {
  // Initialiser le système d'autocomplétion
  setupAutocomplete();
  
  // Lancer l'initialisation de l'application
  await initializeApp();
});