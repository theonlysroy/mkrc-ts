export const componentTemplate = (name, lang) => `
import React from 'react';
${lang === 'tsx' ? `\ninterface ${name}Props {}\n` : ''}
export default function ${name}(props${lang === 'tsx' ? `: ${name}Props` : ''}) {
  return (
    <div>
      <h1>${name}</h1>
    </div>
  );
};
`.trimStart();

export const barrelTemplate = (name) =>
  `export { default as ${name} } from './${name}';\n`;

export const barrelExportLine = (name) =>
  `export { default as ${name} } from './${name}';\n`;
