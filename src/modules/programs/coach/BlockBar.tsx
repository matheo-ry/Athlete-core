import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import { Button, Input } from '@/core/ui';

import { MAX_BLOCKS } from '../model/blocks-editor';
import type { ProgramEditorAction } from '../model/blocks-editor';
import type { ProgramBlock } from '../model/program-document';
import { BlockDuration } from './BlockDuration';
import { useBlockLabel } from './useBlockLabel';
import { useProgramClipboard } from './useProgramClipboard';

interface BlockBarProps {
  blocks: ProgramBlock[];
  selected: number;
  onSelect: (index: number) => void;
  onChange: (action: ProgramEditorAction) => void;
}

/**
 * Los bloques de la rutina (PR 2.16, D-075): cuál se está editando, su nombre
 * y su duración; añadir, duplicar, copiar, ordenar y quitar. Con un solo
 * bloque no sale la fila de bloques.
 */
export function BlockBar({ blocks, selected, onSelect, onChange }: BlockBarProps) {
  const { t } = useTranslation();
  const label = useBlockLabel();
  const { clipboard, copy } = useProgramClipboard();
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const block = blocks[selected];
  const isFull = blocks.length >= MAX_BLOCKS;
  const several = blocks.length > 1;

  if (block === undefined) {
    return null;
  }
  const number = selected + 1;
  const act = (action: ProgramEditorAction, select: number) => {
    setIsConfirmingRemove(false);
    onChange(action);
    onSelect(select);
  };

  return (
    <div className="flex flex-col gap-4">
      {several ? (
        <ol aria-label={t('programs.blocks.label')} className="flex gap-2 overflow-x-auto pb-1">
          {blocks.map((item, index) => (
            <li key={item.id ?? `new-${String(index)}`} className="shrink-0">
              <button
                type="button"
                aria-current={index === selected ? true : undefined}
                onClick={() => {
                  setIsConfirmingRemove(false);
                  onSelect(index);
                }}
                className={cn(
                  'flex min-h-11 flex-col justify-center rounded-xl px-3 py-1 text-left text-sm',
                  'focus-ring',
                  index === selected
                    ? 'bg-primary text-on-primary'
                    : 'bg-background text-foreground',
                )}
              >
                <span className="font-semibold">{label.name(item, index)}</span>
                <span>{label.duration(item)}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {several ? (
        <Input
          label={t('programs.blocks.name', { number })}
          maxLength={40}
          value={block.name ?? ''}
          onChange={(event) =>
            onChange({ type: 'setBlockName', index: selected, name: event.target.value })
          }
        />
      ) : null}

      <BlockDuration
        // Al cambiar de bloque se olvida lo que se estaba escribiendo.
        key={selected}
        block={block}
        number={number}
        isLast={selected === blocks.length - 1}
        onLaps={(laps) => onChange({ type: 'setBlockLaps', index: selected, laps })}
      />

      {several ? (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            disabled={selected === 0}
            aria-label={t('programs.blocks.moveUp', { number })}
            onClick={() => act({ type: 'moveBlock', index: selected, direction: -1 }, selected - 1)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            disabled={selected === blocks.length - 1}
            aria-label={t('programs.blocks.moveDown', { number })}
            onClick={() => act({ type: 'moveBlock', index: selected, direction: 1 }, selected + 1)}
          >
            ↓
          </Button>
          <Button variant="ghost" onClick={() => setIsConfirmingRemove(true)}>
            {t('programs.blocks.remove', { number })}
          </Button>
        </div>
      ) : null}

      {isConfirmingRemove ? (
        <div className="bg-background/50 border-border flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm">{t('programs.blocks.removeConfirm', { number })}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                act({ type: 'removeBlock', index: selected }, Math.max(selected - 1, 0))
              }
            >
              {t('programs.blocks.removeYes')}
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirmingRemove(false)}>
              {t('programs.form.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="border-border flex flex-col gap-2 border-t pt-3">
        <p className="text-sm font-medium">{t('programs.blocks.add')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={isFull}
            onClick={() => act({ type: 'addBlock', from: 'empty' }, blocks.length)}
          >
            {t('programs.blocks.addEmpty')}
          </Button>
          <Button
            variant="secondary"
            disabled={isFull}
            onClick={() => act({ type: 'addBlock', from: 'previous' }, blocks.length)}
          >
            {t('programs.blocks.addCopy')}
          </Button>
          {several ? (
            <Button
              variant="ghost"
              disabled={isFull}
              onClick={() => act({ type: 'duplicateBlock', index: selected }, selected + 1)}
            >
              {t('programs.blocks.duplicate', { number })}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => copy({ kind: 'block', block })}>
            {t('programs.blocks.copy', { number })}
          </Button>
          {clipboard?.kind === 'block' ? (
            <Button
              variant="ghost"
              disabled={isFull}
              onClick={() => act({ type: 'pasteBlock', block: clipboard.block }, blocks.length)}
            >
              {t('programs.blocks.paste')}
            </Button>
          ) : null}
        </div>
        {isFull ? <p className="text-muted text-sm">{t('programs.blocks.full')}</p> : null}
        {several ? <p className="text-muted text-sm">{t('programs.blocks.lastHint')}</p> : null}
      </div>
    </div>
  );
}
