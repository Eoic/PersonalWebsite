#!/bin/bash

rm -rf build ;
mkdir -p build/{js,css,images} ;
cp -r assets/images/ build/ ;
cp -t build/ assets/sitemap.xml assets/*.html;
npm run minify-js ;
npm run minify-css ;
