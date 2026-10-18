import React from 'react';
import { Link } from 'react-router-dom';

import { Category } from '../config/categories';
import { fillCopy, getCategoryText, getCommonCopy, useLanguage } from '../locales';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { lang } = useLanguage();
  const text = getCategoryText(category, lang);

  return (
    <Link
      to={`/category/${category.slug}`}
      className="category-card"
      aria-label={fillCopy(getCommonCopy(lang).categoryCardAriaLabel, { name: text.name })}
    >
      <span className="category-icon" aria-hidden="true">
        {category.icon}
      </span>
      <h3 className="category-name">{text.name}</h3>
      <p className="category-description">{text.description}</p>
    </Link>
  );
};

export default CategoryCard;
