import { useTranslation } from 'react-i18next';

import { Card } from '@/core/ui';

import type { ClientProgram } from '../model/assignments';
import { activeMissedDayRule } from '../model/calendar';
import type { MissedDayRule } from '../model/calendar';
import { useSetMissedDayRule } from '../api/useAssignments';

interface MissedDayRuleSectionProps {
  program: ClientProgram;
  clientId: string;
  today: string;
  disabled?: boolean;
}

const RULES: readonly MissedDayRule[] = ['lose', 'recover', 'shift'];

/**
 * El coach elige la regla del día saltado para la rutina con calendario del cliente (PR 3.12, D-125).
 * Explica cada una con una línea.
 */
export function MissedDayRuleSection({
  program,
  clientId,
  today,
  disabled = false,
}: MissedDayRuleSectionProps) {
  const { t } = useTranslation();
  const setRule = useSetMissedDayRule(clientId);
  const currentRule = activeMissedDayRule(program.missedDayRules, today);

  const handleChange = (rule: MissedDayRule) => {
    if (disabled || setRule.isPending || rule === currentRule) {
      return;
    }
    void setRule.mutate({ programId: program.id, rule, today });
  };

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h3 className="font-semibold">{t('programs.missedDayRule.title')}</h3>
        <p className="text-muted text-sm">{t('programs.missedDayRule.subtitle')}</p>
      </div>
      <fieldset className="flex flex-col gap-3" disabled={disabled || setRule.isPending}>
        <legend className="sr-only">{t('programs.missedDayRule.title')}</legend>
        {RULES.map((rule) => {
          const isSelected = rule === currentRule;
          return (
            <label
              key={rule}
              className="border-border hover:bg-background flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name={`missed-day-rule-${program.id}`}
                value={rule}
                checked={isSelected}
                onChange={() => handleChange(rule)}
                className="mt-1 size-4 accent-primary"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {t(`programs.missedDayRule.rules.${rule}.label`)}
                </span>
                <span className="text-muted text-xs">
                  {t(`programs.missedDayRule.rules.${rule}.hint`)}
                </span>
              </div>
            </label>
          );
        })}
      </fieldset>
    </Card>
  );
}
