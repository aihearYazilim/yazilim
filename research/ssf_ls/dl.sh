#!/bin/bash
# download VİOP daily bulletin, keep header + futures lines only (F_*)
d=$1; out=/home/user/yazilim/research/ssf_ls/raw/viop/f_$d.csv
[ -s $out ] && exit 0
tmp=$(mktemp)
code=$(curl -sS --retry 3 -m 60 -A "Mozilla/5.0" -o $tmp -w "%{http_code}" https://www.borsaistanbul.com/data/vadeli/viop_$d.csv)
if [ "$code" = "200" ] && head -c 5 $tmp | grep -q TARIH; then
  awk -F';' 'NR<=2 || $2 ~ /^F_/' $tmp > $out
else echo "$d $code" >> /home/user/yazilim/research/ssf_ls/raw/viop/_fail.txt; fi
rm -f $tmp
