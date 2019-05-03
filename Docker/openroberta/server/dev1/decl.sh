DATE_SETUP='2019-04-19 14:10:00'

PORT=1997
LOG_LEVEL=DEBUG
LOG_CONFIG_FILE=/logback.xml

BRANCH='develop'
# COMMIT='174db1b4f00a91471ff85f17e4785e6cf98625f7' # only, if a commit is deployed
GIT_REPO='git/robertalab'
GIT_UPTODATE=true
START_ARGS='-d robot.whitelist=calliope2017,wedo -d robot.default=calliope2017'
# START_ARGS='-d key1=val1 -d key2=val2' # use to supply parameter when container is started