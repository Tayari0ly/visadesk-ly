#!/usr/bin/env bash
set -euo pipefail

mkdir -p data/sources

curl -L --fail --max-time 120 \
  'https://datosabiertos.jcyl.es/web/jcyl/risp/es/turismo/alojamientos_hoteleros/1284211831639.csv' \
  -o data/sources/castilla-y-leon-alojamientos_hoteleros.csv

curl -L --fail --max-time 120 \
  'https://dadesobertes.gva.es/dataset/247d0314-ecb0-4d25-a0f3-bd3d977fc911/resource/14c4f098-0d26-4b8b-aa7d-9c670632748a/download/listarthoteles_20260317.csv' \
  -o data/sources/valencia-hoteles.csv

curl -L --fail --max-time 120 \
  'https://analisi.transparenciacatalunya.cat/api/v3/views/t2h3-cgys/export.csv?accessType=DOWNLOAD' \
  -o data/sources/catalonia-accommodation.csv

echo 'Downloaded regional hotel sources into data/sources.'
