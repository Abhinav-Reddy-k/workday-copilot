import { Typography } from "antd";
import Lottie from "lottie-react";
import analysingAnimation from "../animations/scanning.json";

export const ProcessingAnimation = () => {
  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <Lottie
        animationData={analysingAnimation}
        loop={true}
        style={{ width: 200, height: 200 }}
      />
      <Typography.Text type="secondary">
        Analysing your resume...
      </Typography.Text>
    </div>
  );
};
