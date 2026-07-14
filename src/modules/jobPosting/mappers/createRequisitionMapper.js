export const mapRequisitionToApi = (uiData, dynamicFieldValues = {}) => ({
  requisitionTitle: uiData.title,
  requisitionDescription: uiData.description,
  startDate: uiData.startDate,
  endDate: uiData.endDate,
  cutoffDate: uiData.cutoffDate,
  dynamicFieldValues,
});
