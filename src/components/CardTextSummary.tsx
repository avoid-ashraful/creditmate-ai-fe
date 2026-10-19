import React from 'react';

import { getCommonCopy, useLanguage } from '../locales';
import { summarizeCardText } from '../utils/summarizeCardText';

/** Keep all bank terms available without filling a comparison cell with prose. */
const CardTextSummary: React.FC<{ text: string; lounge?: boolean }> = ({ text, lounge }) => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const summary = summarizeCardText(text, lounge);
  if (summary === text) return <>{text}</>;
  return (
    <>
      <span>{summary}</span>
      <details className="card-text-details">
        <summary>{common.moreDetails}</summary>
        <p>{text}</p>
      </details>
    </>
  );
};

export default CardTextSummary;
