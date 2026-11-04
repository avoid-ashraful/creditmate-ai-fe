import React from 'react';

import Pagination from './Pagination';

export default {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export const Interactive = () => {
  const [page, setPage] = React.useState(1);
  return (
    <>
      <Pagination page={page} pageCount={24} onChange={setPage} />
      <p>Showing page {page} of 24</p>
    </>
  );
};

export const FewPages = () => {
  const [page, setPage] = React.useState(2);
  return <Pagination page={page} pageCount={4} onChange={setPage} />;
};

export const LastPage = () => <Pagination page={24} pageCount={24} onChange={() => undefined} />;
