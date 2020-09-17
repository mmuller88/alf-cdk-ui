import React from "react";
import { Typography } from "@material-ui/core";
export interface Props {}

const WelcomePage = () => {
  return (
    <div className="app-wrapper">
      <div style={{ maxWidth: "800px", margin: "auto", marginBottom: "20px" }}>
        <div className="row align-content-center align-items-center">
          <Typography
            variant={"h4"}
            color="textPrimary"
            className="d-flex flex-column  w-75 p-1"
          >
            Willkommen
          </Typography>

          <Typography
            className="d-flex flex-column  w-75 p-1"
            variant={"h5"}
            color={"textSecondary"}
          >
            zum Review des 6. Sprints
          </Typography>

          {/* <img
              src={require("../../../assets/images/uniflow.png")}
              width={830}
              height={300}
              alt="uniFlow-logo"
              title="uniFLow"
          /> */}

          <Typography
            className="d-flex flex-column  w-75 p-1"
            variant={"h5"}
            color={"textSecondary"}
          ></Typography>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
