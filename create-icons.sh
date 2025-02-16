#!/bin/bash

# Create public directory if it doesn't exist
mkdir -p public

# Download the Presidential Seal
curl -o public/seal.png "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Seal_of_the_President_of_the_United_States.svg/800px-Seal_of_the_President_of_the_United_States.svg.png"

# Create favicon.png (32x32)
convert public/seal.png -resize 32x32 public/favicon.png

# Create apple-touch-icon.png (180x180)
convert public/seal.png -resize 180x180 public/apple-touch-icon.png

# Create og-image.png (1200x630) with text
convert public/seal.png -resize 400x400 \
  -gravity center -background '#cc0000' -extent 1200x630 \
  -fill white -gravity center \
  -font Arial -pointsize 60 -annotate +0+250 "US Government News Feed" \
  -pointsize 30 -annotate +0+320 "Stay informed with the latest US government news" \
  public/og-image.png

# Clean up
rm public/seal.png

echo "Icons created successfully!"