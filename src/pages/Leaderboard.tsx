import { useStore } from "../store";
import LeaderboardClassic from "./LeaderboardClassic";
export default function Leaderboard() {
  const theme = useStore((s) => s.theme);
  void theme;
  return <LeaderboardClassic />;
}
