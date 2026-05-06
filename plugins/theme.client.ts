type ThemeRuntimeConfig = {
  default?: string;
  available?: string[];
};

const THEME_STORAGE_KEY = 'vsf-theme';

export default ({ $config }: { $config?: { theme?: ThemeRuntimeConfig } }) => {
  const availableThemes = $config?.theme?.available?.length
    ? $config.theme.available
    : ['default', 'fire', 'ice'];

  const defaultTheme = availableThemes.includes($config?.theme?.default || '')
    ? $config?.theme?.default as string
    : 'default';

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
  const safeTheme = availableThemes.includes(savedTheme) ? savedTheme : defaultTheme;

  availableThemes
    .filter((theme) => theme !== 'default')
    .forEach((theme) => {
      document.documentElement.classList.remove(`theme-${theme}`);
    });

  if (safeTheme !== 'default') {
    document.documentElement.classList.add(`theme-${safeTheme}`);
  }
};
