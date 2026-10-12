import { setupServer } from 'msw/node';

import { handlers } from './handlers';

process.env.REACT_APP_ENABLE_API_LOGGING = 'false';

export const server = setupServer(...handlers);
