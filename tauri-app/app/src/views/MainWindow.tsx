import { useState } from 'react';
import { SurveyView } from './SurveyView';
import { ScanView } from './ScanView';
import { CalibrationView } from './CalibrationView';
import { PaletteEditor } from './PaletteEditor';
import { AboutBox } from './AboutBox';
export function MainWindow(){
  const [view,setView]=useState<'survey'|'scan'|'cal'|'pal'|'about'>('survey');
  const [hasSurvey]=useState(false); const [hasScan]=useState(false); const [hasImage]=useState(false);
  return <div className='main-window'><nav aria-label='main menu'>
    <button>File</button><button>Image</button><button>Survey</button><button>Scan</button><button>Calibration</button>
    <button disabled={!hasImage}>Save Image As BMP…</button>
  </nav>
  <div>{view==='survey'&&<SurveyView />}{view==='scan'&&<ScanView/>}{view==='cal'&&<CalibrationView/>}{view==='pal'&&<PaletteEditor/>}{view==='about'&&<AboutBox/>}</div>
  <footer>{String(hasSurvey)}{String(hasScan)}</footer></div>
}
