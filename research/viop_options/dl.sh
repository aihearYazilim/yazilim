#!/bin/bash
# download full VİOP daily bulletin, keep header + option lines (O_*) + index/FX futures; gzip
d=$1; out=/home/user/yazilim/research/viop_options/raw/opt/o_$d.csv.gz
[ -s $out ] && exit 0
tmp=$(mktemp)
code=$(curl -sS --retry 3 -m 90 -A "Mozilla/5.0" -o $tmp -w "%{http_code}" https://www.borsaistanbul.com/data/vadeli/viop_$d.csv)
if [ "$code" = "200" ] && head -c 5 $tmp | grep -q TARIH; then
  awk -F';' 'NR<=2 || $2 ~ /^O_/ || $2 ~ /^F_XU030/ || $2 ~ /^F_USDTRY/' $tmp | gzip > $out
else echo "$d $code" >> /home/user/yazilim/research/viop_options/raw/opt/_fail.txt; fi
rm -f $tmp
