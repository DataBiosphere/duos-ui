import 'outdated-browser-rework/dist/style.css';

import outdatedBrowserRework from 'outdated-browser-rework';

outdatedBrowserRework({
  browserSupport: {
    Chrome: 67, // Includes Chrome for mobile devices
    Edge: false,
    Safari: false,
    'Mobile Safari': false,
    Opera: false,
    Firefox: 60,
    Vivaldi: false,
    IE: false,
  },
  isUnknownBrowserOK: true,
  messages: {
    en: {
      outOfDate: 'DUOS may not function correctly in this browser.',
      update: {
        web: `If you experience issues, please try ${window.chrome ? 'updating' : 'using'} Google Chrome.`,
        googlePlay: 'Please install Chrome from Google Play',
        appStore: 'Please update iOS from the Settings App',
      },
      url: 'https://www.google.com/chrome/',
      callToAction: `${window.chrome ? 'Update' : 'Download'} Chrome now`,
      close: 'Close',
    },
  },
});
