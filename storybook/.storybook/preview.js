export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    // inlineStories: false,
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: [
        'Web Plugin',
        ['Getting Started', 'Requirements', 'How to Install'],
      ]
    },
  },
};
