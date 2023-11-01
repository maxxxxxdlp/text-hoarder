import React from 'react';
import { Button } from '../Atoms/Button';
import { SimpleDocument } from '../ExtractContent/documentToSimpleDocument';
import { readerText } from '../../localization/readerText';
import { Preferences } from '../Preferences/Preferences';
import { listen } from '../../utils/events';
import { preferencesText } from '../../localization/preferencesText';
import { useStorage } from '../../hooks/useStorage';
import { downloadDocument } from './download';
import { LoadingContext } from '../Contexts/Contexts';
import { InfoTab } from './InfoTab';
import { EnsureAuthenticated } from '../Auth';
import { SaveText, filePathToGitHubUrl, useExistingFile } from './SaveText';
import { listenEvent } from '../Background/messages';
import { Link } from '../Atoms/Link';

// FEATURE: use action.setIcon/setTitle/setBadgeText/setBadgeBackgroundColor to show if there are any saved texts for this page (https://developer.chrome.com/docs/extensions/reference/action/#badge)

export function Tools({
  simpleDocument,
  style,
}: {
  readonly simpleDocument: SimpleDocument;
  readonly style: React.CSSProperties;
}): JSX.Element {
  const [selectedTool, setSelectedTool] = React.useState<
    undefined | 'saveText' | 'editText' | 'infoTab' | 'preferences'
  >(undefined);
  const handleClose = React.useCallback(() => setSelectedTool(undefined), []);

  const loading = React.useContext(LoadingContext);
  const [downloadFormat] = useStorage('reader.downloadFormat');
  const handleDownload = React.useCallback(
    (): void =>
      containerRef.current === null
        ? undefined
        : loading(
            downloadDocument(
              downloadFormat,
              simpleDocument,
              containerRef.current,
            ),
          ),
    [loading, downloadFormat],
  );

  React.useEffect(
    () =>
      listenEvent('ActivateExtension', ({ action }) =>
        action === 'saveText' || action === 'editText'
          ? setSelectedTool(action)
          : action === 'download'
          ? handleDownload()
          : undefined,
      ),
    [downloadDocument, setSelectedTool],
  );

  // Close on outside click
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(
    () =>
      selectedTool === undefined || containerRef.current === null
        ? undefined
        : listen(containerRef.current.getRootNode(), 'click', (event) =>
            event.target instanceof Element &&
            containerRef.current?.contains(event.target) === false
              ? setSelectedTool(undefined)
              : undefined,
          ),
    [selectedTool, setSelectedTool],
  );

  const [existingFile, setExistingFile] = useExistingFile();
  const [repository] = useStorage('setup.repository');
  const panelId = React.useId();

  return (
    <div
      className={`
        absolute top-0 right-0 flex backdrop-blur rounded-es
        bg-white/80 dark:bg-black/70 max-h-full
        ${selectedTool === undefined ? 'opacity-75 hover:opacity-100' : ''}
      `}
      style={style}
      ref={containerRef}
    >
      {selectedTool !== undefined && (
        <aside
          className={`
            flex flex-col gap-4 p-4 overflow-auto max-w-[20rem]
            ${
              selectedTool === 'preferences' || selectedTool === 'infoTab'
                ? 'pt-0 '
                : ''
            }
          `}
          id={panelId}
          tabIndex={-1}
          ref={(element): void => element?.focus()}
        >
          {selectedTool === 'preferences' ? (
            <Preferences />
          ) : selectedTool === 'infoTab' ? (
            <InfoTab />
          ) : (
            <EnsureAuthenticated>
              <SaveText
                existingFile={existingFile}
                simpleDocument={simpleDocument}
                mode={selectedTool === 'saveText' ? 'save' : 'edit'}
                onClose={handleClose}
                onSaved={setExistingFile}
              />
            </EnsureAuthenticated>
          )}
        </aside>
      )}
      <nav
        className="flex flex-col p-2 gap-3 text-[130%] "
        aria-label={readerText.tools}
      >
        <Button.Icon
          onClick={(): void =>
            setSelectedTool(
              selectedTool === 'saveText' ? undefined : 'saveText',
            )
          }
          icon={
            typeof existingFile === 'string' ? 'bookmark' : 'bookmarkHollow'
          }
          title={readerText.saveToGitHub}
          aria-pressed={selectedTool === 'saveText' ? true : undefined}
          aria-controls={panelId}
        />
        {typeof existingFile === 'string' && typeof repository === 'object' ? (
          <Link.Icon
            href={filePathToGitHubUrl(repository, existingFile)}
            icon="pencil"
            title={readerText.editOnGitHub}
            aria-controls={panelId}
          />
        ) : (
          <Button.Icon
            onClick={(): void =>
              setSelectedTool(
                selectedTool === 'editText' ? undefined : 'editText',
              )
            }
            icon="pencil"
            title={readerText.editOnGitHub}
            aria-pressed={selectedTool === 'editText' ? true : undefined}
            aria-controls={panelId}
          />
        )}
        <Button.Icon
          onClick={handleDownload}
          icon="download"
          title={readerText.download}
        />
        <Button.Icon
          onClick={(): void =>
            setSelectedTool(selectedTool === 'infoTab' ? undefined : 'infoTab')
          }
          icon="informationCircle"
          title={readerText.aboutTextHoarder}
          aria-pressed={selectedTool === 'infoTab' ? true : undefined}
          aria-controls={panelId}
        />
        <Button.Icon
          onClick={(): void =>
            setSelectedTool(
              selectedTool === 'preferences' ? undefined : 'preferences',
            )
          }
          icon="cog"
          title={preferencesText.preferences}
          aria-pressed={selectedTool === 'preferences' ? true : undefined}
          aria-controls={panelId}
        />
      </nav>
    </div>
  );
}