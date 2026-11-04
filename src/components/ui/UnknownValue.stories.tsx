import React from 'react';

import UnknownValue from './UnknownValue';

export default {
  title: 'UI/UnknownValue',
  component: UnknownValue,
  tags: ['autodocs'],
};

/* All five kinds of unknown / qualified value, as used on product pages. */
export const AllKinds = () => (
  <dl>
    <dt>Annual fee</dt>
    <dd>
      <UnknownValue kind="not-published" />
    </dd>
    <dt>APR (Islamic card)</dt>
    <dd>
      <UnknownValue kind="not-applicable" note="Islamic cards charge no interest" />
    </dd>
    <dt>Lounge access</dt>
    <dd>
      <UnknownValue kind="unavailable" />
    </dd>
    <dt>Effective rate</dt>
    <dd>
      <UnknownValue kind="derived">6.42%</UnknownValue>
    </dd>
    <dt>Interest you may pay</dt>
    <dd>
      <UnknownValue kind="estimated-range" min={12000} max={18500} />
    </dd>
  </dl>
);

/* Bengali content renders in Hind Siliguri via the :lang(bn) rule
   (src/styles/fonts.css, loaded by .storybook/preview.tsx). */
export const Bengali = () => (
  <div lang="bn">
    <p>ক্রেডিট কার্ডের বার্ষিক ফি ও সুদের হার তুলনা করুন।</p>
    <dl>
      <dt>বার্ষিক ফি</dt>
      <dd>
        <UnknownValue kind="not-published" />
      </dd>
      <dt>আনুমানিক খরচ</dt>
      <dd>
        <UnknownValue kind="estimated-range" min={12000} max={18500} />
      </dd>
    </dl>
  </div>
);

export const NotPublished = { args: { kind: 'not-published' } };
export const NotApplicable = { args: { kind: 'not-applicable' } };
export const Unavailable = { args: { kind: 'unavailable' } };
