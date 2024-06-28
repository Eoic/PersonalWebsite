#!/bin/bash

mkdir -p build/assets/{js,css,images} ;
cp -r assets/images/ build/assets/ ;
cp -t build/ index.html sitemap.xml ;
npm run minify-js ;
npm run minify-css ;