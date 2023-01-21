const prompts = require('prompts');

export const selectTemplate = async () => {
  const templates = ['next-gluestack-ts', 'next-tailwind-ts', 'next-ts'];
  console.log('Select template:');
  const response = await prompts({
    type: 'select',
    name: 'selectedOption',
    message: 'Select an option:',
    choices: templates,
    initial: 0,
  });

  return templates[response.selectedOption];
};
