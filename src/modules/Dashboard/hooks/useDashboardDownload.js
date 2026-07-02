import { useState } from "react";
import { useTranslation } from "react-i18next";
import dashboardService from "../service/dashboardService";
import { toast } from "react-toastify";

const useDashboardDownload = () => {
  const [downloading, setDownloading] = useState(false);
const { t } = useTranslation("dashboard");
  const downloadReport = async ({
    filters = {},
    extension,
    reportScreen,
     committee,
    fileName = "dashboard-report",
  }) => {
    try {
      setDownloading(true);

      const payload = {
        dateRangePreset: filters?.dateRangePreset ?? null,
        fyYear: filters?.fyYear ?? null,
        cyYear: filters?.cyYear ?? null,
        quarter: filters?.quarter ?? null,
        fromDate: filters?.fromDate ?? null,
        toDate: filters?.toDate ?? null,
        departmentId: filters?.departmentId ?? null,
        positionId: filters?.positionId ?? null,
        zone: filters?.zone ?? null,
        stateId: filters?.stateId ?? null,
        cityId: filters?.cityId ?? null,
        recruiterId: filters?.recruiterId ?? null,
        employmentTypeId: filters?.employmentTypeId ?? null,
        isReinitialized: filters?.isReinitialized ?? null,
        extension,
        reportScreen,
         committee,
      };

      const response = await dashboardService.getDashboardDownload(payload);

      const blob = response?.data || response;

      if (blob.type === "application/json") {
        const text = await blob.text();
        const json = JSON.parse(text);

        toast.error(json?.data || json?.message);
        return;
      }

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}${extension}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(t("download_success"));
    } catch (err) {
      console.error("DOWNLOAD ERROR =>", err);

      toast.error(
        err?.response?.data?.data ||
          err?.response?.data?.message ||
          err?.message ||
           t("download_failed")
      );
    } finally {
      setDownloading(false);
    }
  };

  return {
    downloading,
    downloadReport,
  };
};

export default useDashboardDownload;
