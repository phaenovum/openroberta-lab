#!/bin/bash
divisions=( "es" "ms" "hs" )
for division in "${divisions[@]}"
do
	inkscape "blank_${division}.svg" --export-text-to-path --export-plain-svg --export-filename="blank_${division}_.svg"
	scour -i "blank_${division}_.svg" -o "${division}/labyrinth.svg"
	rm "blank_${division}_.svg"
done
