
## Opening

**When shown:** When application is opened
**Screenshot:** `docs\legacy_ui_reference\screenshots\Openingscreen.png`

### Notes
Blank screen shown upon opening the application. I prefer the current implementaion we have where it instructs you how to open a file. Hovering over the menu at the top makes the options in the "Main Menu Screens"

## Main Menu Screens

**When shown:** When clicking on menu items before any file is uploaded
**Screenshots:** `docs\legacy_ui_reference\screenshots\filemenu.png`
                 `docs\legacy_ui_reference\screenshots\imagemenu.png`
                 `docs\legacy_ui_reference\screenshots\surveymenu.png`
                 `docs\legacy_ui_reference\screenshots\scanmenu.png`
                 `docs\legacy_ui_reference\screenshots\Calibrationmenu.png`

### Notes
Calibration menu item should be renamed to flux calibration to avoid confusion with the gain calibration that is performed on the file. The "About KaraLeah" option under the file menu should be refactored to "About" 

## New survey opened

**When shown:** Survey -> New Survey -> .md2 file selected
**Screenshot:** `docs\legacy_ui_reference\screenshots\newsurvey.png`

### Notes
Sweep 1 of the survey appears as flux vs declination in the first panel. Important that it is shown as points, not a connected line, this is important for the students understanding of the descrete nature of data taken from the telescope. Additionally, accept sweep is grayed out until you calibrate the survey,that step is detailed next. Hovering over any point on the graph displays the ra, dec, and flux (in volts until it is calibrated, janskies if it is calibrated) in the lower right hand corner. Though currently not implemented I would like it if you click on a point on the graph it keeps the ra dec and flux that of the point you clicked until you click again to disable that, instead of changing when you move your mouse. Note that sweep 1 does not include the calibration sweeps, which should be flagged differently. 

# Calibration

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

## Select Declination

**When shown:** Select Declination
**Screenshot:** `docs\legacy_ui_reference\screenshots\selectdeclination.png`

### Notes
Allows for drag on the declination vs ra plots to cut bad calibration values. Selection hightlights everything between the points clicked (horizonatally). After dragging to select and clicking, all points OUTSIDE of the selected range are removed from both the flux vs ra and declination vs ra plots. If you go off graph when selecting, it should select up to the very last point. Not in the legacy version, but an undo button should be added to undo removing the points that were last removed. After the user is satisfied, Calibrate Survey is clicked and gain calibration on the remaining calibration is performed. Functionally similar to cut segment

# Survey Processing
## Accept Sweep

**When shown:** NA


### Notes
No visual changes, but the sweep is accepted into the survey with any changes that may have been made, or as is if there are no changes. 

## Baseline Segment

**When shown:** Baseline Segment
**Screenshot:** `docs\legacy_ui_reference\screenshots\baselinesegementduring.png`
                `docs\legacy_ui_reference\screenshots\baselinesegementafter.png`

### Notes
Used on a sweep to remove interference. The process is detailed further in Step 5: Accepting Sweeps in `docs\Radio Cartographer Tutorial.docx.pdf`, a user should click on one point and a straight line should start getting drawn and end when the user clicks again. There should be an undo button added to this step that undos the removal of those points. This line should then replace (or be removed depending on how it is currently implemented) the points at the ra that the line is drawn over. This can be done as many times as a user wants to any sweep. these changes are saved when a user accepts the sweep

## Pre Image

**When shown:** After the final sweep is accepted
**Screenshot:** `docs\legacy_ui_reference\screenshots\preimage.png`

### Notes
After all of the sweeps are accepted a pre image is shown, the buttons smooth sweeps, baseline sweeps, and align sweeps become available. 

## Smooth Sweeps

**When shown:** No particular ui elements, but smoothed image replaces the unsmoothed image when "smooth sweeps" is clicked


### Notes
Image smoothing is done, overwrites the image one column at a time so you can see the smoothing happening

## Baseline Sweeps

**When shown:** Baseline Sweeps 
**Screenshot:** `docs\legacy_ui_reference\screenshots\baselinesweeps.png`

### Notes
Pop up that allows numerical input appears asking for Baseline Length (degrees), default value is 5 (degrees), when a user clicks okay that baseline is applied to the image

## Align Sweeps

**When shown:** Align Sweeps
**Screenshot:** `docs\legacy_ui_reference\screenshots\alignsweeps.png`

### Notes
Pop up that allows numerical input appears asking for Maximum Declination Shift (degrees), default value is 0.5 (degrees), when a user clicks okay that alignment is applied to the image
