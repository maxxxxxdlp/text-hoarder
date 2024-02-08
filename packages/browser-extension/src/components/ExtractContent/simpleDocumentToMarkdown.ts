import TurndownService from '@joplin/turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';
import { SimpleDocument } from './documentToSimpleDocument';

/**
 * Convert simple document to markdown to be saved to GitHub repository
 */
export function simpleDocumentToMarkdown(
  simpleDocument: SimpleDocument,
): string {
  return `# ${simpleDocument.title}\n\n${elementToMarkdown(
    simpleDocument.content,
  )}`;
}

// LOW: add customization options
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});
turndownService.use(gfm);

// Workaround for https://github.com/laurent22/joplin/issues/9885
const tableRule = turndownService.rules.array[2];
if (!tableRule.filter.toString().includes('TABLE'))
  throw new Error('Incorrect rule selected. Expected to find table rule');
tableRule.filter = ['table'];

function elementToMarkdown(element: HTMLElement): string {
  try {
    return turndownService
      .turndown(element)
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
  } catch (error) {
    console.error(error);
    return element.innerText.replaceAll('.', '.\n');
  }
}
