package de.fhg.iais.roberta.javaServer.restServices.all.controller;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;

import de.fhg.iais.roberta.javaServer.provider.OraData;
import de.fhg.iais.roberta.persistence.ToolboxProcessor;
import de.fhg.iais.roberta.persistence.UserProcessor;
import de.fhg.iais.roberta.persistence.bo.Toolbox;
import de.fhg.iais.roberta.persistence.bo.User;
import de.fhg.iais.roberta.persistence.util.DbSession;
import de.fhg.iais.roberta.persistence.util.HttpSessionState;
import de.fhg.iais.roberta.robotCommunication.RobotCommunicator;
import de.fhg.iais.roberta.util.Key;
import de.fhg.iais.roberta.util.Util;
import de.fhg.iais.roberta.util.Util1;

@Path("/toolbox")
public class ClientToolbox {
    private static final Logger LOG = LoggerFactory.getLogger(ClientToolbox.class);

    private final RobotCommunicator brickCommunicator;

    @Inject
    public ClientToolbox(RobotCommunicator brickCommunicator) {
        this.brickCommunicator = brickCommunicator;
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response command(@OraData HttpSessionState httpSessionState, @OraData DbSession dbSession, JSONObject fullRequest) throws Exception {
        Util.handleRequestInit(httpSessionState, LOG, fullRequest);
        JSONObject response = new JSONObject();
        try {
            JSONObject request = fullRequest.getJSONObject("data");
            String cmd = request.getString("cmd");
            LOG.info("command is: " + cmd);
            response.put("cmd", cmd);
            ToolboxProcessor tp = new ToolboxProcessor(dbSession, httpSessionState);
            UserProcessor up = new UserProcessor(dbSession, httpSessionState);
            if ( cmd.equals("loadT") ) {
                String toolboxName = request.getString("name");
                String ownerName = request.getString("owner").trim();
                int userId = 0;
                if ( !ownerName.isEmpty() ) {
                    User user = up.getUser(ownerName);
                    if ( user != null ) {
                        userId = user.getId();
                    }
                }
                Toolbox toolbox = tp.getToolbox(toolboxName, userId, httpSessionState.getRobotName());
                if ( toolbox != null ) {
                    response.put("data", toolbox.getToolboxText());
                }
                Util.addResultInfo(response, tp);
            } else {
                LOG.error("Invalid command: " + cmd);
                Util.addErrorInfo(response, Key.COMMAND_INVALID);
            }
            dbSession.commit();
        } catch ( Exception e ) {
            dbSession.rollback();
            String errorTicketId = Util1.getErrorTicketId();
            LOG.error("Exception. Error ticket: " + errorTicketId, e);
            Util.addErrorInfo(response, Key.SERVER_ERROR).append("parameters", errorTicketId);
        } finally {
            if ( dbSession != null ) {
                dbSession.close();
            }
        }
        return Util.responseWithFrontendInfo(response, httpSessionState, this.brickCommunicator);
    }
}