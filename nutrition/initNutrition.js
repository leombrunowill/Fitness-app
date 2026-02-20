import { initSearchFood } from './searchFood.js';

export function initNutrition() {
  const root = document.getElementById('nutrition-root');
  if (!root) return;

  initSearchFood(root, {
    onFoodSelect: (food) => {
      // Phase 1-3: basic search UX only. Logging flow added in next phase.
      window.alert(`Selected: ${food.foodName}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNutrition();
});
