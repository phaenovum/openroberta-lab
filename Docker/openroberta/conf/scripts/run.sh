#!/bin/bash

DEBUG=false

SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
chmod ugo+rx $SCRIPTDIR/run.sh

CMD=$1; shift
if [ "$CMD" == '-q' ]
then
    CMD=$1; shift
    QUIET='true'
else
    source $SCRIPTDIR/_help.sh
fi
if [ "$CMD" == '-D' ]
then
    CMD=$1; shift
    DEBUG=true
fi

source $SCRIPTDIR/__defs.sh

DATE=$(date '+%Y-%m-%d %H:%M:%S')

[ "$DEBUG" = 'true' ] && echo "$DATE: executing command '$CMD'"
case "$CMD" in
    help)     [ "$QUIET" == true ] && source $SCRIPTDIR/_help.sh ;;
    gen)      SERVER_NAME=$1; shift
              isServerNameValid $SERVER_NAME
              echo "$DATE: generating the server '$SERVER_NAME'"
              source $SCRIPTDIR/_gen.sh
              echo "generating the server '$SERVER_NAME' finished" ;;
    start)    SERVER_NAME=$1
              source $SCRIPTDIR/_stop.sh
              source $SCRIPTDIR/_start.sh ;;
    stop)     SERVER_NAME=$1
              source $SCRIPTDIR/_stop.sh ;;
    deploy)   SERVER_NAME=$1
              echo "$DATE: deploying (generating,starting) the server '$SERVER_NAME'"
              $SCRIPTDIR/run.sh -q gen $SERVER_NAME
              $SCRIPTDIR/run.sh -q start $SERVER_NAME ;;
    autoDeploy) source $SCRIPTDIR/_autodeploy.sh ;;
    startAll) echo '******************** '$DATE' ********************'
              echo 'start database container and all server container'
              $SCRIPTDIR/run.sh -q startDbC
              sleep 10
              serversDOTtxt2SERVER_NAMES
              for SERVER_NAME in $SERVER_NAMES; do
                  $SCRIPTDIR/run.sh -q start $SERVER_NAME
              done ;;
    stopAll)  echo '******************** '$DATE' ********************'
              echo 'stop database container and all server container'
              serversDOTtxt2SERVER_NAMES
              for SERVER_NAME in $SERVER_NAMES; do
                  $SCRIPTDIR/run.sh -q stop $SERVER_NAME
              done
              $SCRIPTDIR/run.sh -q stopDbC ;;
    genNet)   echo "$DATE: generating the openroberta bridge network 'ora-net'"
              docker network create --driver bridge ora-net
              echo "generating the openroberta bridge network 'ora-net' finished" ;;
    genDbC)   echo "$DATE: generating the database image rbudde/openroberta_db:2.4.0"
              docker build -f $CONF_DIR/docker-for-db/DockerfileDb -t rbudde/openroberta_db:2.4.0 $CONF_DIR/docker-for-db
              echo "generating the database image rbudde/openroberta_db:2.4.0 finished" ;;
    startDbC) source $SCRIPTDIR/_dbContainerStop.sh
              source $SCRIPTDIR/_dbContainerStart.sh ;;
    stopDbC)  source $SCRIPTDIR/_dbContainerStop.sh ;;
    backupDb) DATABASE_NAME=$1
              source $SCRIPTDIR/_dbContainerBackup.sh ;;
    network)  echo '******************** '$DATE' ********************'
              echo '******************** network inspect'
              docker network inspect ora-net ;;
    docker-info) echo '******************** '$DATE' ********************'
              echo '******************** system df'
              docker system df
              echo '******************** all images'
              docker images
              echo '******************** all container'
              docker ps -a ;;
    logs)     echo '******************** '$DATE' ********************'
              set $(docker ps --format "{{.Names}}")
              for NAME do
                  echo "******************** $NAME"
                  docker logs --tail 10 $NAME
              done ;;
    test-info) echo '******************** '$DATE' ********************'
              echo '******************** servers.txt'
              cat $SERVER_DIR/servers.txt
              echo '******************** autodeploy.txt'
              cat $SERVER_DIR/autodeploy.txt
              echo '******************** databases.txt'
              cat $BASE_DIR/db/databases.txt
              SERVERNAMES=$(cat $SERVER_DIR/servers.txt)
              set $SERVERNAMES
              for SERVERNAME do
                  echo "******************** decl.sh of server $SERVERNAME"
                  cat $SERVER_DIR/$SERVERNAME/decl.sh
              done ;;
    prune)    echo '******************** '$DATE' ********************'
              echo '******************** removing all exited container ********************'
              docker rm $(docker ps -q -f status=exited)
              echo '******************** removing stale volumes ********************'
              docker volume rm $(docker volume ls -q -f dangling=true)
              echo '******************** remove unused containers, networks, images ********************'
              docker system prune --force ;;
    test)     echo '******************** TEST MODE START ********************'
              source $SCRIPTDIR/_test.sh
              echo '******************** TEST MODE TERMINATED ***************' ;;
    *)        echo "$DATE: invalid command: '$CMD'" ;;
esac
