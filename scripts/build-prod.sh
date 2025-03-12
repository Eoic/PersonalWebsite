#!/bin/bash

rm -rf build ;
mkdir -p build/{js,css,images} ;
cp -t build/ assets/images/  ;
cp -t build/ assets/sitemap.xml assets/*.html;
npm run chore:minify-js ;
npm run chore:minify-css ;
