const prompts = require('prompts');

export const selectTemplate = async () => {
  const templates = ['next-gluestack-ts', 'next-tailwind-ts', 'next-ts'];
  const response = await prompts({
    type: 'select',
    name: 'selectedOption',
    message: 'Select template:',
    choices: templates,
    initial: 0,
  });

  return templates[response.selectedOption];
};
