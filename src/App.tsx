import React from 'react';
import JSZip from 'jszip';
import defaultTrackerConfig from './cometal_design_work_pipeline.tracker.json';

type StageStatus = 'not_started' | 'in_progress' | 'completed';

type ResultFile = {
  attachedAt: string;
  dataUrl?: string;
  name: string;
  size: number;
  type: string;
};

type PromptBlock = {
  title: string;
  description: string;
  targetFile: string;
  sourceFile: string;
  promptText: string;
  completed: boolean;
  resultFile?: ResultFile | null;
};

type Stage = {
  id: number;
  title: string;
  description: string;
  status: StageStatus;
  prompts: PromptBlock[];
};

type TrackerConfig = {
  eyebrow: string;
  exportName: string;
  intro: string;
  name: string;
  taskGroupLabel: string;
  stages: Stage[];
};

type StoredPrompt = Pick<PromptBlock, 'title' | 'completed' | 'resultFile'>;

type StoredStage = {
  id: number;
  prompts: StoredPrompt[];
};

const STORAGE_KEY = 'process-tracker-kit-state-v2';
const LEGACY_STORAGE_KEY = 'cometal-redesign-navigator-state-v3';

const defaultTrackerMeta: Omit<TrackerConfig, 'stages'> = {
  eyebrow: 'COMETAL design work',
  exportName: 'cometal-design-work-tracker-export',
  intro: 'Пошаговый трекер работ по дизайн-системе, шаблонам, продуктовым экранам и handoff для COMETAL 2.0.',
  name: 'COMETAL Design Work Tracker',
  taskGroupLabel: 'TASKS',
};

const defaultTracker = normalizeTrackerConfig(defaultTrackerConfig);

const statusLabels: Record<StageStatus, string> = {
  not_started: 'Не начато',
  in_progress: 'В работе',
  completed: 'Завершено',
};

const statusBadgeClasses: Record<StageStatus, string> = {
  not_started: 'status-not-started',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
};

function getPromptKey(stageId: number, promptTitle: string) {
  return `${stageId}:${promptTitle}`;
}

function isStageExpanded(stage: Stage, expandedPrompts: Record<string, boolean>) {
  return stage.prompts.some((prompt) => !!expandedPrompts[getPromptKey(stage.id, prompt.title)]);
}

function deriveStageStatus(stage: Stage, expandedPrompts: Record<string, boolean> = {}): StageStatus {
  if (stage.prompts.length === 0) {
    return 'not_started';
  }

  if (stage.prompts.every((prompt) => prompt.completed)) {
    return 'completed';
  }

  if (stage.prompts.some((prompt) => prompt.completed) || isStageExpanded(stage, expandedPrompts)) {
    return 'in_progress';
  }

  return 'not_started';
}

function withDerivedStatuses(stages: Stage[], expandedPrompts: Record<string, boolean> = {}) {
  return stages.map((stage) => ({
    ...stage,
    status: deriveStageStatus(stage, expandedPrompts),
  }));
}

function getEmptyStages(stages: Stage[]) {
  return stages.map((stage) => ({
    ...stage,
    prompts: stage.prompts.map((prompt) => ({
      ...prompt,
      completed: false,
      resultFile: null,
    })),
  }));
}

function formatStageTitle(title: string) {
  return title.replace(/^Этап\s+\d+\.\s*/i, '');
}

function mergeStoredStages(baseStages: Stage[], storedStages: StoredStage[]) {
  return baseStages.map((stage) => {
    const storedStage = storedStages.find((stored) => stored.id === stage.id);

    if (!storedStage) {
      return stage;
    }

    return {
      ...stage,
      prompts: stage.prompts.map((prompt) => {
        const storedPrompt = storedStage.prompts.find((item) => item.title === prompt.title);
        return storedPrompt
          ? { ...prompt, completed: storedPrompt.completed, resultFile: storedPrompt.resultFile ?? null }
          : { ...prompt, resultFile: prompt.resultFile ?? null };
      }),
    };
  });
}

function isStageStatus(value: unknown): value is StageStatus {
  return value === 'not_started' || value === 'in_progress' || value === 'completed';
}

function getString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizePrompt(rawPrompt: unknown, index: number): PromptBlock {
  const prompt = rawPrompt && typeof rawPrompt === 'object' ? (rawPrompt as Partial<PromptBlock> & Record<string, unknown>) : {};
  const title = getString(prompt.title ?? prompt.name ?? prompt.targetFile, `Task ${index + 1}`);
  const description = getString(prompt.description, title);
  const targetFile = getString(prompt.targetFile ?? prompt.output ?? prompt.result, title);

  return {
    completed: Boolean(prompt.completed),
    description,
    promptText: getString(prompt.promptText ?? prompt.instructions ?? prompt.description, description),
    resultFile: prompt.resultFile && typeof prompt.resultFile === 'object' ? (prompt.resultFile as ResultFile) : null,
    sourceFile: getString(prompt.sourceFile ?? prompt.source, 'План работ'),
    targetFile,
    title,
  };
}

function normalizeStage(rawStage: unknown, index: number): Stage {
  const stage = rawStage && typeof rawStage === 'object' ? (rawStage as Partial<Stage> & { tasks?: unknown[] }) : {};
  const id = typeof stage.id === 'number' && Number.isFinite(stage.id) ? stage.id : index + 1;
  const promptsSource = Array.isArray(stage.prompts) ? stage.prompts : Array.isArray(stage.tasks) ? stage.tasks : [];

  return {
    description: getString(stage.description, 'Этап процесса.'),
    id,
    prompts: promptsSource.map(normalizePrompt),
    status: isStageStatus(stage.status) ? stage.status : 'not_started',
    title: getString(stage.title, `Этап ${index + 1}`),
  };
}

function normalizeTrackerConfig(rawConfig: unknown): TrackerConfig {
  const config = rawConfig && typeof rawConfig === 'object' ? (rawConfig as Partial<TrackerConfig> & { title?: unknown }) : {};
  const stagesSource = Array.isArray(rawConfig) ? rawConfig : Array.isArray(config.stages) ? config.stages : [];
  const stages = stagesSource.map(normalizeStage);

  return {
    eyebrow: getString(config.eyebrow, defaultTrackerMeta.eyebrow),
    exportName: sanitizeZipPathPart(getString(config.exportName, defaultTrackerMeta.exportName)),
    intro: getString(config.intro, defaultTrackerMeta.intro),
    name: getString(config.name ?? config.title, defaultTrackerMeta.name),
    stages: withDerivedStatuses(stages.length ? stages : defaultTrackerMetaFallbackStages()),
    taskGroupLabel: getString(config.taskGroupLabel, defaultTrackerMeta.taskGroupLabel),
  };
}

function defaultTrackerMetaFallbackStages() {
  return Array.isArray((defaultTrackerConfig as TrackerConfig).stages)
    ? ((defaultTrackerConfig as TrackerConfig).stages as unknown[]).map(normalizeStage)
    : [];
}

function loadTracker(): TrackerConfig {
  const stored = localStorage.getItem(STORAGE_KEY);
  const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!stored) {
    if (legacyStored) {
      try {
        const parsedLegacy = JSON.parse(legacyStored) as StoredStage[];
        return Array.isArray(parsedLegacy)
          ? { ...defaultTracker, stages: withDerivedStatuses(mergeStoredStages(defaultTracker.stages, parsedLegacy)) }
          : defaultTracker;
      } catch {
        return defaultTracker;
      }
    }

    return defaultTracker;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? { ...defaultTracker, stages: withDerivedStatuses(mergeStoredStages(defaultTracker.stages, parsed)) }
      : normalizeTrackerConfig(parsed);
  } catch {
    return defaultTracker;
  }
}

function getStoredTracker(tracker: TrackerConfig): TrackerConfig {
  return {
    ...tracker,
    stages: tracker.stages.map((stage) => ({
      ...stage,
      prompts: stage.prompts.map((prompt) => ({
        ...prompt,
        resultFile: prompt.resultFile ?? null,
      })),
    })),
  };
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function getBase64FromDataUrl(dataUrl: string) {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

function sanitizeZipPathPart(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').trim() || 'untitled';
}

function getManifestStages(stages: Stage[]) {
  return stages.map((stage) => ({
    ...stage,
    prompts: stage.prompts.map((prompt) => ({
      ...prompt,
      resultFile: prompt.resultFile
        ? {
            attachedAt: prompt.resultFile.attachedAt,
            name: prompt.resultFile.name,
            size: prompt.resultFile.size,
            type: prompt.resultFile.type,
          }
        : null,
    })),
  }));
}

function PromptCard({
  prompt,
  isCopied,
  isExpanded,
  onCopy,
  onFileAttach,
  onReset,
  onToggleExpand,
  onToggle,
}: {
  prompt: PromptBlock;
  isCopied: boolean;
  isExpanded: boolean;
  onCopy: () => void;
  onFileAttach: (file: File) => void;
  onReset: () => void;
  onToggleExpand: () => void;
  onToggle: () => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isFileDragging, setIsFileDragging] = React.useState(false);
  const canCompletePrompt = !!prompt.resultFile || prompt.completed;

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    onFileAttach(file);
  }

  return (
    <article className={`promptCard card ${isExpanded ? 'promptCard-expanded' : ''} ${prompt.completed ? 'promptCard-completed' : ''}`}>
      <button
        aria-expanded={isExpanded}
        className="promptClickArea"
        type="button"
        onClick={onToggleExpand}
      >
        <div>
          <h4 className="promptName">{prompt.description}</h4>
          <p className="promptFile">{prompt.title}</p>
        </div>
        {prompt.completed && <span className="badge rounded-pill promptCompletedBadge">Completed</span>}
      </button>

      <div className="promptExpandedContent" aria-hidden={!isExpanded}>
        <div className="promptExpandedInner">
            <dl className="promptMeta">
              <div>
                <dt>Источник данных</dt>
                <dd>{prompt.sourceFile}</dd>
              </div>
              <div>
                <dt>Ожидаемый результат</dt>
                <dd>{prompt.targetFile}</dd>
              </div>
            </dl>

            <div className="promptTextWrap">
              <div className="promptTextHeader">
                <span>Prompt</span>
              </div>
              <button
                aria-label="Copy Prompt"
                className={`btn promptCopyIcon ${isCopied ? 'promptCopyIcon-copied' : ''}`}
                type="button"
                tabIndex={isExpanded ? 0 : -1}
                onClick={(event) => {
                  event.stopPropagation();
                  onCopy();
                }}
              >
                <i className="bi bi-copy" aria-hidden="true" />
              </button>
              {isCopied && (
                <span className="copyTooltip" role="status">
                  Скопировано
                </span>
              )}
              <pre className="promptText">{prompt.promptText}</pre>
            </div>

            <div
              className={`resultDropZone ${isFileDragging ? 'resultDropZone-dragging' : ''} ${
                prompt.resultFile ? 'resultDropZone-attached' : ''
              }`}
              role="button"
              tabIndex={isExpanded ? 0 : -1}
              onClick={() => fileInputRef.current?.click()}
              onDragLeave={() => setIsFileDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsFileDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsFileDragging(false);
                handleFile(event.dataTransfer.files[0]);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                className="resultFileInput"
                type="file"
                tabIndex={-1}
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <span className="resultDropIcon" aria-hidden="true">
                <i className={`bi ${prompt.resultFile ? 'bi-file-earmark-check' : 'bi-file-earmark-arrow-up'}`} />
              </span>
              <span className="resultDropCopy">
                <span className="resultDropLabel">Файл результата</span>
                {prompt.resultFile ? (
                  <>
                    <strong>{prompt.resultFile.name}</strong>
                    <p>{`${formatFileSize(prompt.resultFile.size)} · ${prompt.resultFile.type || 'file'}`}</p>
                  </>
                ) : (
                  <p>Перетащи файл сюда или нажми, чтобы выбрать</p>
                )}
              </span>
            </div>

            {prompt.completed ? (
              <button
                className="btn w-100 promptClearButton"
                type="button"
                tabIndex={isExpanded ? 0 : -1}
                onClick={(event) => {
                  event.stopPropagation();
                  onReset();
                }}
              >
                Очистить
              </button>
            ) : (
              canCompletePrompt && (
                <button
                  className="btn w-100 promptCompleteButton"
                  type="button"
                  tabIndex={isExpanded ? 0 : -1}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                  }}
                >
                  Complete
                </button>
              )
            )}
          </div>
        </div>
    </article>
  );
}

function App() {
  const [tracker, setTracker] = React.useState<TrackerConfig>(loadTracker);
  const [expandedPrompts, setExpandedPrompts] = React.useState<Record<string, boolean>>({});
  const [copiedPromptKey, setCopiedPromptKey] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<string | null>(null);
  const copiedPromptTimer = React.useRef<number | null>(null);
  const importInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getStoredTracker(tracker)));
  }, [tracker]);

  React.useEffect(() => {
    return () => {
      if (copiedPromptTimer.current) {
        window.clearTimeout(copiedPromptTimer.current);
      }
    };
  }, []);

  const visibleStages = React.useMemo(() => withDerivedStatuses(tracker.stages, expandedPrompts), [expandedPrompts, tracker.stages]);
  const completedCount = visibleStages.filter((stage) => stage.status === 'completed').length;
  const totalPromptCount = visibleStages.reduce((sum, stage) => sum + stage.prompts.length, 0);
  const completedPromptCount = visibleStages.reduce(
    (sum, stage) => sum + stage.prompts.filter((prompt) => prompt.completed).length,
    0,
  );
  const progress = totalPromptCount ? Math.round((completedPromptCount / totalPromptCount) * 100) : 0;

  function updateStages(updater: (currentStages: Stage[]) => Stage[]) {
    setTracker((currentTracker) => ({
      ...currentTracker,
      stages: withDerivedStatuses(updater(currentTracker.stages), expandedPrompts),
    }));
  }

  function togglePrompt(stageId: number, promptTitle: string, shouldCollapseAfterComplete = false) {
    const stage = tracker.stages.find((item) => item.id === stageId);
    const prompt = stage?.prompts.find((item) => item.title === promptTitle);
    const nextCompletedState = prompt ? !prompt.completed : false;

    updateStages((currentStages) => {
      const updatedStages = currentStages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              prompts: stage.prompts.map((prompt) =>
                prompt.title === promptTitle
                  ? { ...prompt, completed: nextCompletedState }
                  : prompt,
              ),
            }
          : stage,
      );
      return updatedStages;
    });

    if (shouldCollapseAfterComplete && nextCompletedState) {
      const key = getPromptKey(stageId, promptTitle);
      setExpandedPrompts((current) => ({
        ...current,
        [key]: false,
      }));
    }
  }

  async function attachResultFile(stageId: number, promptTitle: string, file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    const resultFile: ResultFile = {
      attachedAt: new Date().toISOString(),
      dataUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    updateStages((currentStages) =>
      currentStages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              prompts: stage.prompts.map((prompt) =>
                prompt.title === promptTitle ? { ...prompt, resultFile } : prompt,
              ),
            }
          : stage,
      ),
    );
  }

  function resetPrompt(stageId: number, promptTitle: string) {
    updateStages((currentStages) =>
      currentStages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              prompts: stage.prompts.map((prompt) =>
                prompt.title === promptTitle ? { ...prompt, completed: false, resultFile: null } : prompt,
              ),
            }
          : stage,
      ),
    );
  }

  async function copyPrompt(promptText: string, promptKey: string) {
    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = promptText;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopiedPromptKey(promptKey);

    if (copiedPromptTimer.current) {
      window.clearTimeout(copiedPromptTimer.current);
    }

    copiedPromptTimer.current = window.setTimeout(() => {
      setCopiedPromptKey(null);
      copiedPromptTimer.current = null;
    }, 3000);
  }

  function togglePromptExpand(stageId: number, promptTitle: string) {
    const key = getPromptKey(stageId, promptTitle);
    setExpandedPrompts((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function exportState() {
    setIsExporting(true);

    try {
      const zip = new JSZip();
      const payload = {
        exportedAt: new Date().toISOString(),
        progress,
        tracker: {
          eyebrow: tracker.eyebrow,
          intro: tracker.intro,
          name: tracker.name,
          taskGroupLabel: tracker.taskGroupLabel,
        },
        stages: getManifestStages(visibleStages),
      };

      zip.file('pipeline_state.json', JSON.stringify(payload, null, 2));

      visibleStages.forEach((stage) => {
        const stageFolderName = `${String(stage.id).padStart(2, '0')}_${sanitizeZipPathPart(formatStageTitle(stage.title))}`;

        stage.prompts.forEach((prompt) => {
          if (!prompt.resultFile?.dataUrl) {
            return;
          }

          const fileName = sanitizeZipPathPart(prompt.resultFile.name || prompt.targetFile);
          const promptFolderName = sanitizeZipPathPart(prompt.targetFile);
          const filePath = `result_files/${stageFolderName}/${promptFolderName}/${fileName}`;

          zip.file(filePath, getBase64FromDataUrl(prompt.resultFile.dataUrl), {
            base64: true,
            date: new Date(prompt.resultFile.attachedAt),
          });
        });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${tracker.exportName}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  function resetState() {
    const nextTracker = {
      ...tracker,
      stages: withDerivedStatuses(getEmptyStages(tracker.stages)),
    };

    setTracker(nextTracker);
    setExpandedPrompts({});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getStoredTracker(nextTracker)));
    setImportStatus('Текущий трекер сброшен.');
  }

  function restoreDefaultTracker() {
    const nextTracker = {
      ...defaultTracker,
      stages: withDerivedStatuses(getEmptyStages(defaultTracker.stages)),
    };

    setTracker(nextTracker);
    setExpandedPrompts({});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getStoredTracker(nextTracker)));
    setImportStatus('Загружен дефолтный COMETAL-трекер.');
  }

  async function importTrackerPlan(file: File) {
    try {
      const fileText = await readFileAsText(file);
      const importedTracker = normalizeTrackerConfig(JSON.parse(fileText));
      setTracker(importedTracker);
      setExpandedPrompts({});
      setImportStatus(`Загружен план: ${importedTracker.name}.`);
    } catch {
      setImportStatus('Не удалось загрузить JSON-план. Проверь структуру файла.');
    }
  }

  return (
    <main className="app container py-4 py-md-5">
      <section className="hero card">
        <div className="heroHeader">
          <div>
            <p className="eyebrow">{tracker.eyebrow}</p>
            <h1>{tracker.name}</h1>
            <p className="intro">{tracker.intro}</p>
          </div>
          <div className="heroActions">
            <input
              ref={importInputRef}
              className="importFileInput"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importTrackerPlan(file);
                }
                event.target.value = '';
              }}
            />
            <button className="btn topActionButton" type="button" onClick={() => importInputRef.current?.click()}>
              Import
            </button>
            <button className="btn topActionButton" type="button" onClick={restoreDefaultTracker}>
              Default
            </button>
            <button className="btn topActionButton" type="button" onClick={resetState}>
              Reset
            </button>
            <button className="btn topActionButton" type="button" disabled={isExporting} aria-busy={isExporting} onClick={() => void exportState()}>
              {isExporting ? 'Exporting' : 'Export'}
            </button>
          </div>
        </div>

        <div className="progressPanel" aria-label="Общий прогресс проекта">
          <div className="progressHeader">
            <span>Общий прогресс</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress projectProgress" role="progressbar" aria-label="Общий прогресс" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar projectProgressBar" style={{ width: `${progress}%` }} />
          </div>
          <p>
            Завершено {completedPromptCount} из {totalPromptCount} задач. Этапов закрыто: {completedCount} из {visibleStages.length}.
          </p>
          {importStatus && <p className="importStatus">{importStatus}</p>}
        </div>
      </section>

      <section className="stages" aria-label="Список этапов">
        {visibleStages.map((stage) => {
          const isActiveStage = stage.status === 'in_progress';

          return (
            <article
              className={`stage card stage-${stage.status} ${isActiveStage ? 'stage-active' : ''}`}
              id={`stage-${stage.id}`}
              key={stage.id}
            >
              <div className="stageHeader">
                <div>
                  <h3 className="stageTitle">{formatStageTitle(stage.title)}</h3>
                  <p className="stageDescription">{stage.description}</p>
                </div>
                {stage.status !== 'not_started' && (
                  <span className={`badge rounded-pill status ${statusBadgeClasses[stage.status]}`}>
                    {statusLabels[stage.status]}
                  </span>
                )}
              </div>

              <div className="stagePrompts">
                <span className="outputsTitle">{tracker.taskGroupLabel}</span>
                <div className="promptList">
                  {stage.prompts.map((prompt) => (
                    <PromptCard
                      isCopied={copiedPromptKey === getPromptKey(stage.id, prompt.title)}
                      isExpanded={!!expandedPrompts[getPromptKey(stage.id, prompt.title)]}
                      key={prompt.title}
                      prompt={prompt}
                      onCopy={() => void copyPrompt(prompt.promptText, getPromptKey(stage.id, prompt.title))}
                      onFileAttach={(file) => void attachResultFile(stage.id, prompt.title, file)}
                      onReset={() => resetPrompt(stage.id, prompt.title)}
                      onToggleExpand={() => togglePromptExpand(stage.id, prompt.title)}
                      onToggle={() => togglePrompt(stage.id, prompt.title, true)}
                    />
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default App;
