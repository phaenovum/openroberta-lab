#!/bin/bash

echo "run.sh [-q] [-yes] [-D]                                                   be quiet, answer all questions with 'y', debug mode"
echo "       help                                                               this text"
echo "       docker-info | network | logs | test-info                           container state, network and some log from running containers; info about deployed servers"
echo "       gen <server> | start <server> | stop <server> | deploy <server>    gen builds image, start first tries to stop, deploy is gen&start"
echo "       admin <server> <admin-cmd>                                         execute admin command on server, e.g. 'cleanup-temp-user-dirs'"
echo "       auto-deploy |                                                      check for git changes for servers found in variable AUTODEPLOY"
echo "       start-all | stop-all                                               start/stop db server and server found in variable SERVERS"
echo "       gen-dbc | start-dbc | stop-dbc | backup [<db>]                     generate db server, start and stop db server using variable DATABASES, backup a db"
echo "       backup-save <dbBackup@<remote-host>:<from-path> <to-path>          save a db backup from a remote machine to this machine. <to-path> is relative to BASE-DIR"
echo "       prune                                                              rm as much unused data from docker as possible"
echo "       alive <url> [mail={always|error}] [msg=<msg>]                      is the server alive? When to send mail (default: always). Set an additional mail header"
echo ""
echo "dangerous commands:"
echo "       auto-restart <server> <url>                                        restart a container if <url>/rest/alive doesn't respond within 50 sec (url ~ https://dns:port)"
echo "       gen-net                                                            generate the docker network $DOCKER_NETWORK_NAME"
echo "       start-export <server>                                              start a server from the export dir outside of docker"
