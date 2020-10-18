#!/bin/bash

red="#e40303"
orange="#ff8c00"
yellow="#ffed00"
green="#008026"
blue="#004dff"
purple="#750787"

colors=( "${red}" "${yellow}" "${green}" "${blue}" )
paths=( "north" "east" "south" "west" )
divisions=( "MS" )

# A short help message.
usage () {
	echo "Usage: $0 [-h] -o output.svg <input.svg>" >&2
	[[ $# -eq 1 ]] && exit $1 || exit 1
}

set_path_color () {
	local path=$1
	local color=$2
	local input_file=$3
	local output_file=$4
	sed "/^\s*inkscape\:label=\"${path}\"$/{
	N;N
	s/\(^\s*inkscape:label=\"${path}\"\n.*\n.*\"\).*\(\"\)/\1${color}\2/}" "${input_file}" > "${output_file}"
}

set_division () {
	local division=$1
	local input_file=$2
	local output_file=$3
	sed "/^\s*inkscape\:label=\"division\"$/{
	N;N;N;N;N;N;
	s/\(^\s*inkscape:label=\"division\"\n.*\n.*\n.*\n.*\n.*\n.*\">\).*\(<\/tspan><\/text><g\)/\1${division}\2/}" "${input_file}" > "${output_file}"
}

while getopts 'o:46h' OPTION ; do
	case $OPTION in
		o)
			output_file="${OPTARG}"
			;;
		4) #noop
			;;
		6) HS=1
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
	output_file_base=$(basename $output_file .svg)
	output_file_dir=$(dirname $output_file)
	count=0
	colors_sz=${#colors[*]}
	for division in "${divisions[@]}"
	do
		for (( i=0; i<$(( $colors_sz )); i++ ))
		do
			for (( j=0; j<$(( $colors_sz )); j++ ))
			do
				for (( k=0; k<$(( $colors_sz )); k++ ))
				do
					for (( l=0; l<$(( $colors_sz )); l++ ))
					do
						if [ -z ${HS+x} ]
						then
							if [ $i -ne $j ] && [ $i -ne $k ] && [ $i -ne $l ] && [ $j -ne $k ] && [ $j -ne $l ] && [ $k -ne $l ]
							then
								rainbow=("${colors[i]}" "${colors[j]}" "${colors[k]}" "${colors[l]}")
								cp ${input_file} "${output_file_dir}/temp_${output_file_base}_in0.svg"
								temp_input_file="${output_file_dir}/temp_${output_file_base}_in0.svg"
								for x in {0..3}
								do
									temp_output_file="${output_file_dir}/temp_${output_file_base}_out$x.svg" #TODO: file extension
									echo "$count: set ${paths[x]} to ${rainbow[x]} in $temp_input_file => $temp_output_file"
									set_path_color "${paths[x]}" "${rainbow[x]}" "$temp_input_file" "$temp_output_file"
									mv "${temp_output_file}" "${output_file_dir}/temp_${output_file_base}_in$(($x+1)).svg"
									temp_input_file="${output_file_dir}/temp_${output_file_base}_in$(($x+1)).svg"
									#inkview ${temp_input_file}
								done

								set_division "${division}" "${temp_input_file}" "${output_file_dir}/${output_file_base}_$count.svg"
								rm "${temp_input_file}"
								inkview "${output_file_dir}/${output_file_base}_$count.svg"
								((count++))
								echo $count
							fi
						else
							colors=( "${red}" "${orange}" "${yellow}" "${green}" "${blue}" "${purple}" )
							division=( "HS" )
							paths=( "northeast" "east" "southeast" "southwest" "west" "northwest" )
							for (( m=0; m<$(( $colors_sz )); m++ ))
							do
								for (( n=0; n<$(( $colors_sz )); n++ ))
								do
									if [ $i -ne $j ] && [ $i -ne $k ] && [ $i -ne $l ] && [ $i -ne $m ] && [ $i -ne $n ] && [ $j -ne $k ] && [ $j -ne $l ] && [ $j -ne $m ] && [ $j -ne $n ] && [ $k -ne $l ] && [ $k -ne $m ] && [ $k -ne $n ] && [ $l -ne $m ] && [ $l -ne $n ] && [ $m -ne $n ]
									then
										rainbow=("${colors[i]}" "${colors[j]}" "${colors[k]}" "${colors[l]}" "${colors[m]}" "${colors[n]}")
										cp ${input_file} ${output_file_dir}/"temp_${output_file_base}_in0.svg"
										temp_input_file="${output_file_dir}/temp_${output_file_base}_in0.svg"
										for x in {0..5}
										do
											temp_output_file="${output_file_dir}/temp_${output_file_base}_out$x.svg" #TODO: file extension
											echo "$count: set ${paths[x]} to ${rainbow[x]} in $temp_input_file => $temp_output_file"
											set_path_color "${paths[x]}" "${rainbow[x]}" "$temp_input_file" "$temp_output_file"
											mv "${temp_output_file}" "${output_file_dir}/temp_${output_file_base}_in$(($x+1)).svg"
											temp_input_file="${output_file_dir}/temp_${output_file_base}_in$(($x+1)).svg"
											#inkview ${temp_input_file}
										done

										set_division "${division}" "${temp_input_file}" "${output_file_dir}/${output_file_base}_$count.svg"
										rm "${temp_input_file}"
										#inkview "${output_file_dir}/${output_file_base}_$count.svg"
										((count++))
										echo $count
									fi
								done
							done
						fi
					done
				done
			done
		done
	done
	rm ${output_file_dir}/temp_${output_file_base}*
fi
