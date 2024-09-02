#!/bin/bash 
# magick convert input.png -fill red -fuzz 5% -draw "color 0,0 floodfill" -fill black +opaque red -fill white -opaque red -alpha off -morphology close diamond test-out.png
# magick convert input.png -negate -blur 5x65000 -threshold 0 -negate -fill red -opaque black test-out2.png
# magick convert input.png \( +clone -fill White -colorize 100%% -background Black -flatten -morphology Dilate Disk:20 -blur 0x1 -alpha Copy -fill Red -colorize 100%%\) +swap -composite test-out-3.png

# \\WORKS\\ makes a border
# magick convert source.png  \( -clone 0 -alpha extract -threshold 0 \) \( -clone 1 -blur 1x65000 -threshold 0 \) \( -clone 2 -fill black -opaque white \) \( -clone 3 -clone 0 -clone 1 -alpha off -compose over -composite \) -delete 0,1,3 +swap -alpha off -compose copy_opacity -composite test-border.png 

# magick convert source.png  \( -clone 0 -alpha extract -threshold 100 \) output.png

# magick convert source.png -alpha extract -fx "a > 0.3 ? 1 : 0" -compose copyopacity output.png
# magick source.png \( +clone -alpha extract -threshold 0 \) -alpha off -compose copyopacity -composite output.png
# magick input.png \( +clone -alpha extract -threshold 0 \) -negate -alpha off -compose copyopacity -composite output.png

# magick input.png \( +clone -alpha extract -channel A -threshold 0 \) -alpha off -compose copyopacity -composite output.png

# Useful
# This outputted all the opaque pixels as white
# magick convert input.png -threshold 0 output.png
# This makes the white transparent, and the transparent white
# magick convert input.png -threshold 0 -negate output.png

# This paints the archer white except for his black eyes and his shadow
# magick convert input.png \( +clone -threshold 0 \) -composite output.png

# \\WORKS\\ These 2 work but remove the eye of the archer
# magick convert input.png -threshold 0 mask.png
# magick convert input.png -alpha on \( +clone -channel a -fx 0 \) +swap mask.png -composite output.png


# Attempt 2 \\WORKS\\
# # Create the transparency mask
# magick convert input.png -threshold 0 mask.png
# # Output the masked pixels
# magick convert input.png -alpha on \( +clone -channel a -fx 0 \) +swap mask.png -composite output.png
# # Add a border
# magick convert output.png  \( -clone 0 -alpha extract -threshold 0 \) \( -clone 1 -blur 1x65000 -threshold 0 \) \( -clone 2 -fill black -opaque white \) \( -clone 3 -clone 0 -clone 1 -alpha off -compose over -composite \) -delete 0,1,3 +swap -alpha off -compose copy_opacity -composite border.png 
# # Now merge back with the original
# magick border.png input.png +swap -compose over -composite final_image.png

# Attempt 3: Now using shell args
# Create the transparency mask
magick convert $1 -threshold 0 +profile icc mask.png
# Output the masked pixels
magick convert $1 -alpha on \( +clone -channel a -fx 0 \) +swap mask.png -composite output.png
# Add a border
magick convert output.png  \( -clone 0 -alpha extract -threshold 0 \) \( -clone 1 -blur 1x65000 -threshold 0 \) \( -clone 2 -fill black -opaque white \) \( -clone 3 -clone 0 -clone 1 -alpha off -compose over -composite \) -delete 0,1,3 +swap -alpha off -compose copy_opacity -composite border.png 
# Now merge back with the original
magick border.png $1 +swap -compose over -composite $1
rm border.png mask.png output.png
