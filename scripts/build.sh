#!/bin/bash

rm -rf build ;
mkdir -p build/{js,css,images} ;
python htmlgen/main.py build/
cp -r assets/images/ build/ ;
cp -t build/ assets/sitemap.xml ;
npm run minify-js ;
npm run minify-css ;
