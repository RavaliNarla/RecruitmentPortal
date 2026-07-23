import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrgInclusions } from "../services/orgInclusionsService";

// Recruiter-facing: which of the org's Inclusions (Freedom Fighter,
// Ex-Serviceman, etc.) can be marked applicable to a job posting. Only the
// name/id are used here — an Inclusion's own candidate-facing fields
// (Certificate Number, Issue Date, ...) are never shown to the recruiter.
export default function useOrgInclusions() {
  const { orgSlug } = useParams();
  const [inclusions, setInclusions] = useState([]);
  const [loading, setLoading] = useState(Boolean(orgSlug));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgSlug) {
      setInclusions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getOrgInclusions(orgSlug).then((result) => {
      if (cancelled) return;
      setInclusions(result.inclusions);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  return { inclusions, loading, error };
}
