Fixed
1. Default scan determine peak should be 2nd order poly, tutorial should suggest they focus only on the peak (screenshot needs updating)

Fixed
2. Move change model type to a button on the side of scan screen

Add hover hint
3. save as buttons should only be active when the save button is active (when you hover over grayed out you can say, "must calibrate before saving as .srv or .scn")

Fixed
4. Change to flux calibration menu to have "Select Calibration" and "Open Flux Calibration tool" as well as the save/save as buttons, get rid of new calibration, open calibration and change calibration name  
    Behavior of "Select Calibration" remains the same, behavior of "Open Flux Calibration tool" is The same as what is currently done when you hit new calibration, but if a calibration has already been selected, that calibration is displayed on the plot. When you are adding sources and fitting the line, it shouldn't apply it to your workspace until you hit a new button "apply to workspace" 

Always gives Maximum Call Stack size exceeded error
5. Replace the save as bitmap with save as png

Unresolved
6. Make append scans function the same way as the original tool (it just adds the data onto the plot)

Fixed
7. Remove RFI tool in the survey, as well as the baseline segment tool in scan should be freefloating lines, the same way it is in the removed plot of surveys

Fixed, but should become gray like all other buttons in scan after the file is first calibrated. And before a survey is calibrated, the calibrate button should be blue to match scan
8. Calibrate survey tool should remain available, you can go back and do the gain calibration at any time. 

Fixed
9. Upon open of a scan, All the buttons should be there but grayed out until you calibrate, to match the survey

Fixed
10. When the final sweep on a survey has been accepted, it shouldn't go to the preimage screen, it should just make the create pre image button available, and remain on the last scan  
    Same behavior when you go back to scans from the preimage, the preimage shouldn't regenerate until the "create pre-image" button is pressed

Unresolved
11. When a preimage opens, it flashes an unscaled one first, don't display at all until it is scaled

When it first opens color scale on the preimage should be min-max, excluding nans, but onced baselined it should be 0- max (I don't really understand why we are getting negative fluxes anyways)
12. The color scale on the preimage should be min-max not zero-max

Fixed
13. On the sweeps type in box, remove the up down arrows, the only way they can change that number is to type something in

Fixed
14. If you edit a sweep (after it has been accepted) and then you try to go to the next sweep without hitting apply edits, a pop up should stop and ask if you want to save the edits you made to that sweep, with a yes no option, instead of just not saving the edits

Unresolved
15. If you have made a preimage, and have done any processing to it (ie smooth, baseline, or align) "back to sweeps" should take you back to the data that has been processed (ie all the data should be baselined if you've already done the baseline in the preimage)

Edges of bars in the preimage are now zero flux, they should be nan
16. Remove the gridlines in the preimage

See 16 notes
17. Dark modes nan blank plotting color doens't match the background color exactly, it should

Fixed
18. Remove the cancel button in surveys and scans. 

Fixed, a bit buggy but it is okay for now
19. When you zoom in, the aspect ratio should match what you've zoomed in on

Fixed, but now it pins where your cursor ends up on the zoomed out screen, it shouldnt pin at all/should leave if you had a point pinned before the zoom in
20. When you zoom back out it shouldn't pin where you zoom out

Fixed
21. Add ctrl + and ctrl - to zoom in and out of the windows

Fixed
22. Right click shouldn't zoom in at all

Unresolved
23. When you zoom in and close the magnifier, it doesn't let you zoom back out, needs fix

Fixed
24. Where the close magnifer button is when you have it open, there should always be an open magnifier button

Fixed
25. The magnifer should always be square on the dec corrected sky, and the size should be defined in degrees

Fixed
26. Remove save buttons on image screen

Fixed
27. Reorder image right hand side to be Open Magnifier/Close Magnifier, The magnifier opens right under that, the pin/hover values under that, and the sum average and sum outside buttons at the bottom

Fixed
28. Open magnifier shouldn't pin a point

