import React from 'react';
import { Link } from 'react-router-dom';

import { Category } from '../config/categories';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="category-card"
      aria-label={`Browse ${category.name} credit cards`}
    >
      <span className="category-icon" aria-hidden="true">
        {category.icon}
      </span>
      <h3 className="category-name">{category.name}</h3>
      <p className="category-description">{category.description}</p>
    </Link>
  );
};

export default CategoryCard;
