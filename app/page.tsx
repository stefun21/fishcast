import lakes from "@/data/lakes.generated.json";
import LakesExplorer from "@/components/LakesExplorer";
export default function Page(){return <main><LakesExplorer lakes={lakes as any}/><footer>© FishCast România • Date locații: OpenStreetMap/Geofabrik</footer></main>}
