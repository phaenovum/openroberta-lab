#!/bin/bash
divisions=( "es" "ms" "hs" )
for division in "${divisions[@]}"
do
	inkscape "${division}.svg" --export-text-to-path --export-plain-svg --export-filename="${division}_.svg"
	scour -i "${division}_.svg" -o "${division}/linefollowing.svg"
	rm "${division}_.svg"
done
