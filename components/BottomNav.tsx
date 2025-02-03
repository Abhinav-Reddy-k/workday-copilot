import { motion } from "framer-motion";
import { RobotOutlined, MenuOutlined } from "@ant-design/icons";

interface BottomNavProps {
  activePath: string;
  onNavigate: (path: string) => void;
  darkMode: boolean;
}

export const BottomNav = ({
  activePath,
  onNavigate,
  darkMode,
}: BottomNavProps) => {
  const navItems = [
    { icon: <RobotOutlined />, label: "AI Fill", path: "/" },
    { icon: <MenuOutlined />, label: "Menu", path: "/menu" },
  ];

  return (
    <motion.div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: darkMode ? "#141414" : "#fff",
        borderTop: `1px solid ${darkMode ? "#303030" : "#f0f0f0"}`,
        height: 64,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0 16px",
        zIndex: 1000,
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {navItems.map((item) => (
        <motion.div
          key={item.path}
          onClick={() => onNavigate(item.path)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            color:
              activePath === item.path
                ? darkMode
                  ? "#1890ff"
                  : "#1890ff"
                : darkMode
                ? "#8c8c8c"
                : "#8c8c8c",
            width: 96,
            position: "relative",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
          <span style={{ fontSize: 12 }}>{item.label}</span>
          {activePath === item.path && (
            <motion.div
              style={{
                position: "absolute",
                bottom: -16,
                width: 48,
                height: 2,
                background: "#1890ff",
              }}
              layoutId="activeTab"
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};
