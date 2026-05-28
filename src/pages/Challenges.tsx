import { useStore } from "../store";
import ChallengesClassic from "./ChallengesClassic";
export default function Challenges() {
  const theme = useStore((s) => s.theme);
  void theme;
  return <ChallengesClassic />;
}
