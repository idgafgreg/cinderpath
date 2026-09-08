// Generate install icons from the source SVG using the optional local sharp tool.
import sharp from 'sharp';
for(const size of [192,512])await sharp('assets/icon.svg').resize(size,size).png().toFile(`assets/icon-${size}.png`);
