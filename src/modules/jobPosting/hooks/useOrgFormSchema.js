import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrgFormSchema } from "../services/orgFormSchemaService";

// This repo identifies the current organization via the URL (every protected
// route is nested under /:orgSlug — see AppRoutes.js), so we read it from
// route params rather than from Redux user state.
export default function useOrgFormSchema(formKey) {
  const { orgSlug } = useParams();
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(Boolean(orgSlug));

  useEffect(() => {
    if (!orgSlug) {
      setSchema(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getOrgFormSchema(orgSlug, formKey).then((result) => {
      if (cancelled) return;
      setSchema(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [orgSlug, formKey]);

  return { schema, loading };
}
