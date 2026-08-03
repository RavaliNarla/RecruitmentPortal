export const mapRequisitionToApi = (uiData, dynamicFieldValues = {}) => ({
  requisitionTitle: uiData.title,
  requisitionDescription: uiData.description,
  startDate: uiData.startDate,
  endDate: uiData.endDate,
  cutoffDate: uiData.cutoffDate,
  // Backend entity/DTO field is `dynamicData` (JobRequisitionsEntity.java) —
  // sending `dynamicFieldValues` gets silently dropped by Jackson since it
  // doesn't match any DTO property.
  dynamicData: dynamicFieldValues,
});
