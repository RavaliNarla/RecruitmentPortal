import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrgVacancyDistributionConfig } from "../services/orgVacancyDistributionService";

// Recruiter-facing gate for SuperAdminPortal's Vacancy Breakdown toggles
// (Eligibility Configuration > Vacancy Distribution): whether this org wants
// category-wise and/or state-wise vacancy distribution collected on Add
// Position at all. Defaults to both enabled while loading/on error so the
// form never flash-hides a section the org actually has turned on.
export default function useOrgVacancyDistribution() {
  const { orgSlug } = useParams();
  const [config, setConfig] = useState({
    categoryDistribution: true,
    stateDistribution: true,
  });
  const [loading, setLoading] = useState(Boolean(orgSlug));

  useEffect(() => {
    if (!orgSlug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getOrgVacancyDistributionConfig(orgSlug).then((result) => {
      if (cancelled) return;
      setConfig(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  return { ...config, loading };
}
