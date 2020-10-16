#!/bin/bash

red="#e40303"
orange="#ff8c00"
yellow="#ffed00"
green="#008026"
blue="#004dff"
purple="#750787"

#colors=( ${red} ${orange} ${yellow} ${green} ${blue} ${purple} )
declare -a colors=( "${red}" "${yellow}" "${green}" "${blue}" )
declare -a paths=( "north" "east" "south" "west" )

# A short help message.
usage () {
    echo "Usage: $0 [-h] -o output.svg <input.svg>" >&2
    [[ $# -eq 1 ]] && exit $1 || exit 1
}

while getopts 'o:h' OPTION ; do
    case $OPTION in
        o)  output_file="${OPTARG}"
            ;;
        h)  usage
            ;;
        \?)
            ;;
        :)
            ;;
        *)  echo "This should never happen..." >&2
            $EXIT_BUG
            ;;
    esac
done
# Skip used flags.
shift $(( OPTIND - 1 ))

if [[ $# -ne 1 || ! -f "$*" && ! -s "$*" ]]
then
	usage 1
else
	input_file=$@
	echo "INPUT: $input_file"
	output_file_base=$(basename $output_file .svg)
	colors_sz=${#colors[*]}
	count=0
	for (( i=0; i<=$(( $colors_sz -1 )); i++ ))
	do
		for (( j=0; j<=$(( $colors_sz -1 )); j++ ))
		do
			for (( k=0; k<=$(( $colors_sz -1 )); k++ ))
			do
				for (( l=0; l<=$(( $colors_sz -1 )); l++ ))
				do
					if [ $i -ne $j ] && [ $i -ne $k ] && [ $i -ne $l ] && [ $j -ne $k ] && [ $j -ne $l ] && [ $k -ne $l ]
					then
						#echo "${colors[i]}":"${colors[j]}":"${colors[k]}":"${colors[l]}"
						rainbow=("${colors[i]}" "${colors[j]}" "${colors[k]}" "${colors[l]}")
						cp ${input_file} "temp_${output_file_base}_in0.svg"
						temp_input_file="temp_${output_file_base}_in0.svg"
						for m in {0..3}
						do
							temp_output_file="temp_${output_file_base}_out$m.svg" #TODO: file extension
							echo "$count: set ${paths[m]} to ${rainbow[m]} in $temp_input_file => $temp_output_file"
							sed "/^\s*inkscape\:label=\"${paths[m]}\"$/{
								 N;N;N
									s/\(^\s*inkscape:label=\"${paths[m]}\"\n.*\"\n.*\n.*\"\).*\(\"\)/\1${rainbow[m]}\2/

							}" "${temp_input_file}" > "${temp_output_file}"
							echo "mv \"${temp_output_file}\" \"temp_${output_file_base}_in$(($m+1)).svg\"" #TODO: file extension
							mv "${temp_output_file}" "temp_${output_file_base}_in$(($m+1)).svg"
							temp_input_file="temp_${output_file_base}_in$(($m+1)).svg"
							#inkview ${temp_input_file}
						done
						echo "mv \"${temp_input_file}\" \"${output_file_base}_$count.svg\""
						mv "${temp_input_file}" "${output_file_base}_$count.svg"
						inkview "${output_file_base}_$count.svg"
						((count++))
						echo $count
					fi
				done
			done
		done
	done
fi
