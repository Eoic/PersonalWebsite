#!/bin/bash

rm -rf build ;
mkdir -p build/{js,css,images} ;
cp -r assets/images/ build/ ;
cp -t build/ assets/index.html assets/sitemap.xml ;
npm run minify-js ;
npm run minify-css ;
