package de.fhg.iais.roberta.util;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.ws.rs.core.Response;

import org.apache.commons.io.FileUtils;
import org.apache.commons.text.StringEscapeUtils;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.owasp.html.HtmlChangeListener;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import de.fhg.iais.roberta.javaServer.restServices.all.ClientAdmin;
import de.fhg.iais.roberta.javaServer.restServices.all.ClientInit;
import de.fhg.iais.roberta.persistence.AbstractProcessor;
import de.fhg.iais.roberta.persistence.util.HttpSessionState;
import de.fhg.iais.roberta.robotCommunication.RobotCommunicationData;
import de.fhg.iais.roberta.robotCommunication.RobotCommunicationData.State;
import de.fhg.iais.roberta.robotCommunication.RobotCommunicator;

public class Util {
    private static final Logger LOG = LoggerFactory.getLogger(Util.class);
    private static String serverVersion;

    private Util() {
        // no objects
    }

    /**
     * TODO: remove this global setting. Injected from the <b>ServerStarter</b> to add version info to all frontend JSON objects. But not nice ... .
     *
     * @param serverVersion the version to set.
     */
    public static void setServerVersion(String serverVersion) {
        Util.serverVersion = serverVersion;
    }

    /**
     * all REST services, excluded is only the /init and the /ping request, have to call this method. It processes the init-token, which protects user and
     * server against<br>
     * - multiple frontend sessions connected to one backend session (see class {@link ClientInit})<br>
     * - a frontend session not backed by a backend session (occurs when the server is restarted)<br>
     *
     * @param httpSessionState
     * @param loggerForRequest
     * @param fullRequest
     * @return
     */
    public static void handleRequestInit(HttpSessionState httpSessionState, Logger loggerForRequest, JSONObject fullRequest) {
        AliveData.rememberClientCall();
        MDC.put("sessionId", String.valueOf(httpSessionState.getSessionNumber()));
        MDC.put("userId", String.valueOf(httpSessionState.getUserId()));
        MDC.put("robotName", String.valueOf(httpSessionState.getRobotName()));
        new ClientLogger().log(loggerForRequest, fullRequest);
        String initToken = fullRequest.optString("initToken");
        httpSessionState.validateInitToken(initToken);
    }

    public static void addResultInfo(JSONObject response, AbstractProcessor processor) throws JSONException {
        String realKey = processor.getMessage().getKey();
        String responseCode = processor.succeeded() ? "ok" : "error";
        response.put("rc", responseCode);
        response.put("message", realKey);
        response.put("cause", realKey);
        response.put("parameters", processor.getParameters());
    }

    public static JSONObject addSuccessInfo(JSONObject response, Key key) throws JSONException {
        Util.addResultInfo(response, "ok", key);
        return response;
    }

    public static JSONObject addErrorInfo(JSONObject response, Key key) throws JSONException {
        Util.addResultInfo(response, "error", key);
        return response;
    }

    public static void addErrorInfo(JSONObject response, Key key, String compilerResponse) throws JSONException {
        Util.addResultInfo(response, "error", key);
        JSONObject parameters = new JSONObject();
        parameters.put("MESSAGE", compilerResponse);
        response.put("parameters", parameters);
    }

    private static void addResultInfo(JSONObject response, String restCallResultOkOrError, Key key) throws JSONException {
        String realKey = key.getKey();
        response.put("rc", restCallResultOkOrError);
        response.put("message", realKey);
        response.put("cause", realKey);
    }

    /**
     * generate a response with frontend info (see {@link #addFrontendInfo})
     *
     * @param response
     * @param httpSessionState
     * @param brickCommunicator
     * @return
     */
    public static Response responseWithFrontendInfo(JSONObject response, HttpSessionState httpSessionState, RobotCommunicator brickCommunicator) {
        Util.addFrontendInfo(response, httpSessionState, brickCommunicator);
        MDC.clear();
        return Response.ok(response).build();
    }

    /**
     * add information for the Javascript client to the result json, especially about the state of the robot.<br>
     * This method must be <b>total</b>, i.e. must <b>never</b> throw exceptions.
     *
     * @param response the response object to enrich with data
     * @param httpSessionState needed to access the token
     * @param brickCommunicator needed to access the robot's state
     */
    public static void addFrontendInfo(JSONObject response, HttpSessionState httpSessionState, RobotCommunicator brickCommunicator) {
        try {
            response.put("serverTime", new Date());
            response.put("server.version", Util.serverVersion);
            if ( httpSessionState != null ) {
                String token = httpSessionState.getToken();
                if ( token != null ) {
                    if ( token.equals(ClientAdmin.NO_CONNECT) ) {
                        response.put("robot.state", "wait");
                    } else if ( brickCommunicator != null ) {
                        RobotCommunicationData state = brickCommunicator.getState(token);
                        if ( state != null ) {
                            response.put("robot.wait", state.getRobotConnectionTime());
                            response.put("robot.battery", state.getBattery());
                            response.put("robot.name", state.getRobotName());
                            response.put("robot.version", state.getMenuVersion());
                            response.put("robot.firmwareName", state.getFirmwareName());
                            response.put("robot.sensorvalues", state.getSensorValues());
                            response.put("robot.nepoexitvalue", state.getNepoExitValue());
                            State communicationState = state.getState();
                            String infoAboutState;
                            if ( httpSessionState.isProcessing() || communicationState == State.ROBOT_IS_BUSY ) {
                                infoAboutState = "busy";
                            } else if ( state.isRobotProbablyDisconnected() || communicationState == State.GARBAGE ) {
                                infoAboutState = "disconnected";
                            } else {
                                infoAboutState = "wait"; // is there a need to distinguish the communication state more detailed?
                            }
                            response.put("robot.state", infoAboutState);
                        }
                    }
                }
                if ( httpSessionState.isInitTokenInitialized() ) {
                    response.put("initToken", httpSessionState.getInitToken());
                }
            }
        } catch ( Exception e ) {
            Util.LOG.error("when adding info for the client, an unexpected exception occurred. Some info for the client may be missing", e);
        }
    }

    /**
     * Compares two version strings.
     *
     * @note It does not work if "1.10" is supposed to be equal to "1.10.0".
     * @param str1 a string of ordinal numbers separated by decimal points.
     * @param str2 a string of ordinal numbers separated by decimal points.
     * @return The result is a negative integer if str1 is _numerically_ less than str2. The result is a positive integer if str1 is _numerically_ greater than
     *         str2. The result is zero if the strings are _numerically_ equal.
     */
    public static int versionCompare(String str1, String str2) {
        String[] vals1 = str1.split("\\.");
        String[] vals2 = str2.split("\\.");
        int i = 0;

        while ( i < vals1.length && i < vals2.length && vals1[i].equals(vals2[i]) ) {
            i++;
        }

        if ( i < vals1.length && i < vals2.length ) {
            int diff = Integer.valueOf(vals1[i]).compareTo(Integer.valueOf(vals2[i]));
            return Integer.signum(diff);
        }

        return Integer.signum(vals1.length - vals2.length);
    }

    /**
     * Look up file names with specific file extensions in a specific directory.
     *
     * @param path The path to the directory where to look for the files.
     * @param extension The file extension(s).
     * @return a list of files names or an empty list.
     */
    public static List<File> getListOfFilesFromDirectory(String path, String... extensions) {
        File dir = new File(path);
        try {
            List<File> listOfFiles = (List<File>) FileUtils.listFiles(dir, extensions, true);
            return listOfFiles;
        } catch ( Exception e ) {
            return Collections.<File> emptyList();
        }
    }

    /**
     * Reads all files provided by the list of paths. Assuming that the files content json data with one property "name" this method returns a JSON object
     * containing the json data.
     *
     * @param path to the directory
     * @param extensions of the files
     * @return
     */
    public static JSONObject getJSONObjectsFromDirectory(String path) {
        List<File> files = getListOfFilesFromDirectory(path, "json");
        JSONObject jsonObjRepresentingTheDirectory = new JSONObject();
        for ( File file : files ) {
            try {
                JSONObject jsonObjInDirectory = new JSONObject(Util1.readFileContent(file.getAbsolutePath()));
                jsonObjRepresentingTheDirectory.put(jsonObjInDirectory.getString("name").toLowerCase().replaceAll("\\s", ""), jsonObjInDirectory);
            } catch ( Exception e ) {
                // no problem, we simply ignore files without valid json data or without the property "name"
            }
        }
        return jsonObjRepresentingTheDirectory;
    }

    public static String checkProgramTextForXSS(String programText) {
        if ( programText == null ) {
            return programText;
        }
        Matcher matcher = Pattern.compile("description=\".*?\"").matcher(programText);
        String description;
        try {
            matcher.find();
            description = matcher.group();
        } catch ( IllegalStateException e ) {
            return programText;
        }
        String newDescription = description.split("description=\"")[1];
        newDescription = newDescription.substring(0, newDescription.length() - 1);
        if ( newDescription.length() == 0 ) {
            return programText;
        }
        String safeHTML = Util.removeUnwantedDescriptionHTMLTags(newDescription);
        if ( !safeHTML.equals(newDescription) ) {
            return programText.replace(description, "description=\"" + safeHTML + "\"");
        } else {
            return programText;
        }
    }

    /**
     * Remove unwanted tags and tag/attribute combinations from a string to prevent XSS
     *
     * @param input XML code containing description attribute that contains code with unwanted tags
     * @return output XML code without unwanted tags in description attribute
     */
    public static String removeUnwantedDescriptionHTMLTags(String input) {
        String[] tagWhiteList =
            {
                "b",
                "i",
                "u",
                "strike",
                "blockquote",
                "span",
                "em",
                "div",
                "font",
                "pre",
                "br",
                "ul",
                "ol",
                "li",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "p",
                "strong",
                "font"
            };
        String[] attributeWhiteList =
            {
                "size",
                "class",
                "id",
                "style",
                "color",
                "align",
                "font"
            };

        input = StringEscapeUtils.unescapeXml(input);

        HtmlChangeListener<List<String>> htmlChangeListener = new HtmlChangeListener<List<String>>() {
            @Override
            public void discardedTag(List<String> arg0, String tagName) {
                LOG.error("Discarding tag: " + tagName);
            }

            @Override
            public void discardedAttributes(List<String> arg0, String arg1, String... attributes) {
                LOG.error("Discarding attribute: " + arg1);
            }
        };

        List<String> results = new ArrayList<>();

        PolicyFactory policy =
            new HtmlPolicyBuilder()
                .allowElements(tagWhiteList)
                .allowWithoutAttributes("span")
                .allowAttributes(attributeWhiteList)
                .onElements(tagWhiteList)
                .toFactory();
        String safeHTML = policy.sanitize(input, htmlChangeListener, results);
        return StringEscapeUtils.escapeXml11(safeHTML);
    }

    /**
     * Looks for files in a specific directory and returns the names of the files found.
     *
     * @param The path to the directory where to look for the files.
     * @param extension The file extension(s).
     * @return a list of files names or an empty list.
     */
    public static List<String> getListOfFileNamesFromDirectory(String path, String extensions) {
        List<File> files = getListOfFilesFromDirectory(path, extensions);
        List<String> listOfFileNames = new ArrayList<>();
        for ( File file : files ) {
            listOfFileNames.add(file.getName());
        }
        return listOfFileNames;
    }
}
