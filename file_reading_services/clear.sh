#!/bin/bash Script for clearing system cache

sudo sync
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'


