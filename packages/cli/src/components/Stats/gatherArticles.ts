import { encoding } from '@common/utils/encoding';
import { RA, isDefined } from '@common/utils/types';
import fs from 'fs/promises';
import { join } from 'path';
import { markdownToText } from '../../../../browser-extension/src/components/ExtractContent/markdownToText';
import { FilesWithTags } from './getFileTags';

export const gatherArticles = async (
  cwd: string,
  filesWithTags: FilesWithTags,
): Promise<RA<Article>> =>
  Promise.all(
    Object.entries(filesWithTags).map(async ([fileName, { date, tag }]) => {
      const path = join(cwd, fileName);
      const [year, url] = encoding.urlToPath.decode(fileName);
      return (
        fs
          .readFile(path)
          .then((fileContent) => {
            const fileText = markdownToText(fileContent.toString())
              .trim()
              .split('\n');
            const title = fileText[0];
            const content = fileText.slice(1).join('\n').trim();

            return {
              year,
              url,
              title,
              content,
              date,
              tag,
            };
          })
          // Happens if the file was deleted (filesWithTags includes deleted files)
          .catch(() => undefined)
      );
    }),
  ).then((articles) => articles.filter(isDefined));

export type Article = {
  readonly year: number;
  readonly url: URL;
  readonly title: string;
  readonly content: string;
  readonly date: Date;
  readonly tag: string | undefined;
};
