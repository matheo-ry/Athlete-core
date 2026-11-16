import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { Spinner } from '@/core/ui';

import { useTemplates } from '../api/useTemplates';
import { visibleTemplates } from '../model/template-list';
import { AssignDialog } from './AssignDialog';
import { AssignForm } from './AssignForm';
import { SelectField } from './SelectField';

interface AssignToClientProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onAssigned: (templateName: string) => void;
}

/**
 * "Asignar una plantilla" desde la ficha (PR 2.14b): la ventana del PR 2.13
 * con el cliente ya elegido y un desplegable de plantillas activas.
 */
export function AssignToClient({ clientId, clientName, onClose, onAssigned }: AssignToClientProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const templates = useTemplates();
  const active = visibleTemplates(templates.data ?? [], 'active', '', language);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const template = active.find((item) => item.id === chosenId) ?? active[0];

  return (
    <AssignDialog
      title={t('programs.clientActions.assignTitle', { name: clientName })}
      onClose={onClose}
    >
      {templates.isPending ? <Spinner /> : null}
      {templates.isSuccess && template === undefined ? (
        <p className="text-muted">{t('programs.clientActions.noTemplates')}</p>
      ) : null}
      {template === undefined ? null : (
        <AssignForm
          template={template}
          clientId={clientId}
          header={
            <SelectField
              label={t('programs.clientActions.template')}
              value={template.id}
              options={active.map((item) => ({ value: item.id, label: item.name }))}
              onChange={setChosenId}
            />
          }
          onCancel={onClose}
          onAssigned={() => onAssigned(template.name)}
        />
      )}
    </AssignDialog>
  );
}
