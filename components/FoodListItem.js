export function createFoodListItem(food, onSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'food-list-item';

  const main = document.createElement('div');
  main.className = 'food-main';

  const name = document.createElement('p');
  name.className = 'food-name';
  name.textContent = food.foodName || 'Unknown food';
  main.append(name);

  if (food.brand) {
    const brand = document.createElement('p');
    brand.className = 'food-meta';
    brand.textContent = food.brand;
    main.append(brand);
  }

  const macros = document.createElement('div');
  macros.className = 'food-macros';

  const calories = document.createElement('span');
  calories.textContent = `${Math.round(food.calories || 0)} cal`;

  const protein = document.createElement('span');
  protein.textContent = `${Math.round(food.protein || 0)}g P`;

  macros.append(calories, protein);
  button.append(main, macros);

  button.addEventListener('click', () => onSelect(food));
  return button;
}

export function createSkeletonItem() {
  const skeleton = document.createElement('div');
  skeleton.className = 'food-list-item skeleton';

  const skeletonBlock = document.createElement('div');
  skeletonBlock.className = 'skeleton-block';
  skeleton.append(skeletonBlock);

  return skeleton;
}
