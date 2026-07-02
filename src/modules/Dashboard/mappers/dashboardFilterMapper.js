export const mapDashboardFilters = (response) => {
  const data = response?.data || {};

  // const positions = [
  //   ...new Map(
  //     (data.positions || []).map((item) => [
  //       `${item.dept_id}-${item.position_name}`,
  //       {
  //         label: item.position_name,
  //         value: item.position_id,
  //         departmentId: item.dept_id,
  //         employmentTypeId: item.employment_type_id,
  //       },
  //     ])
  //   ).values(),
  // ];
  const positions =
    data.positions?.map((item) => ({
      label: item.position_name,
      value: item.position_id,
      departmentId: item.dept_id,
      employmentTypeId: item.employment_type_id,
    })) || [];

  const departments = [
    ...new Map(
      (data.positions || []).map((item) => [
        item.dept_id,
        {
          label: item.department_name,
          value: item.dept_id,
        },
      ])
    ).values(),
  ];

  const zones =
    data.zones?.map((item) => ({
      label: item.zone,
      value: item.zone,
    })) || [];

  const recruiters =
    data.recruiters?.map((item) => ({
      label: item.recruiter_name,
      value: item.recruiter_id,
      roleName: item.role_name,
    })) || [];

  const employmentTypes =
    data.employmentTypes?.map((item) => ({
      value: item.employment_type_id,
      label: item.type_name,
      code: item.type_code,
    })) || [];
  const reinitialized =
    data.reinitialized?.map((item) => ({
      label: item.label,
      value: item.is_reinitialized,
    })) || [];
  const dateRangePresets =
    data.dateRangePresets
      ?.filter((item) =>
        ["FINANCIAL_YEAR", "CALENDAR_YEAR", "QUARTER", "CUSTOM"].includes(
          item.preset_code
        )
      )
      .map((item) => ({
        value: item.preset_code,
        label: item.preset_label,
      })) || [];
  return {
    positions,
    departments,
    zones,
    recruiters,
    employmentTypes,
    reinitialized,
    dateRangePresets,
  };
};
