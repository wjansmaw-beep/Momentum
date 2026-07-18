import { ExperienceKind } from './experienceModel';
import { Company, DayPart, PrototypeContext } from './localIntelligence';

export type GeneratorEvaluationSignal = 'personal' | 'surprising' | 'executable' | 'content-useful';

export type GeneratorEvaluationScenario = {
  id: string;
  kind: ExperienceKind;
  label: string;
  availableMinutes: number;
  dayPart: DayPart;
  company: Company;
  hasKettlebell: boolean;
};

export type GeneratorEvaluationTrial = GeneratorEvaluationScenario & {
  attemptedAt: string;
  status: 'shown' | 'rejected' | 'evaluated';
  experienceId?: string;
  signals: GeneratorEvaluationSignal[];
};

export const generatorEvaluationPlan: GeneratorEvaluationScenario[] = [
  { id: 'outside-short-solo', kind: 'outside', label: 'Korte buitenruimte', availableMinutes: 30, dayPart: 'afternoon', company: 'solo', hasKettlebell: false },
  { id: 'outside-evening-together', kind: 'outside', label: 'Avond samen', availableMinutes: 60, dayPart: 'evening', company: 'together', hasKettlebell: false },
  { id: 'food-morning-solo', kind: 'food', label: 'Snelle ochtendkeuken', availableMinutes: 15, dayPart: 'morning', company: 'solo', hasKettlebell: false },
  { id: 'food-evening-family', kind: 'food', label: 'Samen aan tafel', availableMinutes: 60, dayPart: 'evening', company: 'family', hasKettlebell: false },
  { id: 'movement-short-bodyweight', kind: 'movement', label: 'Kort zonder materiaal', availableMinutes: 15, dayPart: 'midday', company: 'solo', hasKettlebell: false },
  { id: 'movement-kettlebell', kind: 'movement', label: 'Kracht met kettlebell', availableMinutes: 30, dayPart: 'afternoon', company: 'solo', hasKettlebell: true },
  { id: 'restore-transition', kind: 'restore', label: 'Middagovergang', availableMinutes: 15, dayPart: 'afternoon', company: 'solo', hasKettlebell: false },
  { id: 'restore-evening', kind: 'restore', label: 'Rustige avond', availableMinutes: 30, dayPart: 'evening', company: 'together', hasKettlebell: false },
  { id: 'connect-family', kind: 'connect', label: 'Gezinsmoment', availableMinutes: 30, dayPart: 'afternoon', company: 'family', hasKettlebell: false },
  { id: 'connect-together', kind: 'connect', label: 'Ruimte voor elkaar', availableMinutes: 60, dayPart: 'evening', company: 'together', hasKettlebell: false },
  { id: 'learn-short-solo', kind: 'learn', label: 'Kleine ontdekking', availableMinutes: 15, dayPart: 'midday', company: 'solo', hasKettlebell: false },
  { id: 'learn-together', kind: 'learn', label: 'Samen onderzoeken', availableMinutes: 30, dayPart: 'afternoon', company: 'together', hasKettlebell: false },
  { id: 'culture-nearby', kind: 'culture', label: 'Cultuur dichtbij', availableMinutes: 60, dayPart: 'afternoon', company: 'solo', hasKettlebell: false },
  { id: 'culture-evening', kind: 'culture', label: 'Culturele avond', availableMinutes: 120, dayPart: 'evening', company: 'together', hasKettlebell: false },
];

export const scenarioContext = (base: PrototypeContext, scenario: GeneratorEvaluationScenario): PrototypeContext => ({
  ...base,
  availableMinutes: scenario.availableMinutes,
  dayPart: scenario.dayPart,
  company: scenario.company,
  hasKettlebell: scenario.hasKettlebell,
});

export function nextGeneratorEvaluationScenario(trials: GeneratorEvaluationTrial[]): GeneratorEvaluationScenario {
  const attempted = new Set(trials.map((trial) => trial.id));
  const evaluated = new Set(trials.filter((trial) => trial.status === 'evaluated').map((trial) => trial.id));
  const awaitingEvaluation = [...trials].reverse().find((trial) => trial.status === 'shown' && !evaluated.has(trial.id));
  return generatorEvaluationPlan.find((scenario) => scenario.id === awaitingEvaluation?.id)
    ?? generatorEvaluationPlan.find((scenario) => !attempted.has(scenario.id))
    ?? generatorEvaluationPlan.find((scenario) => !evaluated.has(scenario.id))
    ?? generatorEvaluationPlan.reduce((weakest, scenario) => {
      const average = (target: GeneratorEvaluationScenario) => {
        const completed = trials.filter((trial) => trial.id === target.id && trial.status === 'evaluated');
        return completed.reduce((sum, trial) => sum + trial.signals.length, 0) / Math.max(1, completed.length);
      };
      return average(scenario) < average(weakest) ? scenario : weakest;
    }, generatorEvaluationPlan[0]);
}

export const generatorEvaluationProgress = (trials: GeneratorEvaluationTrial[]) => ({
  planned: generatorEvaluationPlan.length,
  attempted: generatorEvaluationPlan.filter((scenario) => trials.some((trial) => trial.id === scenario.id)).length,
  evaluated: generatorEvaluationPlan.filter((scenario) => trials.some((trial) => trial.id === scenario.id && trial.status === 'evaluated')).length,
  rejected: trials.filter((trial) => trial.status === 'rejected').length,
});
