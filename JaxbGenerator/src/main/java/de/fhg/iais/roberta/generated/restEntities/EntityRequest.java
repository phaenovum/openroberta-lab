/*
 * This is a class GENERATED by the TransportGenerator maven plugin. DON'T MODIFY IT.
 * IF you modify it, your work may be lost: the class will be overwritten automatically
 * when the maven plugin is re-executed for any reasons.
 */
package de.fhg.iais.roberta.generated.restEntities;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * the request description for the /entity REST request, TODO: remove this duplication of ListingRequest<br><br>
 * Version: 1<br>
 * Datum: 2020-06-15
 */
public class EntityRequest extends BaseRequest {
    protected String programName;
    protected String owner;
    protected String author;
    protected String configName;
    
    /**
     * the request description for the /entity REST request, TODO: remove this duplication of ListingRequest
     */
    public static EntityRequest make() {
        return new EntityRequest();
    }
    
    /**
     * the request description for the /entity REST request, TODO: remove this duplication of ListingRequest
     */
    public static EntityRequest makeFromString(String jsonS) {
        try {
            JSONObject jsonO = new JSONObject(jsonS);
            return make(jsonO);
        } catch (JSONException e) {
            throw new RuntimeException("JSON parse error when parsing: " + jsonS, e);
        }
    }
    
    /**
     * the request description for the /entity REST request, TODO: remove this duplication of ListingRequest
     */
    public static EntityRequest makeFromProperties(String cmd,String programName,String owner,String author,String configName) {
        EntityRequest entity = new EntityRequest();
        entity.setCmd(cmd);
        entity.setProgramName(programName);
        entity.setOwner(owner);
        entity.setAuthor(author);
        entity.setConfigName(configName);
        entity.immutable();
        return entity;
    }
    
    /**
     * the request description for the /entity REST request, TODO: remove this duplication of ListingRequest
     */
    public static EntityRequest make(JSONObject jsonO) {
        return make().merge(jsonO).immutable();
    }
    
    /**
     * merge the properties of a JSON-object into this bean. The bean must be "under construction".
     * The keys of the JSON-Object must be valid. The bean remains "under construction".<br>
     * Throws a runtime exception if inconsistencies are detected.
     */
    public EntityRequest merge(JSONObject jsonO) {
        try {
            for (String key : JSONObject.getNames(jsonO)) {
                if ("_version".equals(key)) {
                } else if ("cmd".equals(key)) {
                    setCmd(jsonO.optString(key));
                } else if ("programName".equals(key)) {
                    setProgramName(jsonO.getString(key));
                } else if ("owner".equals(key)) {
                    setOwner(jsonO.getString(key));
                } else if ("author".equals(key)) {
                    setAuthor(jsonO.getString(key));
                } else if ("configName".equals(key)) {
                    setConfigName(jsonO.getString(key));
                } else {
                    throw new RuntimeException("JSON parse error. Found invalid key: " + key + " in " + jsonO);
                }
            }
            return this;
        } catch (Exception e) {
            throw new RuntimeException("JSON parse / casting error when parsing: " + jsonO, e);
        }
    }
    
    /**
     * moves a bean from state "under construction" to state "immutable".<br>
     * Checks whether all required fields are set. All lists are made immutable.<br>
     * Throws a runtime exception if inconsistencies are detected.
     */
    public EntityRequest immutable() {
        if (this.immutable) {
            return this;
        }
        this.immutable = true;
        return validate();
    }
    
    /**
     * Checks whether all required fields are set.<br>
     * Throws a runtime exception if inconsistencies are detected.
     */
    private EntityRequest validate() {
        String _message = null;
        if ( !this.immutable ) {
            _message = "EntityRequest-object is already immutable: " + toString();
        }
        if ( programName == null) {
            _message = "required property programName of EntityRequest-object is not set: " + toString();
        }
        if ( owner == null) {
            _message = "required property owner of EntityRequest-object is not set: " + toString();
        }
        if ( author == null) {
            _message = "required property author of EntityRequest-object is not set: " + toString();
        }
        if ( configName == null) {
            _message = "required property configName of EntityRequest-object is not set: " + toString();
        }
        if ( _message != null ) {
            this.immutable = false;
            throw new RuntimeException(_message);
        }
        return this;
    }
    
    /**
     * GET programName. Object must be immutable. Never return null or an undefined/default value.
     */
    public String getProgramName() {
        if (!this.immutable) {
            throw new RuntimeException("no programName from an object under construction: " + toString());
        }
        return this.programName;
    }
    
    /**
     * SET programName. Object must be mutable.
     */
    public EntityRequest setProgramName(String programName) {
        if (this.immutable) {
            throw new RuntimeException("programName assigned to an immutable object: " + toString());
        }
        this.programName = programName;
        return this;
    }
    
    /**
     * GET owner. Object must be immutable. Never return null or an undefined/default value.
     */
    public String getOwner() {
        if (!this.immutable) {
            throw new RuntimeException("no owner from an object under construction: " + toString());
        }
        return this.owner;
    }
    
    /**
     * SET owner. Object must be mutable.
     */
    public EntityRequest setOwner(String owner) {
        if (this.immutable) {
            throw new RuntimeException("owner assigned to an immutable object: " + toString());
        }
        this.owner = owner;
        return this;
    }
    
    /**
     * GET author. Object must be immutable. Never return null or an undefined/default value.
     */
    public String getAuthor() {
        if (!this.immutable) {
            throw new RuntimeException("no author from an object under construction: " + toString());
        }
        return this.author;
    }
    
    /**
     * SET author. Object must be mutable.
     */
    public EntityRequest setAuthor(String author) {
        if (this.immutable) {
            throw new RuntimeException("author assigned to an immutable object: " + toString());
        }
        this.author = author;
        return this;
    }
    
    /**
     * GET configName. Object must be immutable. Never return null or an undefined/default value.
     */
    public String getConfigName() {
        if (!this.immutable) {
            throw new RuntimeException("no configName from an object under construction: " + toString());
        }
        return this.configName;
    }
    
    /**
     * SET configName. Object must be mutable.
     */
    public EntityRequest setConfigName(String configName) {
        if (this.immutable) {
            throw new RuntimeException("configName assigned to an immutable object: " + toString());
        }
        this.configName = configName;
        return this;
    }
    
    /**
     * generates a JSON-object from an immutable bean.<br>
     * Throws a runtime exception if inconsistencies are detected.
     */
    public JSONObject toJson() {
        if (!this.immutable) {
            throw new RuntimeException("no JSON from an object under construction: " + toString());
        }
        JSONObject jsonO = new JSONObject();
        try {
            jsonO.put("_version", "1");
            if (this.cmd != null) {
                jsonO.put("cmd", this.cmd);
            }
            jsonO.put("programName", this.programName);
            jsonO.put("owner", this.owner);
            jsonO.put("author", this.author);
            jsonO.put("configName", this.configName);
        } catch (JSONException e) {
            throw new RuntimeException("JSON unparse error when unparsing: " + this, e);
        }
        return jsonO;
    }
    
    @Override
    public String toString() {
        return "EntityRequest [immutable=" + this.immutable + ", cmd=" + this.cmd + ", programName=" + this.programName + ", owner=" + this.owner + ", author=" + this.author + ", configName=" + this.configName + " ]";
    }
    @Override
    public int hashCode() {
        throw new RuntimeException("no hashCode from transport beans!");
    }
    
    @Override
    public boolean equals(Object obj) {
        throw new RuntimeException("no equals from transport beans!");
    }
    
}
