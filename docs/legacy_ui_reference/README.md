
## Opening

**When shown:** When application is opened
**Screenshot:** `docs\legacy_ui_reference\screenshots\Openingscreen.png`

### Notes
Blank screen shown upon opening the application. I prefer the current implementaion we have where it instructs you how to open a file. Hovering over the menu at the top makes the options below appear. *GREYED OUT* means that the option is greyed out in the inital opening screen and is an option for some later step.


## New survey opened

**When shown:** Survey -> New Survey -> .md2 file selected
**Screenshot:** `docs\legacy_ui_reference\screenshots\newsurvey.png`

### Notes
Sweep 1 of the survey appears as flux vs declination in the first panel. Important that it is shown as points, not a connected line, this is important for the students understanding of the descrete nature of data taken from the telescope. Additionally, accept sweep is grayed out until you calibrate the survey,that step is detailed next. Hovering over any point on the graph displays the ra, dec, and flux (in volts until it is calibrated, janskies if it is calibrated) in the lower right hand corner. Though currently not implemented I would like it if you click on a point on the graph it keeps the ra dec and flux that of the point you clicked until you click again to disable that, instead of changing when you move your mouse. Note that sweep 1 does not include the calibration sweeps, which should be flagged differently. 

## Main Menu Screens

**When shown:** When clicking on menu items before any file is uploaded
**Screenshots:** `docs\legacy_ui_reference\screenshots\filemenu.png`
                 `docs\legacy_ui_reference\screenshots\imagemenu.png`
                 `docs\legacy_ui_reference\screenshots\surveymenu.png`
                 `docs\legacy_ui_reference\screenshots\scanmenu.png`
                 `docs\legacy_ui_reference\screenshots\Calibrationmenu.png`

### Notes
Calibration could be renamed to flux calibration to avoid confusion with the gain calibration that is performed on the file. This calibration is where a calibrator file (that has been converted to janskies by using a known source) is uploaded to convert the units from volts to janskies, this can be done during any step of the process. 

## Calibrate Survey

**When shown:** Survey opened -> calibrate survey
**Screenshot:** `docs\legacy_ui_reference\screenshots\calibratesurvey.png`

### Notes
Calibrate survey button at the top slightly seperated from other buttons as it is the final step in calibration. Below that are the cut segement, select declination and cancel buttons. Cancel simply exits you out of the calibration screen back to the new survey opened screen. The top panel is flux vs RA and the bottom panel is declination vs RA.

## Cut Segment

**When shown:** Cut segement 
**Screenshot:** `docs\legacy_ui_reference\screenshots\cutsegment.png`

### Notes
Allows for drag on the flux vs ra screen to cut bad calibration values. Selection hightlights everything between the points clicked (vertically). After dragging to select and clicking, the points are removed from both the flux vs ra and declination vs ra plots. If you go off graph when selecting, it should select up to the very last point. Not in the legacy version, but an undo button should be added to undo removing the points that were last removed. After the user is satisfied, Calibrate Survey is clicked and gain calibration on the remaining calibration is performed. 
