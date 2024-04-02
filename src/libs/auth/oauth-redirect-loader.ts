import { createRoot } from 'react-dom/client';
import RedirectFromOAuth from './RedirectFromOAuth';
const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);
root.render(RedirectFromOAuth());