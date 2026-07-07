const formatApprovalStatus = (status = "") =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusBadge = (status = "") => {
  switch (status) {
    case "L1_PENDING":
      return "warning";

    case "L2_PENDING":
      return "info";

    case "APPROVED":
      return "success";

    case "L1_REJECTED":
    case "L2_REJECTED":
      return "danger";

    default:
      return "secondary";
  }
};
export const mapOfferApprovalCandidate = (item) => {
  const history = item.offerApproval || {};
  const profile = history.candidateProfile || {};
  const application = history.candidateApplication || {};

  return {
    id: history.offerApprovalId,
    offerApprovalId: history.offerApprovalId,
    historyId: history.offerApprovalId,

    offerId: history.offerId,

    candidateId: profile.candidateId,

    name: item.fullName || "-",

    applicationNumber: application.applicationNo || "-",

    score: item.combinedScore || "-",

    status: history.approvalStatus || "-",

    statusLabel: formatApprovalStatus(history.approvalStatus),

    statusBadge: getStatusBadge(history.approvalStatus),

    joiningDate: history.joiningDate || "-",

    state: item.state || "-",

    city: item.city || "-",

    offerReleaseDate: history.offerReleaseDate || "-",

    acceptBefore: history.acceptBeforeDate || "-",

    offerFileUrl: history.offerFileUrl || "",
    letterNumber: item.letterNumber || "-",
  };
};
