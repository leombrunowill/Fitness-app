import { createFoodListItem, createSkeletonItem } from '../components/FoodListItem.js';
import { fetchFavoriteFoods, fetchRecentFoods, searchNutritionixFoods } from '../supabase/nutritionQueries.js';

function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delayMs);
  };
}

export function initSearchFood(root, options = {}) {
  if (!root) return;

  const state = {
    cache: new Map(),
    recent: [],
    favorites: [],
    results: [],
    loading: false
  };

  root.innerHTML = `
    <section class="nutrition-search-screen" aria-label="Food search">
      <header class="nutrition-header">
        <h2>Log food</h2>
        <p>Search Nutritionix foods or pick from recent.</p>
      </header>
      <label class="nutrition-search-input-wrap" for="nutrition-search-input">
        <span aria-hidden="true">🔎</span>
        <input id="nutrition-search-input" type="search" placeholder="Search foods" autocomplete="off" />
      </label>

      <div class="nutrition-results" id="nutrition-results">
        <div class="nutrition-section" id="favorite-foods-section">
          <h3>Favorites</h3>
          <div class="food-list" data-list="favorites"></div>
        </div>

        <div class="nutrition-section" id="recent-foods-section">
          <h3>Recent foods</h3>
          <div class="food-list" data-list="recent"></div>
        </div>

        <div class="nutrition-section" id="search-foods-section">
          <h3>Search results</h3>
          <div class="food-list" data-list="search"></div>
        </div>
      </div>
    </section>
  `;

  const searchInput = root.querySelector('#nutrition-search-input');
  const favoritesList = root.querySelector('[data-list="favorites"]');
  const recentList = root.querySelector('[data-list="recent"]');
  const searchList = root.querySelector('[data-list="search"]');

  const onFoodSelect = options.onFoodSelect || (() => {});

  function renderList(target, items, emptyText) {
    target.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'food-list-empty';
      empty.textContent = emptyText;
      target.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((food) => fragment.append(createFoodListItem(food, onFoodSelect)));
    target.append(fragment);
  }

  function renderLoading(target) {
    target.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 4; i += 1) {
      fragment.append(createSkeletonItem());
    }
    target.append(fragment);
  }

  async function runSearch(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      state.results = [];
      renderList(searchList, [], 'Start typing to search foods.');
      return;
    }

    if (state.cache.has(normalizedQuery)) {
      state.results = state.cache.get(normalizedQuery);
      renderList(searchList, state.results, 'No foods found.');
      return;
    }

    state.loading = true;
    renderLoading(searchList);

    const results = await searchNutritionixFoods(normalizedQuery);
    state.results = results;
    state.cache.set(normalizedQuery, results);
    state.loading = false;
    renderList(searchList, results, 'No foods found.');
  }

  const debouncedSearch = debounce((value) => {
    runSearch(value);
  }, 260);

  searchInput.addEventListener('input', (event) => {
    debouncedSearch(event.target.value || '');
  });

  (async () => {
    const [favorites, recent] = await Promise.all([fetchFavoriteFoods(), fetchRecentFoods()]);
    state.favorites = favorites;
    state.recent = recent;

    renderList(favoritesList, state.favorites, 'No favorites yet.');
    renderList(recentList, state.recent, 'No recent foods yet.');
    renderList(searchList, [], 'Start typing to search foods.');
  })();
}
