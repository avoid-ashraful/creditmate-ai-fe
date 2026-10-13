import React from 'react';

import { Skeleton, SkeletonCardGrid } from './Skeleton';

export default {
  title: 'Components/Skeleton',
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
};

const SkeletonComponent = Skeleton;
const SkeletonCardGridComponent = SkeletonCardGrid;

/* State: default skeleton block */
export const Default = () => <SkeletonComponent width="200px" height="1rem" />;

/* State: card height skeleton */
export const CardHeight = () => <SkeletonComponent width="100%" height="160px" />;

/* State: text line skeleton */
export const TextLine = () => <SkeletonComponent width="70%" height="1.25rem" />;

/* State: button skeleton */
export const Button = () => <SkeletonComponent width="120px" height="40px" />;

/* State: avatar skeleton */
export const Avatar = () => <SkeletonComponent width="48px" height="48px" />;

/* State: multiple skeletons in a row */
export const Multiple = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
    <SkeletonComponent width="100%" height="1rem" />
    <SkeletonComponent width="80%" height="1rem" />
    <SkeletonComponent width="60%" height="1rem" />
  </div>
);

/* State: skeleton card grid default (6 cards) */
export const CardGridDefault = () => <SkeletonCardGridComponent label="Loading cards…" count={6} />;

/* State: skeleton card grid with 3 cards */
export const CardGridThree = () => (
  <SkeletonCardGridComponent label="Loading featured cards…" count={3} />
);

/* State: skeleton card grid with 12 cards */
export const CardGridTwelve = () => (
  <SkeletonCardGridComponent label="Loading all cards…" count={12} />
);

/* State: skeleton card grid with custom label (Bengali) */
export const CardGridBengali = () => (
  <SkeletonCardGridComponent label="কার্ডগুলো লোড হচ্ছে…" count={4} />
);

/* State: skeleton card grid in a container */
export const CardGridInContainer = () => (
  <div style={{ maxWidth: '800px', padding: '1rem' }}>
    <SkeletonCardGridComponent label="Loading cards…" count={8} />
  </div>
);
