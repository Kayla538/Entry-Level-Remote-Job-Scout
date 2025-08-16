
import React from 'react';
import { JobCategory } from '../types';

interface CategorySelectorProps {
  categories: JobCategory[];
  selectedCategories: JobCategory[];
  onCategoryChange: (category: JobCategory, isChecked: boolean) => void;
  getCategoryIcon: (category: JobCategory) => React.ReactNode;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, selectedCategories, onCategoryChange, getCategoryIcon }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category);
        return (
          <label
            key={category}
            htmlFor={`checkbox-${category}`}
            className={`flex items-center justify-center p-4 text-center rounded-lg border-2 transition-all duration-200 cursor-pointer 
              ${
                isSelected
                  ? 'bg-primary-600 border-primary-600 text-white shadow-lg ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:bg-gray-700 dark:border-gray-600 dark:text-slate-200 dark:hover:border-primary-500 dark:hover:bg-gray-600'
              }`}
          >
            <input
              id={`checkbox-${category}`}
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onCategoryChange(category, e.target.checked)}
              className="sr-only" // Hide the actual checkbox, style the label instead
            />
            {getCategoryIcon(category)}
            <span className="font-semibold ml-2">{category}</span>
          </label>
        );
      })}
    </div>
  );
};

export default CategorySelector;