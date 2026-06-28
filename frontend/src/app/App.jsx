import { Routes, Route } from "react-router-dom";
import { AppShell, MobileShell, BottomNavigation } from "../components";
import PlaceholderPage from "./PlaceholderPage";

const NAV_ITEMS = [
  { id: "rooms", label: "Rooms", icon: "🎷", active: true },
  { id: "start", label: "Start", icon: "➕" },
  { id: "profile", label: "You", icon: "🙂" },
];

function HomeLayout() {
  return (
    <MobileShell
      header={<AppShell />}
      bottomNav={<BottomNavigation items={NAV_ITEMS} />}
    >
      <PlaceholderPage />
    </MobileShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route index element={<HomeLayout />} />
    </Routes>
  );
}
