import { useStore } from "../store";
import OnboardingClassic from "./OnboardingClassic";
export default function Onboarding() {
  const theme = useStore((s) => s.theme);
  void theme;
  return <OnboardingClassic />;
}
