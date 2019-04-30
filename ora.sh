#!/bin/bash

function _mkAndCheckDir {
  mkdir -p "$1"
  if [ $? -ne 0 ]
  then
    echo "creating the directory \"$1\" failed - exit 1"
    exit 1
  fi
}

function _aliveFn {
  serverUrl="$1"
  shift
  every="${1:-60}"
  timeout="${2:-30}"
  mail="${3:-no}"

  echo "checking for a server crash of server $serverUrl every $every sec with $timeout sec timeout."
  if [[ "$mail" == 'no' ]]
  then
     echo "no mail will be sent if a crash is detected"
  else
     echo "mail will be sent using the script \"$mail\" if a crash is detected"
  fi
  while :; do
    if [[ "$quiet" == 'true' ]]
    then
       curl --max-time $timeout "http://$serverUrl/rest/alive" > /dev/null
       rc=$?
    else
       curl --max-time $timeout "http://$serverUrl/rest/alive"
       rc=$?
       if [[ $rc == 0 ]]
       then
          echo "ok `date`"
       fi
    fi
    if [[ $rc != 0 ]]
    then
       echo "***** server seems to be down at `date` ******"
       [[ "$mail" != 'no' ]] && sh $mail
    else
	   echo "ok at `date`"
    fi
    sleep $every
  done
}

# check, whether java and javac are on the PATH. Check for the java version.
# variable checkJava contains debug information
function _checkJava {
  checkJava=''
  if [[ "$JAVA_HOME" == '' ]]
  then
     checkJava=${checkJava}$'JAVA_HOME is undefined.\n'
  fi
  which java 2>/dev/null 1>/dev/null
  if [[ $? != 0 ]]
  then
     checkJava=${checkJava}$'java was NOT found on the PATH.\n'
  fi
  which javac 2>/dev/null 1>/dev/null
  if [[ $? != 0 ]]
  then
     checkJava=${checkJava}$'javac was NOT found on the PATH.\n'
  fi
  javaversion=$(java -d64 -version 2>&1)
  case "$javaversion" in
    *not\ support*) checkJava=${checkJava}$'This may be a 32 bit java version. A 64 bit jdk is recommended.\n' ;;
    *)              : ;;
  esac
  javaversion=$(java -version 2>&1)
  case "$javaversion" in
    *1\.8\.*) : ;;
    *)        checkJava=${checkJava}$'This may be a java version less than 1.8.*. A version 8 is recommended.' ;;
  esac
  echo 'you are using the following java runtime:'
  echo "$javaversion"
  echo "$checkJava"
}

function _export {
  exportpath="$1"
	case "$2" in
	  '')     gzip='no' ;;
	  'gzip') gzip='yes' ;;
	  *)      echo "invalid second parameter. Expected 'gzip' or nothing. Exit 12. Got: $2"
            exit 12 ;;
	esac
  if [ -e "$exportpath" ] && [ ! -z "$(ls -A $exportpath)" ]
  then
    echo "target directory \"$exportpath\" exists and is not empty - exit 12"
    exit 12
  else
    :
  fi
  
  _mkAndCheckDir "$exportpath"
  exportpath=$(cd "$exportpath"; pwd)
	serverVersion=$(java -cp OpenRobertaServer/target/resources/\* de.fhg.iais.roberta.main.Administration version)
	serverVersionForDb=$(java -cp OpenRobertaServer/target/resources/\* de.fhg.iais.roberta.main.Administration version-for-db)
  echo "server version: ${serverVersion} - db: ${serverVersionForDb}"
  echo "created the target directory \"$exportpath\""
	
  echo "copying all jars"
  _mkAndCheckDir "${exportpath}/lib"
  cp OpenRobertaServer/target/resources/*.jar "$exportpath/lib"
  
	if [[ -d "Resources/tutorial" ]]
	then
		echo "copying tutorials"
		_mkAndCheckDir "${exportpath}/tutorial"
		cp -r Resources/tutorial/* "${exportpath}/tutorial"
	else
	  echo "no tutorials to copy"
	fi

  echo 'copying the staticResources'
	cp -r OpenRobertaServer/staticResources ${exportpath}/staticResources
	case "$gzip" in
	  'no'  ) echo 'staticResources are NOT gzip-ped. This increases load times when the internet connection is slow' ;;
	  'yes' ) numberGzFiles=$(find ${exportpath}/staticResources -type f | egrep '\.gz$' | wc -l)
		        if [[ $numberGzFiles != 0 ]]
			      then
				      echo "\n$numberGzFiles gz-files found. This should NOT happen. Please CHECK staticResources in the Git repository\n"
			      fi
			      find ${exportpath}/staticResources -type f \
			      | grep -Ev '\.(png|gif|mp3|gz|jpg|jpeg|wav|ogg)$' \
			      | tr '\12' '\0' | tr '\a' '\0' \
			      | xargs -n1 -0 gzip -9 -k -v -f
			      ;;
	esac
	
  echo 'scripts for start&stop of the server/db are copied'
  cp Resources/shScriptsForExport/*.sh ${exportpath}
  chmod ugo+rx ${exportpath}/*.sh
  
	echo "NOTE: You are responsible to supply a usable database in directory db-${serverVersionForDb}"
}

function _updateLejos {
  cd OpenRobertaParent
  run="scp -oKexAlgorithms=+diffie-hellman-group1-sha1 RobotEV3/resources/updateResources/lejos_${lejosVersion}/EV3Menu.jar root@${LEJOSIPADDR}:/home/root/lejos/bin/utils"
  echo "executing: ${run}"
  $run
  run="echo ${serverUrl} | ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 root@${LEJOSIPADDR} \"cat > /home/roberta/serverIP.txt\""
  echo "executing: ${run}"
  $run
  runtime="RobotEV3/resources/updateResources/lejos_${lejosVersion}/EV3Runtime.jar"
  json="RobotEV3/resources/updateResources/lejos_${lejosVersion}/json.jar"
  websocket="RobotEV3/resources/updateResources/lejos_${lejosVersion}/Java-WebSocket.jar"
  run="ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 root@${LEJOSIPADDR} mkdir -p /home/roberta/lib"
  echo "executing: ${run}"
  $run
  run="scp -oKexAlgorithms=+diffie-hellman-group1-sha1 ${runtime} ${json} ${websocket} root@${LEJOSIPADDR}:/home/roberta/lib"
  echo "executing: ${run}"
  $run
  cd ..
}

# ---------------------------------------- begin of the script ----------------------------------------------------
if [ -d OpenRobertaServer ]
then
  :
else
  echo 'please start this script from the root of the Git working tree - exit 1'
  exit 1
fi
cmd="$1"
shift

serverTargetDir="OpenRobertaServer/target/resources"

case "$cmd" in
--export)         _export $* ;;

--start-from-git) echo 'the script expects, that a mvn build was successful; if the start fails or the system is frozen, make sure that a database exists and NO *.lck file exists'
                  echo '1. step: make an optional upgrade of the db 2. step: start the server'
				          case "$1" in
                    '-rdbg') RDBG='-agentlib:jdwp=transport=dt_socket,server=y,address=8000,suspend=y'
						                 shift ;;
                    *)       RDBG='' ;;
                  esac
				          case "$1" in
                    '') CC_RESOURCE_DIR='.' ;;
                    *)  CC_RESOURCE_DIR="$1"
						            shift ;;
                  esac
                  java -cp ${serverTargetDir}/\* de.fhg.iais.roberta.main.Administration upgrade OpenRobertaServer
				          RC=$?;
				          if [ $RC != 0 ]
				          then
					          echo "database upgrade failed. Server NOT started"
					          exit 1
				          fi
                  java $RDBG -cp ${serverTargetDir}/\* de.fhg.iais.roberta.main.ServerStarter \
                       -d database.mode=embedded -d database.parentdir=OpenRobertaServer -d server.staticresources.dir=OpenRobertaServer/staticResources \
                       -d robot.crosscompiler.resourcebase="$CC_RESOURCE_DIR" $* ;;

--gui-sql-client) hsqldbVersion='2.4.0'
				          hsqldbJar="${serverTargetDir}/hsqldb-${hsqldbVersion}.jar"
				          serverVersionForDb="$1"
				          if [[ "$serverVersionForDb" == '' ]]
                  then
					          serverVersionForDb=$(java -cp ./${serverTargetDir}/\* de.fhg.iais.roberta.main.Administration version-for-db)
				          fi
				          databaseurl="jdbc:hsqldb:file:OpenRobertaServer/db-$serverVersionForDb/openroberta-db;ifexists=true"
                  java -jar "${hsqldbJar}" --driver org.hsqldb.jdbc.JDBCDriver --url "$databaseurl" --user orA --password Pid ;;

''|--help|-h)     # Be careful when editing the file 'ora-help.txt'. Words starting with "--" are used for completion by compgen
                  $0 --java
                  cat ora-help.txt ;;

--java)           _checkJava ;;

--update-lejos)   serverUrl="$1"
                  lejosVersion="$2"
				          LEJOSIPADDR='10.0.1.1'
                  if [[ "$serverUrl" == '' ]]
                  then
                    echo "the server URL is missing. Exit 1"
                    exit 1
                  elif [[ "$lejosVersion" == '' ]]
                  then
                    echo "the lejos version (0 or 1) is missing. Exit 1"
                    exit 1
                  fi
                  _updateLejos ;;

--createEmptydb)  serverVersionForDb="$1"
                  if [[ "$serverVersionForDb" == '' ]]
                  then
				            serverVersionForDb=$(java -cp ./${serverTargetDir}/\* de.fhg.iais.roberta.main.Administration version-for-db)
				          fi
				          databaseurl="jdbc:hsqldb:file:OpenRobertaServer/db-$serverVersionForDb/openroberta-db"
				          echo -n "do you really want to create the db for version \"$serverVersionForDb\"? If it exists, it will NOT be damaged. 'yes', 'no') "
                  read ANSWER
                  case "$ANSWER" in
                    yes) : ;;
                    *)   echo "nothing done"
                         exit 0 ;;
                  esac
				          echo "creating an empty db using the url $databaseurl"
				          main='de.fhg.iais.roberta.main.Administration'
                  java -cp ${serverTargetDir}/\* "${main}" createemptydb "$databaseurl" ;;

--checkXSS)  	    serverVersionForDb="$1"
                  if [[ "$serverVersionForDb" == '' ]]
                  then
				            serverVersionForDb=$(java -cp ./${serverTargetDir}/\* de.fhg.iais.roberta.main.Administration version-for-db)
				          fi
                  databaseurl="jdbc:hsqldb:file:OpenRobertaServer/db-$serverVersionForDb/openroberta-db"
				          main='de.fhg.iais.roberta.main.Administration'
                  java -cp ${serverTargetDir}/\* "${main}" checkXSS "$databaseurl" ;;
                  
--renameRobot)    serverVersionForDb="$1"
                  if [[ "$serverVersionForDb" == '' ]]
                  then
				            serverVersionForDb=$(java -cp ./${serverTargetDir}/\* de.fhg.iais.roberta.main.Administration version-for-db)
				          fi
                  databaseurl="jdbc:hsqldb:file:OpenRobertaServer/db-$serverVersionForDb/openroberta-db"
				          main='de.fhg.iais.roberta.main.Administration'
                  java -cp ${serverTargetDir}/\* "${main}" rename "$databaseurl" $2 $3;;
                  
--purgeConfigs)   serverVersionForDb="$1"
                  if [[ "$serverVersionForDb" == '' ]]
                  then
				            serverVersionForDb=$(java -cp ./${serverTargetDir}/\* de.fhg.iais.roberta.main.Administration version-for-db)
				          fi
                  databaseurl="jdbc:hsqldb:file:OpenRobertaServer/db-$serverVersionForDb/openroberta-db"
				          main='de.fhg.iais.roberta.main.Administration'
                  java -cp ${serverTargetDir}/\* "${main}" configurationCleanUp "$databaseurl" ;;

--alive)          _aliveFn $* ;;

--test-setup-update) DATA='/data/openroberta'
                  if [ ! -d $DATA ]
                  then
                      echo "directory '$DATA' not found. Exit 12"
                      exit 12
                  fi
                  rm -rf $DATA/conf
                  cp -r Docker/openroberta/conf $DATA/conf
                  cp Docker/_README.md $DATA
                  echo "configuration data copied to $DATA/conf" ;;

*)                echo "invalid command: $cmd - exit 1"
                  exit 1 ;;
esac

exit 0
