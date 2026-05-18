import { useState } from "react"; import { SurveyView } from "./SurveyView"; import { ScanView } from "./ScanView"; import { CalibrationView } from "./CalibrationView";
export function MainWindow(){const [view]=useState("survey");const hasImage=false;
return <main><nav aria-label='main-menu'><button>File</button><button>Image</button><button>Survey</button><button>Scan</button><button>Calibration</button><button disabled={!hasImage}>Save Image As BMP…</button></nav>{view==="survey"&&<SurveyView/>}{view==="scan"&&<ScanView/>}{view==="cal"&&<CalibrationView/>}</main>}
