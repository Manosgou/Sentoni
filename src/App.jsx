import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useKonamiCode } from "@twocatmoon/react-use-konami-code";
import ConfettiExplosion from "react-confetti-explosion";
import { lazy, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import ldb from "localdata";
import LazyComponent from "./components/LazyComponent";
import { appWindow } from "@tauri-apps/api/window";

const Database = lazy(() => import("./views/Database"));
const Sentoni = lazy(() => import("./views/Sentoni"));
const Personnel = lazy(() => import("./views/Personnel"));
const EventType = lazy(() => import("./views/EventType"));
const AttendanceBook = lazy(() => import("./views/AttendanceBook"));
const PersonEventsHistory = lazy(() => import("./views/PersonEventsHistory"));
const Hierarchy = lazy(() => import("./views/Hierarchy"));
const MonthlyEvents = lazy(() => import("./views/MonthlyEvents"));
const Numeration = lazy(() => import("./views/Numeration"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <LazyComponent Component={<Database />} />,
  },
  {
    path: "/sentoni",
    element: <LazyComponent Component={<Sentoni />} />,
  },
  {
    path: "/personnel",
    element: <LazyComponent Component={<Personnel />} />,
  },
  {
    path: "/event-type",
    element: <LazyComponent Component={<EventType />} />,
  },
  {
    path: "/attendance-book",
    element: <LazyComponent Component={<AttendanceBook />} />,
  },
  {
    path: "/person-events-history",
    element: <LazyComponent Component={<PersonEventsHistory />} />,
  },
  {
    path: "/hierarchy",
    element: <LazyComponent Component={<Hierarchy />} />,
  },
  {
    path: "/monthly-events",
    element: <LazyComponent Component={<MonthlyEvents />} />,
  },
  {
    path: "/numeration",
    element: <LazyComponent Component={<Numeration />} />,
  },
]);

const App = () => {
  const [isExploding, setIsExploding] = useState(false);
  useKonamiCode(() => setIsExploding(true), {
    sequence: ["2", "1", "l", "m", "x"],
  });
  useHotkeys("Escape", () => {
    if (
      window.location.pathname !== "/" &&
      window.location.pathname !== "/sentoni"
    ) {
      window.location.pathname = "/sentoni";
    }
  });
  appWindow.onCloseRequested(async () => {
    ldb.delete("eventTypes");
    localStorage.removeItem("isEffectDisplayed");
  });
  return (
    <>
      {isExploding && (
        <ConfettiExplosion
          onComplete={() => setIsExploding(false)}
          force={0.6}
          duration={2500}
          particleCount={250}
          width={2400}
        />
      )}
      <RouterProvider router={router} />
    </>
  );
};

export default App;
