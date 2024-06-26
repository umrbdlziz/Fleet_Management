const DataYaml = (name, ip, finishing_request, actionCategories) => {
  return {
    rmf_fleet: {
      name: name,
      fleet_manager: {
        prefix: ip,
        user: "some_user",
        password: "some_password",
      },
      limits: {
        linear: [0.5, 2.5],
        angular: [0.7, 3.2],
      },
      profile: {
        footprint: 0.5,
        vicinity: 0.6,
      },
      reversible: true,
      battery_system: {
        voltage: 24.0,
        capacity: 60.0,
        charging_current: 60.0,
      },
      mechanical_system: {
        mass: 80.0,
        moment_of_inertia: 20.0,
        friction_coefficient: 0.2,
      },
      ambient_system: {
        power: 20.0,
      },
      tool_system: {
        power: 760.0,
      },
      recharge_threshold: 0.02,
      recharge_soc: 1.0,
      publish_fleet_state: true,
      account_for_battery_drain: true,
      task_capabilities: {
        loop: true,
        delivery: true,
        clean: true,
        finishing_request: finishing_request, // [park, charge, nothing]
        action_categories: actionCategories,
      },
    },
    robots: {},
    reference_coordinates: {
      rmf: [
        [0.0, 0.0],
        [1.0, 1.0],
        [2.0, 2.0],
        [3.0, 3.0],
      ],
      robot: [
        [0.0, 0.0],
        [1.0, 1.0],
        [2.0, 2.0],
        [3.0, 3.0],
      ],
    },
  };
};

export default DataYaml;
