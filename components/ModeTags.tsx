import { FishingMode } from '@/lib/types'
export default function ModeTags({modes}:{modes?:FishingMode[]}){if(!modes?.length)return null;return <div className="tags">{modes.includes('retention')&&<span className="tag retain">Cu reținere</span>}{modes.includes('catch-release')&&<span className="tag release">Fără reținere</span>}</div>}
