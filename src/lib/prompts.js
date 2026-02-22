import inquirer from 'inquirer';

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

export async function promptForCreateInputs(prefilled = {}) {
  const questions = [];

  if (!prefilled.moduleName) {
    questions.push({
      type: 'input',
      name: 'moduleName',
      message: 'Module name:',
      validate: validateName,
    });
  }

  questions.push({
    type: 'input',
    name: 'componentName',
    message: 'Component name:',
    default: prefilled.componentName || prefilled.moduleName,
    validate: validateName,
  });

  if (!prefilled.lang) {
    questions.push({
      type: 'list',
      name: 'lang',
      message: 'Language:',
      choices: ['tsx', 'jsx'],
      default: 'tsx',
    });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    moduleName: prefilled.moduleName || answers.moduleName,
    componentName: answers.componentName || prefilled.componentName || prefilled.moduleName,
    lang: prefilled.lang || answers.lang,
  };
}

function validateName(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!normalized) {
    return 'This field is required.';
  }

  if (!NAME_PATTERN.test(normalized)) {
    return 'Use letters, numbers, and underscores only. Start with a letter.';
  }

  return true;
}
