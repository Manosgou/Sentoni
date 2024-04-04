import { Suspense } from "react";
import LoadingScreen from "./LoadingScreen";

const LazyComponent = ({ Component }) => {
  return <Suspense fallback={<LoadingScreen />}>{Component}</Suspense>;
};

export default LazyComponent;
