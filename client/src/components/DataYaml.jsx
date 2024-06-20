const DataYaml = (name, ip, port, finishing_request) => {
  return {
    rmf_fleet: {
      name: name,
      fleet_manager: {
        ip: ip,
        port: port,
        user: "some_user",
        password: "some_password",
      },
      limits: {
        linear: [0.5, 0.75],
        angular: [0.6, 2.0],
      },
      profile: {
        footprint: 0.3,
        vicinity: 0.5,
      },
      reversible: true,
      battery_system: {
        voltage: 12.0,
        capacity: 24.0,
        charging_current: 5.0,
      },
      mechanical_system: {
        mass: 20.0,
        moment_of_inertia: 10.0,
        friction_coefficient: 0.22,
      },
      ambient_system: {
        power: 20.0,
      },
      tool_system: {
        power: 0.0,
      },
      recharge_threshold: 0.1,
      recharge_soc: 1.0,
      publish_fleet_state: 10.0,
      account_for_battery_drain: true,
      task_capabilities: {
        loop: true,
        delivery: true,
        clean: false,
        finishing_request: finishing_request, // [park, charge, nothing]
      },
    },
    robots: {},
  };
};

export default DataYaml;
