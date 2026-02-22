import { isCancel, select, text } from '@clack/prompts';

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

export async function promptForCreateInputs(prefilled = {}) {
  let moduleName = prefilled.moduleName;
  if (!moduleName) {
    const moduleAnswer = await text({
      message: 'Module name',
      placeholder: 'Dashboard',
      validate: (value) => validateName(value),
    });

    if (isCancel(moduleAnswer)) {
      return null;
    }

    moduleName = moduleAnswer.trim();
  }

  let componentName = prefilled.componentName;
  if (!componentName) {
    const componentAnswer = await text({
      message: 'Component name',
      initialValue: moduleName,
      validate: (value) => validateName(value),
    });

    if (isCancel(componentAnswer)) {
      return null;
    }

    componentName = componentAnswer.trim();
  }

  let lang = prefilled.lang;
  if (!lang) {
    const langAnswer = await select({
      message: 'Language',
      options: [
        { label: 'TypeScript (.tsx)', value: 'tsx' },
        { label: 'JavaScript (.jsx)', value: 'jsx' },
      ],
      initialValue: 'tsx',
    });

    if (isCancel(langAnswer)) {
      return null;
    }

    lang = langAnswer;
  }

  return {
    moduleName,
    componentName: componentName || moduleName,
    lang,
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

  return undefined;
}
