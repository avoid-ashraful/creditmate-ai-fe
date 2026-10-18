import React from 'react';
import { Link } from 'react-router-dom';

import { Category } from '../config/categories';
import { getCategoryText, useLanguage } from '../locales';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { lang } = useLanguage();
  const text = getCategoryText(category, lang);

  return (
    <Link to={`/category/${category.slug}`} className="category-card" lang={lang}>
      <span className="category-icon" aria-hidden="true">
        {category.icon}
      </span>
      <h2 className="category-name">{text.name}</h2>
      <p className="category-description">{text.description}</p>
    </Link>
  );
};

export default CategoryCard;
