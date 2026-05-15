import numpy as np
from radio_cartographer.models import Image,Palette,PaletteStop
from radio_cartographer.palette import apply_palette

def test_palette_applies_rgb_interpolation():
    pal=Palette((PaletteStop(0,0,0,0),PaletteStop(10,255,0,0)))
    img=Image('n',0,1,0,1,0,10,0,1,0,1,0,10,1,pal,np.array([[0,5,10]],dtype=np.int16))
    rgb=apply_palette(img,pal)
    assert rgb.shape==(1,3,3)
    assert rgb[0,0,0]==0 and rgb[0,2,0]==255
