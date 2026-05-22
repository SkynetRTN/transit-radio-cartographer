
# Opening

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

## About Karaleah

**When shown:** About karaleah
**Screenshots:** `docs\legacy_ui_reference\screenshots\aboutkaraleah.png`

### Notes
About karaleah screen, button should be changed to about OG Radio Cartographer, and instead of Karaleah in the version option, it should be OG Radio Cartographer, I want to keep the 2000s type look of the screen though, in regards to the font


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
Pop up that allows numerical input appears asking for Baseline Length (degrees), default value is 5 (degrees), when a user clicks okay that baseline is applied to the image. Baseline subtraction is done on the image so that the background value of the image is zero in most places.

## Align Sweeps

**When shown:** Align Sweeps
**Screenshot:** `docs\legacy_ui_reference\screenshots\alignsweeps.png`

### Notes
Pop up that allows numerical input appears asking for Maximum Declination Shift (degrees), default value is 0.5 (degrees), when a user clicks okay that alignment is applied to the image. Shift is applied in both directions, in order to align the map.


# Scan Processing

## Open Scan

**When shown:** Scan -> New Scan -> MD1 file selected
**Screenshot:** `docs\legacy_ui_reference\screenshots\newscan.png`

### Notes
Screen that opens up a new scan, very similar to the screen when you open a new survey. Key differences are that instead of the first scan of a survey, this is the full scan, calibration is shown but there are lines for where the calibration on section ends and where the calibration off section ends. RA Dec and Flux are still in the lower right, I would like to carry over the pinning a point functionality already in the survey infastructure. Selecting calibrate scan from here brings you to the same calibration screen as in the survey, after scan has been calibrated select declination button becomes available and the calibration portions of the scan disappear from the plot.

## Select Declination

**When shown:** Select Declination

### Notes
Same implementation of select declination as in the calibration screen but for the entire scan

## Baseline Source

**When shown:** Baseline Source
**Screenshot:** `docs\legacy_ui_reference\screenshots\scanbaselinesource.png` 
                `docs\legacy_ui_reference\screenshots\scanbaselinesourceduring.png`

### Notes
Similar to baseline segment in terms of ui and feel and what the user does, but functionally very different. Instead of removing what was covered up, it is using this as a background level of the scan. Should bring the flux values of the edges of the source near zero.


## Determine peak

**When shown:** Determine peak
**Screenshot:** `docs\legacy_ui_reference\screenshots\determinepeak.png` 

### Notes
Button not available until calibrate scan and select declination have been performed. A blue horizontal line appears at the level of a users cursor and after the user has clicked, below the determine peak button "Peak Flux: XXX" appears, in whatever unit the scan is in (either GCU or Jy). The XXX is the highest flux on the line they selected. It is important not to use the max flux of the entire scan, because there could be two sources, one lower than the other and you want the peak flux of whichever you are clicking. 

## Cut Segment

**When shown:** Cut Segment


### Notes
Same implementation as the cut segement function in the calibration screen

# Calibration

## Select Calibration
**When shown:** Calibration -> Select Calibration

### Notes
a .cal file can be selected, it should have a conversion factor that can move from gain cal units to janskies

## New Calibration
**When shown:** Calibration -> New Calibration
**Screenshot:** `docs\legacy_ui_reference\screenshots\newcalibration.png` 

### Notes
Used to create a new .cal file

## Add Source
**When shown:** Add Source
**Screenshot:** `docs\legacy_ui_reference\screenshots\addsource.png` 

### Notes
Select a .scn file and a ui pops up asking for the known flux of the source (in janskies), for a cas a source, it defaults to 1581. It should plot something but the plotting doesn't seem to work, dive into the legacy code to see what it is supposed to do.

## Fit Calibration
**When shown:** Fit Calibration


### Notes
Currently brings a pink line that you move around to fit the slope of known vs measured flux, but in the new version instead of manually fitting it should just create a best fit line and add it to the plot when the button is pressed


# Image

## The Magnifier
**When shown:** In image screen
**Screenshot:** `docs\legacy_ui_reference\screenshots\magnifier.png` 

### Notes
When you have an image open, you can right click and a box around your cursor will appear (there could be a different way to get it such as double clicking a reason or selecting the region) This opens a magnifier in the lower right that has the box you've clicked on but rescaled so that the brightest things are on the bright end of the color palette, even if the whole thing is the same color with the scaling of the whole image. I also want to add a similar "pinning" of points where if you click on a point on the map or on the magnified box it locks the ra, dec and flux, the release needs to be something other than clicking empty space because there won't be much empty space in the map

## Open Image/Save Image/Save Image As/Save Bitmap as
**When shown:** When items clicked from "image menu"


### Notes
You should be able to open a .img file, save a .img and save the image as a bitmap, later we would like to add the ability to open fits files as images


## Append Image
**When shown:** Append Image
**Screenshot:** `docs\legacy_ui_reference\screenshots\appendedimage.png` 

### Notes
When you first click append image you must select a .img file to append, then a pop up asks if the images use the same calibration, (unclear what behavior should be if the answer is no) Then you are asked if you want to shift the appending image, if yes it asks for the shift in ra in minutes and in dec in degrees, then asks for the pixel resolution, each of these pop up boxes have a cancel option as well. After you've made it past the dialogs it appends the images, leaving white space if the images aren't directly next to each other, and superimposing if there is overlap. 

## Superimpose Image
**When shown:** Superimpose Image


### Notes
When you first click superimpose image you must select a .img file to superimpose, then a pop up asks if the images use the same calibration, (unclear what behavior should be if the answer is no). Then you are asked if both images are weighted equally, if no you must input the superimposing image weight as a percentage of the image you already have loaded Then you are asked if you want to shift the superimposing image, if yes it asks for the shift in ra in minutes and in dec in degrees, then asks for the pixel resolution, each of these pop up boxes have a cancel option as well. After you've made it past the dialogs it superimposes the images, which works the same as appending if there is no overlap

## Bicolor Image
**When shown:** Bicolor Image
**Screenshot:** `docs\legacy_ui_reference\screenshots\bicolorimage.png` 

### Notes
Opens the file select to select another image, then asks for initial image color (red green, or blue), then for the second image color, also red green or blue (pops up an invalid color selection error if you've selected the same as the inital image) then asks if images use the same calibration and if you want to shift the second image, then creates the images with the assigned colors, seemingly using a function similar to the append 

## Tricolor Image
**When shown:** tricolor Image

### Notes
Current implementation has the button for a tricolored image disabled until you have a bicolored image and when you select it has you select an image and go through the same dialog as the bicolored image but skipping the color selection (just assigning the not-yet-selected color). I would like to also be able to create a tri colored image, by selecting from just a single image and then picking two additional image files and going through the dialogs for that. 

## Show Palette 
**When shown:** Show Palette
**Screenshot:** `docs\legacy_ui_reference\screenshots\showpalette.png` 

### Notes
Allows you to change the palette being used, as well as adjust the min and max flux. In the upper left there in a Flux Range with Min: and Max: input boxes, autofilled with the flux range being used in the image already. If the max is adjusted everything that is above that will just be white (or whatever color is at the top of your palette) You can also upload a .pal file to be used as the palette (examples can be found in fixtures\palettes) you can also make a new palette using the color bars and save the palette as a .pal file to then apply to your image. All changes made here propagate to the image screen when user clicks OK, which also closes the UI. 