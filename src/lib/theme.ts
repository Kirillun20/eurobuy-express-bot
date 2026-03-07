import { getTheme } from './store';

export const initTheme = () => {
  const theme = getTheme();
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }
};
