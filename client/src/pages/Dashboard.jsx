import { useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  useEffect(() => {
    axios
      .post("http://192.168.1.48:9090/api/Light/PostInfo/", {
        Details: [
          // {
          //   LocationId: "L3A1001",
          //   LightColor: 64,
          //   Twinkle: 0,
          //   IsLocked: 0,
          //   IsMustCollect: 0,
          //   Quantity: 100,
          //   SubText: "11",
          //   BatchCode: "BatchCode",
          //   Name: "Name",
          //   R1: "First Line",
          //   R2: "Second Line",
          //   R3: "Third Line",
          //   SubTitle: "Subtitle",
          //   Title: "Main Title",
          //   Unit: "Unit",
          //   RelateToTower: true,
          // },
          {
            LocationId: "L2A1001",
            LightColor: 64,
            Twinkle: 0,
            IsLocked: 0,
            IsMustCollect: 1,
            Quantity: 100,
            SubText: "11",
            BatchCode: "BatchCode",
            Name: "Name",
            R1: "No. One Line",
            R2: "Second Line",
            R3: "Third Line",
            SubTitle: "SubTitle",
            Title: "Main Title",
            Unit: "Unit",
            RelateToTower: false,
          },
          // {
          //   LocationId: "L1A1001",
          //   LightColor: 64,
          //   Twinkle: 0,
          //   IsLocked: 0,
          //   IsMustCollect: 0,
          //   Quantity: 100,
          //   SubText: "11",
          //   BatchCode: "BatchCode",
          //   Name: "Name",
          //   R1: "No. One Line",
          //   R2: "Second Line",
          //   R3: "Third Line",
          //   SubTitle: "SubTitle",
          //   Title: "Main Title",
          //   Unit: "Unit",
          //   RelateToTower: false,
          // },
        ],
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  return <div>Dashboard</div>;
};

export default Dashboard;
