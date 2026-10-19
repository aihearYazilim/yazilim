#!/bin/bash
# usage: run_bg.sh key  -> runs fetch in background, logs to raw/log_key.txt
cd /home/user/yazilim/research/lp_mm
nohup python3 fetch_chain.py "$1" >> raw/log_"$1".txt 2>&1 &
echo $! > raw/pid_"$1"
