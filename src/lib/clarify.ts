import { StructuredExperiment, ExtractedEntity, MissingField } from '@/types/experiment';

function updateSingleEntityWithResolution(
  entity: ExtractedEntity,
  clarificationResolutions: Record<string, string>,
  updatedFilters: string[]
): ExtractedEntity {
  const isHoldingPeriodField = entity.field === 'holdingPeriod';
  const hasResolvedHoldingPeriod = Boolean(clarificationResolutions.holdingPeriod);

  if (isHoldingPeriodField && hasResolvedHoldingPeriod) {
    return {
      ...entity,
      value: clarificationResolutions.holdingPeriod,
      status: 'specified',
      confidence: 1.0
    };
  }

  const isExitConditionField = entity.field === 'exitCondition';
  const hasResolvedExitCondition = Boolean(clarificationResolutions.exitCondition);

  if (isExitConditionField && hasResolvedExitCondition) {
    return {
      ...entity,
      value: clarificationResolutions.exitCondition,
      status: 'specified',
      confidence: 1.0
    };
  }

  const isTimeframeField = entity.field === 'timeframe';
  const hasResolvedTimeframe = Boolean(clarificationResolutions.timeframe);

  if (isTimeframeField && hasResolvedTimeframe) {
    return {
      ...entity,
      value: clarificationResolutions.timeframe,
      status: 'specified',
      confidence: 1.0
    };
  }

  const isFiltersField = entity.field === 'filters';
  const hasResolvedFilters = Boolean(clarificationResolutions.filters);

  if (isFiltersField && hasResolvedFilters) {
    return {
      ...entity,
      value: updatedFilters,
      status: 'specified',
      confidence: 1.0
    };
  }

  return entity;
}

export function resolveExperimentClarifications(
  experiment: StructuredExperiment,
  clarificationResolutions: Record<string, string>
): StructuredExperiment {
  const updatedExperiment = { ...experiment };

  const combinedResolvedClarifications = {
    ...updatedExperiment.resolvedClarifications,
    ...clarificationResolutions
  };
  updatedExperiment.resolvedClarifications = combinedResolvedClarifications;

  const resolvedHoldingPeriod = clarificationResolutions.holdingPeriod;
  if (resolvedHoldingPeriod) {
    updatedExperiment.holdingPeriod = resolvedHoldingPeriod;
  }

  const resolvedExitCondition = clarificationResolutions.exitCondition;
  if (resolvedExitCondition) {
    updatedExperiment.exitCondition = resolvedExitCondition;
  }

  const resolvedTimeframe = clarificationResolutions.timeframe;
  if (resolvedTimeframe) {
    updatedExperiment.timeframe = resolvedTimeframe;
  }

  const resolvedVolatilityFilter = clarificationResolutions.filters;
  if (resolvedVolatilityFilter) {
    const nonGenericFilters = updatedExperiment.filters.filter(
      (filterText) => !filterText.toLowerCase().includes('volatility filter')
    );
    nonGenericFilters.push(resolvedVolatilityFilter);
    updatedExperiment.filters = nonGenericFilters;
  }

  const updatedEntities = updatedExperiment.entities.map((currentEntity) =>
    updateSingleEntityWithResolution(
      currentEntity,
      clarificationResolutions,
      updatedExperiment.filters
    )
  );
  updatedExperiment.entities = updatedEntities;

  const remainingMissingFields = updatedExperiment.missingFields.filter(
    (missingField) => {
      const fieldKey = missingField.field as string;
      const isFieldNewlyResolved = Boolean(clarificationResolutions[fieldKey]);
      const isFieldPreviouslyResolved = Boolean(combinedResolvedClarifications[fieldKey]);
      const isAlreadyResolved = isFieldNewlyResolved || isFieldPreviouslyResolved;
      return !isAlreadyResolved;
    }
  );
  updatedExperiment.missingFields = remainingMissingFields;
  updatedExperiment.ambiguityScore = remainingMissingFields.length;
  updatedExperiment.isFullySpecified = remainingMissingFields.length === 0;
  updatedExperiment.updatedAt = new Date().toISOString();

  return updatedExperiment;
}
